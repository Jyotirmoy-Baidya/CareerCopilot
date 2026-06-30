# CareerCopilot AI

An offline-first AI career mentor platform for self-taught developers. It builds a personalized skill roadmap, assigns daily tasks, and gives learners a 24/7 AI mentor — while letting study groups collaborate on shared notes in real time, even with unreliable internet.

## What it does

- **Personalized roadmap** — generates a skill graph from a learner's current skills and target role, with daily tasks and streak tracking
- **AI mentor** — chat-based doubt-solving, resume review, quiz generation, and writing assistance inside the notes editor, all via OpenRouter
- **Real-time collaborative notes (Syncdoc)** — study groups co-edit shared notes using Yjs CRDTs, with role-based write permissions and version history
- **Offline-first** — every action is saved locally first (IndexedDB/Dexie) and syncs automatically once the connection returns; no data loss on flaky networks
- **Free-tier AI usage limits** — per-account caps on AI calls, enforced server-side via Redis (not just client-side)

## Stack

Next.js · TypeScript · Express · Drizzle ORM · PostgreSQL · Redis · Yjs · Dexie · OpenRouter · Turborepo (monorepo)

## Project structure

```
apps/web/        Next.js frontend
services/api/     Combined backend (auth, sync, AI, collaboration, recommendation, notifications)
services/*        Standalone versions of each microservice (for independent dev/scaling)
packages/db/      Drizzle schema, migrations, seed data
packages/types/   Shared TypeScript types
packages/utils/   Shared utilities
```

## Running locally

```bash
npm install
npm run dev
```

See `Plan.md` for full architecture details, database schema, and environment variable reference.

## Database migrations

```bash
npm run db:generate   # generate a new migration from schema changes
npm run db:migrate     # apply pending migrations
```
