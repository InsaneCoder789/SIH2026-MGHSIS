# Band Simulator

Publishes deterministic, zone-aggregated Smart Safety Band gateway observations through the production hardware-ingestion contract. It supports the `demo`, `medium`, `large`, and `stress` fleet sizes from `MASTER.md` without creating browser components for every device.

```bash
.venv/bin/python services/band-simulator/main.py --mode large
```

Use `--ticks 1` for a single integration-test cycle.
