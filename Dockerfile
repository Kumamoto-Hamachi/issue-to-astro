FROM node:24-slim

WORKDIR /action

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY src/ ./src/

ENTRYPOINT ["node", "/action/src/index.js"]
