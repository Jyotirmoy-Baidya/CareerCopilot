FROM node:20-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/db/package.json ./packages/db/
RUN npm install

COPY packages/db ./packages/db
COPY drizzle.config.ts ./
COPY tsconfig.base.json ./

# Run versioned migrations (tracks applied files in __drizzle_migrations table),
# then seed the skill graph and exit.
CMD ["sh", "-c", "npx drizzle-kit migrate && npx tsx packages/db/seed/index.ts"]
