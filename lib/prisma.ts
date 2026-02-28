import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

function debugLog(msg: string) {
    const logPath = path.join(process.cwd(), 'server_debug.log');
    fs.appendFileSync(logPath, `[PRISMA_INIT] ${new Date().toISOString()} ${msg}\n`);
}

const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
    pgPool: any | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!globalForPrisma.pgPool && connectionString) {
    const url = new URL(connectionString);
    globalForPrisma.pgPool = new Pool({
        user: url.username,
        password: decodeURIComponent(url.password),
        host: url.hostname,
        port: parseInt(url.port || '5432'),
        database: url.pathname.slice(1),
        ssl: false,
    });
    debugLog('Pool created with SSL: false');
}

const adapter = new PrismaPg(globalForPrisma.pgPool);

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
