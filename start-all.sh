#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

api_pid=""
web_pid=""
simulator_pids=()
infra_started=false
cleaned_up=false

log() {
  printf '\n[MGHSIS] %s\n' "$1"
}

fail() {
  printf '\n[MGHSIS] ERROR: %s\n' "$1" >&2
  exit 1
}

port_is_busy() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

cleanup() {
  if [[ "$cleaned_up" == true ]]; then
    return
  fi
  cleaned_up=true
  trap - EXIT INT TERM

  log "Stopping the web application and API..."
  [[ -n "$web_pid" ]] && kill "$web_pid" 2>/dev/null || true
  [[ -n "$api_pid" ]] && kill "$api_pid" 2>/dev/null || true
  for pid in "${simulator_pids[@]-}"; do
    kill "$pid" 2>/dev/null || true
  done
  [[ -n "$web_pid" ]] && wait "$web_pid" 2>/dev/null || true
  [[ -n "$api_pid" ]] && wait "$api_pid" 2>/dev/null || true
  for pid in "${simulator_pids[@]-}"; do
    wait "$pid" 2>/dev/null || true
  done

  if [[ "$infra_started" == true ]]; then
    log "Stopping PostgreSQL and Redis..."
    docker compose stop postgres redis >/dev/null 2>&1 || true
  fi

  log "Everything has stopped."
}

trap cleanup EXIT INT TERM

command -v docker >/dev/null 2>&1 || fail "Docker is not installed or is not available in PATH."
command -v npm >/dev/null 2>&1 || fail "npm is not installed or is not available in PATH."
command -v lsof >/dev/null 2>&1 || fail "lsof is required to check the application ports."
docker info >/dev/null 2>&1 || fail "Docker Desktop is not running. Open it and wait until Docker is ready."

[[ -d node_modules ]] || fail "Frontend dependencies are missing. Run: npm install"
[[ -x .venv/bin/uvicorn ]] || fail "API dependencies are missing. Create .venv and install apps/api/requirements.txt."
PYTHON_EXECUTABLE="$(sed -n '1s/^#!//p' .venv/bin/uvicorn)"
[[ -x "$PYTHON_EXECUTABLE" ]] || fail "The Python runtime used by uvicorn is unavailable. Recreate .venv."

if port_is_busy 3000; then
  fail "Port 3000 is already in use. Stop the existing frontend process first."
fi

if port_is_busy 8000; then
  fail "Port 8000 is already in use. Stop the existing API process first."
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

log "Starting PostgreSQL and Redis..."
docker compose up -d postgres redis
infra_started=true

log "Waiting for infrastructure health checks..."
for attempt in $(seq 1 30); do
  redis_ready=false
  postgres_ready=false

  if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    redis_ready=true
  fi

  if docker compose exec -T postgres pg_isready \
    -U "${POSTGRES_USER:-mghsis}" \
    -d "${POSTGRES_DB:-mghsis}" >/dev/null 2>&1; then
    postgres_ready=true
  fi

  if [[ "$redis_ready" == true && "$postgres_ready" == true ]]; then
    break
  fi

  if [[ "$attempt" -eq 30 ]]; then
    fail "PostgreSQL or Redis did not become ready within 60 seconds."
  fi

  sleep 2
done

log "Starting the FastAPI backend on http://localhost:8000..."
PYTHONPATH="$ROOT_DIR/apps/api" "$ROOT_DIR/.venv/bin/uvicorn" app.main:app \
  --app-dir "$ROOT_DIR/apps/api" \
  --reload \
  --host 127.0.0.1 \
  --port 8000 &
api_pid=$!

log "Waiting for the API readiness endpoint..."
for attempt in $(seq 1 40); do
  if "$PYTHON_EXECUTABLE" -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/system/readiness', timeout=1)" >/dev/null 2>&1; then
    break
  fi
  if [[ "$attempt" -eq 40 ]]; then
    fail "The FastAPI service did not become ready within 40 seconds."
  fi
  sleep 1
done

log "Starting live band, CCTV and gate telemetry streams..."
"$PYTHON_EXECUTABLE" services/band-simulator/main.py --mode large --interval 2 &
simulator_pids+=("$!")
"$PYTHON_EXECUTABLE" services/cctv-analytics/main.py --interval 2.5 &
simulator_pids+=("$!")
"$PYTHON_EXECUTABLE" services/gate-simulator/main.py --interval 3 &
simulator_pids+=("$!")

log "Starting the Next.js portal on http://localhost:3000..."
npm run dev &
web_pid=$!

printf '\n[MGHSIS] All services are starting.\n'
printf '[MGHSIS] Portal:      http://localhost:3000\n'
printf '[MGHSIS] Digital Twin: http://localhost:3000/digital-twin\n'
printf '[MGHSIS] API Docs:     http://localhost:8000/docs\n'
printf '[MGHSIS] Telemetry:    10,000 bands + CCTV + gate streams\n'
printf '[MGHSIS] Press Ctrl+C to stop everything.\n\n'

while true; do
  if ! kill -0 "$api_pid" 2>/dev/null; then
    set +e
    wait "$api_pid"
    exit_code=$?
    set -e
    fail "The API stopped unexpectedly with exit code $exit_code."
  fi

  if ! kill -0 "$web_pid" 2>/dev/null; then
    set +e
    wait "$web_pid"
    exit_code=$?
    set -e
    fail "The frontend stopped unexpectedly with exit code $exit_code."
  fi

  for pid in "${simulator_pids[@]-}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      set +e
      wait "$pid"
      exit_code=$?
      set -e
      fail "A telemetry simulator stopped unexpectedly with exit code $exit_code."
    fi
  done

  sleep 2
done
