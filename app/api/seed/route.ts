import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const email = 'test@example.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists first to determine "Created" vs "Existing"
        const existing = await prisma.user.findUnique({
            where: { email }
        });

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                updatedAt: new Date(),
            },
            create: {
                email,
                password: hashedPassword,
            },
        });

        return NextResponse.json({
            message: existing ? 'User already exists - Credentials Updated' : 'New User Seeded Successfully',
            status: existing ? 'exists' : 'created',
            credentials: {
                email: 'test@example.com',
                password: 'password123'
            }
        });
    } catch (error: any) {
        console.error('Seeding error:', error);
        return NextResponse.json({
            message: 'Seeding failed',
            error: error.message
        }, { status: 500 });
    }
}
