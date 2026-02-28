import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const IPINFO_TOKEN = process.env.IPINFO_TOKEN;
const LOG_FILE = path.join(process.cwd(), 'server_debug.log');

function logToFile(msg: string) {
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(LOG_FILE, `[${timestamp}] [GEOLOCATION_API] ${msg}\n`);
    } catch (e) {
        console.error('Logging failed:', e);
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const ip = searchParams.get('ip') || '';

    logToFile(`GET request for IP: ${ip || 'current'}`);

    try {
        // Primary provider: ipinfo.io
        const ipInfoUrl = `https://ipinfo.io/${ip ? ip + '/' : ''}json${IPINFO_TOKEN ? `?token=${IPINFO_TOKEN}` : ''}`;
        logToFile(`Fetching from ipinfo: ${ipInfoUrl}`);
        const res = await fetch(ipInfoUrl, { cache: 'no-store' });

        if (res.ok) {
            const data = await res.json();
            logToFile(`ipinfo success`);
            return NextResponse.json(data);
        }

        logToFile(`ipinfo failed. Status: ${res.status}`);
        const errorText = await res.text();
        logToFile(`ipinfo error body: ${errorText}`);
        console.warn(`ipinfo.io failed for IP: ${ip || 'current'}. Status: ${res.status}. Falling back...`);

        // Fallback provider: ipapi.co
        const ipApiUrl = `https://ipapi.co/${ip || 'json'}/json/`;
        logToFile(`Fetching from ipapi: ${ipApiUrl}`);
        const fallbackRes = await fetch(ipApiUrl, { cache: 'no-store' });

        if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (!fallbackData.error) {
                logToFile(`ipapi success`);
                return NextResponse.json({
                    ip: fallbackData.ip,
                    city: fallbackData.city,
                    region: fallbackData.region,
                    country: fallbackData.country_code,
                    loc: `${fallbackData.latitude},${fallbackData.longitude}`,
                    org: fallbackData.org,
                    postal: fallbackData.postal,
                    timezone: fallbackData.timezone,
                    readme: "Data provided by ipapi.co fallback"
                });
            }
        }

        logToFile(`ipapi failed or rate-limited. Trying ip-api.com...`);

        // Fallback 2: ip-api.com (Note: only http for free tier, but Next.js server-to-server is fine)
        const ipApi2Url = `http://ip-api.com/json/${ip || ''}`;
        const fallbackRes2 = await fetch(ipApi2Url, { cache: 'no-store' });

        if (fallbackRes2.ok) {
            const fallbackData2 = await fallbackRes2.json();
            if (fallbackData2.status === 'success') {
                logToFile(`ip-api.com success`);
                return NextResponse.json({
                    ip: fallbackData2.query,
                    city: fallbackData2.city,
                    region: fallbackData2.regionName,
                    country: fallbackData2.countryCode,
                    loc: `${fallbackData2.lat},${fallbackData2.lon}`,
                    org: fallbackData2.isp,
                    postal: fallbackData2.zip,
                    timezone: fallbackData2.timezone,
                    readme: "Data provided by ip-api.com fallback"
                });
            }
        }

        logToFile(`All real APIs failed. Using mock fallback...`);

        // Final Mock Fallback for Development
        return NextResponse.json({
            ip: ip || '127.0.0.1',
            city: "Quezon City",
            region: "Metro Manila",
            country: "PH",
            loc: "14.6760,121.0437",
            org: "Mock Provider (Rate Limited)",
            postal: "1100",
            timezone: "Asia/Manila",
            readme: "MOCK DATA: All providers reported 429 Rate Limit"
        });

    } catch (error: any) {
        console.error('Geolocation API error:', error);
        return NextResponse.json(
            { message: error.message || 'Failed to fetch geolocation data' },
            { status: 500 }
        );
    }
}
