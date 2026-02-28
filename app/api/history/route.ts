import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'server_debug.log');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

function logToFile(msg: string) {
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(LOG_FILE, `[${timestamp}] [HISTORY_API] ${msg}\n`);
    } catch (e) {
        console.error('Logging failed:', e);
    }
}

// Helper to get user from cookie
async function getAuthUser(req: NextRequest) {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
        );
        return payload as { userId: number; email: string };
    } catch (err) {
        return null;
    }
}

export async function GET(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const histories = await prisma.searchHistory.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(histories);
    } catch (error: any) {
        logToFile(`GET_ERROR: ${error.message}`);

        logToFile(`FALLBACK_START: DB_URL_PRESENT=${!!process.env.DATABASE_URL}`);
        // --- FALLBACK TO DIRECT PG ---
        const pool = new pg.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: false
        });
        try {
            logToFile(`FALLBACK_QUERY_START`);
            const result = await pool.query(
                'SELECT * FROM "SearchHistory" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
                [user.userId]
            );
            logToFile(`FALLBACK_QUERY_SUCCESS: rows=${result.rowCount}`);
            return NextResponse.json(result.rows);
        } catch (pgErr: any) {
            logToFile(`GET_FALLBACK_ERROR: ${pgErr.message}`);
            return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
        } finally {
            await pool.end();
        }
    }
}

export async function POST(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const { ipAddress, city, region, country, isp, asn, timezone, latitude, longitude, geoInfo } = body;

    try {
        const newEntry = await prisma.searchHistory.create({
            data: {
                ipAddress,
                city,
                region,
                country,
                isp,
                asn,
                timezone,
                latitude,
                longitude,
                geoInfo,
                userId: user.userId,
            },
        });

        return NextResponse.json(newEntry);
    } catch (error: any) {
        logToFile(`POST_ERROR: ${error.message}`);

        // --- FALLBACK TO DIRECT PG ---
        const pool = new pg.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: false
        });
        try {
            logToFile(`POST_FALLBACK_QUERY_START`);
            const result = await pool.query(
                `INSERT INTO "SearchHistory" 
                ("ipAddress", city, region, country, isp, asn, timezone, latitude, longitude, "geoInfo", "userId", "createdAt") 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
                RETURNING *`,
                [ipAddress, city, region, country, isp, asn, timezone, latitude, longitude, JSON.stringify(geoInfo), user.userId]
            );
            logToFile(`POST_FALLBACK_QUERY_SUCCESS`);
            return NextResponse.json(result.rows[0]);
        } catch (pgErr: any) {
            logToFile(`POST_FALLBACK_ERROR: ${pgErr.message}`);
            return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
        } finally {
            await pool.end();
        }
    }
}

export async function DELETE(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    let ids;
    try {
        const body = await req.json();
        ids = body.ids;
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    if (!ids || !Array.isArray(ids)) {
        return NextResponse.json({ message: 'Invalid IDs provided' }, { status: 400 });
    }

    try {
        await prisma.searchHistory.deleteMany({
            where: {
                id: { in: ids },
                userId: user.userId,
            },
        });

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        logToFile(`DELETE_ERROR: ${error.message}`);

        // --- FALLBACK TO DIRECT PG ---
        const pool = new pg.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: false
        });
        try {
            logToFile(`DELETE_FALLBACK_QUERY_START`);
            await pool.query(
                'DELETE FROM "SearchHistory" WHERE id = ANY($1) AND "userId" = $2',
                [ids, user.userId]
            );
            logToFile(`DELETE_FALLBACK_QUERY_SUCCESS`);
            return NextResponse.json({ message: 'Deleted successfully' });
        } catch (pgErr: any) {
            logToFile(`DELETE_FALLBACK_ERROR: ${pgErr.message}`);
            return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
        } finally {
            await pool.end();
        }
    }
}
