FROM node:24.6.0-bookworm-slim AS builder

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

FROM node:24.6.0-bookworm-slim

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

ARG LICENSE_KEY
RUN if [ -n "$LICENSE_KEY" ]; then \
        echo "License key provided. Updating geoip-lite database."; \
        node ./node_modules/geoip-lite/scripts/updatedb.js license_key=$LICENSE_KEY; \
    else \
        echo "License key not provided. Skipping geoip-lite database update."; \
    fi

EXPOSE 3000
ENTRYPOINT ["yarn"]
