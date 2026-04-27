FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace manifests first (layer-cache friendly)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json            packages/shared/package.json
COPY apps/web/package.json                   apps/web/package.json

# Install all workspace deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/  packages/shared/
COPY apps/web/         apps/web/

EXPOSE 3000

CMD ["pnpm", "--filter", "@swiflo/web", "dev"]
