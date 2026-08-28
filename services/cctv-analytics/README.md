# CCTV Analytics

Implements the hardware-facing CCTV adapter with deterministic synthetic fallback observations: person count, density ratio, confidence, and approximate movement speed. Its source contract can later be replaced by an OpenCV/RTSP detector without changing ingestion or WebSocket consumers.

```bash
.venv/bin/python services/cctv-analytics/main.py
```
