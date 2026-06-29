FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat wget
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/db/package.json      ./packages/db/
COPY packages/types/package.json   ./packages/types/
COPY packages/utils/package.json   ./packages/utils/
COPY services/api/package.json     ./services/api/
RUN npm install

FROM deps AS builder
COPY tsconfig.base.json ./
COPY turbo.json ./

COPY packages/types ./packages/types
RUN cd packages/types && npx tsc -p tsconfig.json

COPY packages/utils ./packages/utils
RUN cd packages/utils && npx tsc -p tsconfig.json

COPY packages/db ./packages/db
RUN cd packages/db && npx tsc -p tsconfig.json

COPY services/api ./services/api
RUN cd services/api && npm run build

FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/packages/db/dist         ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json

COPY --from=builder /app/packages/types/dist         ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json

COPY --from=builder /app/packages/utils/dist         ./packages/utils/dist
COPY --from=builder /app/packages/utils/package.json ./packages/utils/package.json

COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/package.json ./services/api/package.json

WORKDIR /app/services/api
CMD ["node", "dist/index.js"]
