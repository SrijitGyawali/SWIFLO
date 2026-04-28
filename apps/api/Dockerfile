FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy entire monorepo (node_modules excluded via .dockerignore)
COPY . .

# Install all workspace deps with flat node_modules
RUN pnpm install --shamefully-hoist

# Generate Prisma client
RUN pnpm --filter @swiflo/api db:generate

EXPOSE 3001

CMD ["pnpm", "--filter", "@swiflo/api", "dev"]
