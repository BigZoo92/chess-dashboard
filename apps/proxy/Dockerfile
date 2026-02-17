FROM node:22-alpine AS build

WORKDIR /workspace

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@10.5.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/landing/package.json apps/landing/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --no-frozen-lockfile

COPY . .

ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
ARG VITE_BASE_PATH=/dashboard/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
ARG VITE_ROUTER_BASENAME=/dashboard
ENV VITE_ROUTER_BASENAME=${VITE_ROUTER_BASENAME}
ARG PUBLIC_SITE_URL=https://chess-dashboard.enzogivernaud.fr
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL}

RUN pnpm --filter @ecoconception/web build
RUN pnpm --filter @ecoconception/landing build

FROM caddy:2.8-alpine

COPY apps/proxy/Caddyfile.prod /etc/caddy/Caddyfile
COPY --from=build /workspace/apps/landing/dist /srv/landing
COPY --from=build /workspace/apps/web/dist /srv/dashboard
