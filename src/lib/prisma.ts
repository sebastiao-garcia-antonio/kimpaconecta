import { PrismaClient } from "@prisma/client";

const defaultDbUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_qAIowshP84iD@ep-young-shadow-aeg8d8fm.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: defaultDbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
