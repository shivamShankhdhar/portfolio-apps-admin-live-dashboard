import { NextRequest } from 'next/server';

export interface ClientMetadata {
  ip: string;
  device: string;
  location: string;
  userAgent: string;
}

/**
 * Parse a human-friendly device & browser name from the User-Agent header.
 */
export function parseDeviceFromUA(ua: string): string {
  if (!ua) return 'Unknown Device';

  let browser = 'Web Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Google Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';

  let os = 'Unknown OS';
  if (ua.includes('Mac OS X') || ua.includes('Macintosh')) {
    os = 'macOS';
  } else if (ua.includes('Windows NT 10.0')) {
    os = 'Windows 10/11';
  } else if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('iPhone')) {
    os = 'iPhone (iOS)';
  } else if (ua.includes('iPad')) {
    os = 'iPad (iPadOS)';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  }

  return `${browser} on ${os}`;
}

/**
 * Extract client IP, device, and location from an incoming NextRequest.
 */
export async function extractClientMetadata(request: NextRequest): Promise<ClientMetadata> {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');

  let ip = forwarded ? forwarded.split(',')[0].trim() : realIp || cfIp || '127.0.0.1';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  const userAgent = request.headers.get('user-agent') || '';
  const device = parseDeviceFromUA(userAgent);

  // Check geo headers (Cloudflare, Vercel, etc.)
  const city = request.headers.get('x-vercel-ip-city') || request.headers.get('cf-ipcity');
  const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry');
  const region = request.headers.get('x-vercel-ip-country-region');

  let location = 'Localhost (Development Environment)';
  if (city || country) {
    const parts = [city, region, country].filter(Boolean);
    location = parts.join(', ');
  } else if (ip !== '127.0.0.1' && !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('172.')) {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.city || data.country_name)) {
          location = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
        }
      }
    } catch {
      location = 'Remote Network';
    }
  }

  return {
    ip,
    device,
    location,
    userAgent,
  };
}
