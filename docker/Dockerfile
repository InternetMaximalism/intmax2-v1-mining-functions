FROM node:22.13.0-bookworm-slim AS builder

RUN corepack enable && \
    corepack prepare yarn@4.6.0 --activate && \
    yarn set version 4.6.0

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/*/package.json ./packages/
COPY . .

RUN yarn install --immutable
RUN yarn build

FROM node:22.13.0-bookworm-slim

RUN corepack enable && \
    corepack prepare yarn@4.6.0 --activate && \
    yarn set version 4.6.0

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=builder /app/packages ./packages

RUN yarn install --immutable

EXPOSE 3000
ENTRYPOINT ["yarn"]
