import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/client/client";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as { selvedgePrisma?: PrismaClient };

export const prisma =
  globalForPrisma.selvedgePrisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.databaseUrl }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.selvedgePrisma = prisma;
}

export type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export const TX_OPTIONS = { maxWait: 20_000, timeout: 30_000 } as const;