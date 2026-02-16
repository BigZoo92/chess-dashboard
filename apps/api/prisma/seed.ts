import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const username = 'BigZoo92';

await prisma.player.upsert({
  where: { username },
  update: {},
  create: { username }
});

await prisma.$disconnect();
