FROM node:22-alpine AS base

WORKDIR /workspace

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@10.5.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --no-frozen-lockfile

COPY . .

FROM base AS dev
EXPOSE 3001
CMD ["pnpm", "--filter", "@ecoconception/api", "docker:dev"]

FROM base AS build
RUN pnpm --filter @ecoconception/api prisma:generate
RUN pnpm --filter @ecoconception/api build

FROM node:22-alpine AS prod
WORKDIR /workspace

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.5.2 --activate

COPY --from=build /workspace /workspace

EXPOSE 3001
CMD ["sh", "-c", "pnpm --filter @ecoconception/api prisma:migrate && pnpm --filter @ecoconception/api start"]
