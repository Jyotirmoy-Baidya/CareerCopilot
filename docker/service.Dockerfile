# Shared Dockerfile for all six microservices.
# Pass --build-arg SERVICE=auth (or recommendation, sync, collaboration, ai, notification).

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat wget
WORKDIR /app

# ── Install workspace dependencies ───────────────────────────────────────────
# We copy every package.json so npm can wire up all workspace symlinks.
FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/db/package.json      ./packages/db/
COPY packages/types/package.json   ./packages/types/
COPY packages/utils/package.json   ./packages/utils/
COPY services/auth/package.json           ./services/auth/
COPY services/recommendation/package.json ./services/recommendation/
COPY services/sync/package.json           ./services/sync/
COPY services/collaboration/package.json  ./services/collaboration/
COPY services/ai/package.json             ./services/ai/
COPY services/notification/package.json   ./services/notification/
RUN npm install

# ── Build shared packages, then the requested service ────────────────────────
# Shared packages must compile first so the service tsc can resolve their types.
# Start FROM deps (not base) so all workspace node_modules — including any
# packages that npm did not hoist to root — are already in place.
FROM deps AS builder
ARG SERVICE
COPY tsconfig.base.json ./

COPY packages/types ./packages/types
RUN cd packages/types && npx tsc -p tsconfig.json

COPY packages/utils ./packages/utils
RUN cd packages/utils && npx tsc -p tsconfig.json

COPY packages/db ./packages/db
RUN cd packages/db && npx tsc -p tsconfig.json

COPY services/${SERVICE} ./services/${SERVICE}
RUN cd services/${SERVICE} && npm run build

# ── Minimal runtime image ─────────────────────────────────────────────────────
# Only compiled JS lands here — no TypeScript source, no dev tooling.
FROM base AS runner
ARG SERVICE
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/packages/db/dist         ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json

COPY --from=builder /app/packages/types/dist         ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json

COPY --from=builder /app/packages/utils/dist         ./packages/utils/dist
COPY --from=builder /app/packages/utils/package.json ./packages/utils/package.json

COPY --from=builder /app/services/${SERVICE}/dist ./services/${SERVICE}/dist

WORKDIR /app/services/${SERVICE}
CMD ["node", "dist/index.js"]
