import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const { Pool } = pg;

const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
    pgPool: any | undefined;
};

const connectionString = process.env.DATABASE_URL;

function getPrismaClient() {
    // If no connection string, return a standard client (it will fail anyway, but won't crash the module)
    if (!connectionString) {
        console.warn('DATABASE_URL is not defined');
        return new PrismaClient();
    }

    try {
        if (!globalForPrisma.pgPool) {
            const url = new URL(connectionString);
            globalForPrisma.pgPool = new Pool({
                user: url.username,
                password: decodeURIComponent(url.password),
                host: url.hostname,
                port: parseInt(url.port || '5432'),
                database: url.pathname.slice(1),
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            globalForPrisma.pgPool.on('error', (err: any) => {
                console.error('Unexpected error on idle client', err);
            });
        }

        const adapter = new PrismaPg(globalForPrisma.pgPool);
        return new PrismaClient({ adapter });
    } catch (err) {
        console.error('Failed to initialize Prisma with adapter, falling back to standard client', err);
        return new PrismaClient();
    }
}

export const prisma = globalForPrisma.prisma || getPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
