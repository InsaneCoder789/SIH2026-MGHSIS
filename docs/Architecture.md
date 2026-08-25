# Architecture

This repository follows the architecture in `MASTER.md`:

- Next.js command-centre frontend
- FastAPI core backend
- PostgreSQL for persistent history
- Redis for live state/cache
- Separate simulator and analytics services
- Explainable rules for Human Risk, Crowd Risk, and Population Integrity Risk

The current implementation is the repository foundation plus a frontend Digital Twin slice.
