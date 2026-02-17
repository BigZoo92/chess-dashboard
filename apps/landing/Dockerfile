FROM node:22-alpine AS base

WORKDIR /workspace

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@10.5.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/landing/package.json apps/landing/package.json
RUN pnpm install --no-frozen-lockfile

COPY . .

FROM base AS dev
EXPOSE 4321
CMD ["pnpm", "--filter", "@ecoconception/landing", "docker:dev"]

FROM base AS build
RUN pnpm --filter @ecoconception/landing build

FROM caddy:2.8-alpine AS prod
COPY --from=build /workspace/apps/landing/dist /srv
COPY apps/landing/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
