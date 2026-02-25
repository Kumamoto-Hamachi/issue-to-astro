FROM node:24-slim

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /action

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src/ ./src/

RUN corepack enable && pnpm install --frozen-lockfile && pnpm build && pnpm prune --prod

ENTRYPOINT ["node", "/action/dist/src/index.js"]
