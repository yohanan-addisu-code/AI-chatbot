# Tempo Scheduling Assistant

Tempo is a responsive React + TypeScript scheduling assistant that turns constraints, energy, priorities, and deadlines into a realistic daily plan. It runs with deterministic mock data and a local scheduling engine, so no API key is required.

## Run Normally on Windows

Install Node.js LTS once, then double-click `start-tempo.bat`. It installs dependencies on the first run, starts Tempo, and opens it in your browser automatically.

## Setup Manually

```bash
npm install
npm run dev
```

Validation commands: `npm run build`, `npm run test`, and `npm run lint`.

## Architecture

- `src/types.ts` contains the domain contracts for tasks, events, preferences, and schedule blocks.
- `src/scheduler.ts` is the UI-independent scheduling engine. It orders by priority, respects fixed commitments, adds buffers and breaks, limits demanding tasks, and explains unscheduled work.
- `src/App.tsx` contains the dashboard, conversational setup, schedule, tasks, and settings interactions.

The mock assistant is intentionally local. To connect a provider later, replace the reply function in `App.tsx` with a server-side API call. Keep provider keys on the server and pass only validated user context from the client.
