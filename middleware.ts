import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;
    const { pathname } = request.nextUrl;

    // Paths that require authentication
    const isProtectedPath = pathname.startsWith('/jlabs/home');
    // Paths that should not be accessible when logged in
    const isAuthPath = pathname === '/jlabs/login';

    if (isProtectedPath) {
        if (!token) {
            return NextResponse.redirect(new URL('/jlabs/login', request.url));
        }

        try {
            await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
            return NextResponse.next();
        } catch (error) {
            // Invalid token
            const response = NextResponse.redirect(new URL('/jlabs/login', request.url));
            response.cookies.delete('auth-token');
            return response;
        }
    }

    if (isAuthPath) {
        if (token) {
            try {
                await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
                return NextResponse.redirect(new URL('/jlabs/home', request.url));
            } catch (error) {
                // Token invalid, allow login page but clear cookie
                const response = NextResponse.next();
                response.cookies.delete('auth-token');
                return response;
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/jlabs/:path*'],
};
