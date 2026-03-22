# SKYLINE PREDICT – Real Estate Intelligence Platform
## SAMSUNG Campus Innovation Project

## Overview

A real estate price prediction and investment analysis platform for Chennai. Built for the SAMSUNG Campus Innovation Challenge. Uses ML-inspired value scoring, news sentiment analysis, and connectivity metrics to help buyers/investors make data-driven decisions.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24 (frontend toolchain only)
- **Python version**: 3.11 (backend API)
- **Package manager**: pnpm (frontend), pip (backend)
- **Frontend**: React + Vite, Tailwind CSS v4, Leaflet maps, Recharts
- **Backend API**: Python FastAPI + Uvicorn (with hot-reload)
- **Database**: PostgreSQL + Drizzle ORM (schema), psycopg2 (Python runtime)
- **Validation**: Zod (frontend), Pydantic (backend)
- **API codegen**: Orval (from OpenAPI spec)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/
│   │   ├── api/
│   │   │   └── main.py       # Python FastAPI app (primary backend)
│   │   └── src/              # Legacy TypeScript routes (no longer active)
│   └── property-intel/       # React + Vite frontend at /
├── lib/
│   ├── api-spec/             # OpenAPI spec + Orval codegen config
│   ├── api-client-react/     # Generated React Query hooks
│   ├── api-zod/              # Generated Zod schemas
│   └── db/                   # Drizzle ORM schema + DB connection
├── scripts/
│   ├── src/seed_chennai.ts   # Chennai property dataset seeder (active)
│   └── src/seed.ts           # Bengaluru dataset seeder (archived)
```

## Features

1. **Intelligence Map** - Full-screen Leaflet/OpenStreetMap with color-coded pins
   - 🟢 Green = Good Value / Underpriced
   - 🔵 Blue = Overpriced
   - 🔴 Red = Risky / Poor value
2. **Property Detail** - Full analysis with price comparison, investment outlook, landmarks, price history chart (Recharts)
3. **Area Analytics** - Neighborhood comparison table with 1Y/3Y appreciation rates
4. **Market Signals** - News feed with sentiment tagging by topic and area

## Python Backend

The FastAPI server lives at `artifacts/api-server/api/main.py`. It uses:
- **psycopg2** for PostgreSQL connectivity
- **FastAPI** for REST API routing
- **JSONResponse** with camelCase key conversion for frontend compatibility
- Uvicorn with `--reload` in dev mode

Run command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT --reload`

## Chennai Dataset

Areas: OMR (IT Corridor), Sholinganallur, Velachery, Anna Nagar, Porur, Perambur, Tambaram, Adyar

Properties: 8 sample listings spanning flat, villa, house, plot types with varied value labels

News: 10 articles including SAMSUNG AWS expansion, Metro Phase 2, flood alerts, policy news

## API Endpoints

- `GET /api/properties` — filters: city, type, minPrice, maxPrice, valueLabel, verifiedOnly
- `GET /api/properties/:id` — full detail with landmarks, news sentiment, price history
- `GET /api/areas` — area analytics list
- `GET /api/news` — news articles with filters

## Database

Run `pnpm --filter @workspace/scripts run seed-chennai` to seed Chennai data.
Schema managed via Drizzle Kit: `pnpm --filter @workspace/db run push`
