import fp from 'fastify-plugin';

type PrismaLikeClient = {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $queryRaw(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
};

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaLikeClient;
  }
}

export const prismaPlugin = fp(async (app) => {
  const prismaImport = (await import('@prisma/client')) as unknown as {
    PrismaClient?: new () => PrismaLikeClient;
    default?: { PrismaClient?: new () => PrismaLikeClient };
  };
  const PrismaClient = prismaImport.PrismaClient ?? prismaImport.default?.PrismaClient;

  if (!PrismaClient) {
    throw new Error('PrismaClient is unavailable. Run `pnpm db:generate` before starting the API.');
  }

  const prisma = new PrismaClient();
  await prisma.$connect();
  app.decorate('prisma', prisma);
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
