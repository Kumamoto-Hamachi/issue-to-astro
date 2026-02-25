FROM node:24-slim

WORKDIR /action

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY dist/src/ ./dist/src/

ENTRYPOINT ["node", "/action/dist/src/index.js"]
