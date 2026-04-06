# HowardAI_Studio SaaS

This repository contains the HowardAI_Studio SaaS application, built following the strictly defined P0~P1 architecture rules.

## Architecture & Tech Stack
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript
- **Database**: MongoDB (local development via Docker) / Firebase (target)
- **Cache/Queue**: Managed Redis (local development via Docker)
- **Architecture**: Modular Monolith, entirely Dockerized

## Local Development (Localhost)

The entire application can be run locally using Docker Compose, containing the frontend, backend API, MongoDB, and Redis.

### Starting the environment
**Windows**: Run `start.bat`
**macOS/Linux**: Run `./start.sh`

Alternatively, you can manually run:
```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Deployment Strategy (Cloud Run)

In accordance with the SaaS guidelines, the first official production deployment strategy is **Google Cloud Run** to lower the initial market verification costs.

Both `frontend` and `backend` directories contain optimized `Dockerfile`s suitable for Cloud Run deployments:
1. The Next.js frontend uses `output: 'standalone'` for a minimal image footprint.
2. The NestJS backend explicitly listens on `0.0.0.0` and utilizes multi-stage building.
