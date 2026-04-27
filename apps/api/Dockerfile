FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace manifests first (layer-cache friendly)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json            packages/shared/package.json
COPY apps/api/package.json                   apps/api/package.json

# Install all workspace deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/  packages/shared/
COPY apps/api/         apps/api/

# Generate Prisma client
RUN pnpm --filter @swiflo/api db:generate

EXPOSE 3001

CMD ["pnpm", "--filter", "@swiflo/api", "dev"]
