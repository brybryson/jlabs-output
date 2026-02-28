import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Log to a file we can definitely read
function debugLog(data: any) {
    const logPath = path.join(process.cwd(), 'server_debug.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${JSON.stringify(data, null, 2)}\n---\n`;
    fs.appendFileSync(logPath, logMessage);
    console.log('--- DEBUG_LOG [Login API] ---', data);
}

export async function POST(req: NextRequest) {
    debugLog({ status: 'API_CALLED' });

    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        let user: any = null;

        // --- TRY PRISMA FIRST ---
        try {
            user = await prisma.user.findUnique({
                where: { email },
            });
            debugLog({ status: 'PRISMA_SUCCESS', found: !!user });
        } catch (prismaErr: any) {
            debugLog({ status: 'PRISMA_FAILED', error: prismaErr.message });

            // --- FALLBACK TO DIRECT PG ---
            debugLog({ status: 'FALLBACK_TO_PG_START' });
            const pool = new pg.Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });

            try {
                const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
                user = result.rows[0];
                debugLog({ status: 'PG_FALLBACK_SUCCESS', found: !!user });
            } catch (pgErr: any) {
                debugLog({ status: 'PG_FALLBACK_FAILED', error: pgErr.message });
                throw pgErr; // If both fail, we rethrow
            } finally {
                await pool.end();
            }
        }

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            debugLog({ status: 'INVALID_PASSWORD', email });
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Create JWT token
        const token = await new SignJWT({
            userId: user.id,
            email: user.email
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(new TextEncoder().encode(JWT_SECRET));

        const response = NextResponse.json(
            { message: 'Login successful' },
            { status: 200 }
        );

        // Set auth-token cookie
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        debugLog({ status: 'SUCCESSFUL_LOGIN', email });
        return response;
    } catch (error: any) {
        debugLog({
            status: 'SERVER_ERROR',
            message: error.message,
            stack: error.stack
        });

        console.error('SERVER_ERROR [Login API]:', error);

        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
