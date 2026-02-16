FROM node:22-alpine

WORKDIR /workspace

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@10.5.2 --activate

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --no-frozen-lockfile

COPY . .

EXPOSE 3001

CMD ["pnpm", "--filter", "@ecoconception/api", "docker:dev"]
