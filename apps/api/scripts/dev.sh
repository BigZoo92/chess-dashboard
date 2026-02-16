#!/bin/sh
set -e

pnpm exec tsx scripts/wait-for-db.ts
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
