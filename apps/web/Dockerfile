FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy entire monorepo (node_modules excluded via .dockerignore)
COPY . .

# Install all workspace deps with flat node_modules
RUN pnpm install --shamefully-hoist

EXPOSE 3000

CMD ["pnpm", "--filter", "@swiflo/web", "dev"]
