# Scenario Engine

Drives the Redis-backed scenario API, advances virtual ticks, and can apply an operator intervention before reporting aggregate model output.

```bash
.venv/bin/python services/scenario-engine/main.py --scenario congestion --ticks 4
.venv/bin/python services/scenario-engine/main.py --scenario congestion --action REDIRECT_TO_ZONE --zone G
```
