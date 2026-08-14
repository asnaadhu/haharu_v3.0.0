export interface ClientMeta {
  ipAddress: string;
  browser: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  os: string;
  userAgent: string;
}

let cachedIp: string | null = null;

// Asynchronously fetch client public IP with fallback
export async function fetchClientIp(): Promise<string> {
  if (cachedIp) return cachedIp;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        cachedIp = data.ip;
        return data.ip;
      }
    }
  } catch {
    // ignore fetch error
  }

  // Local/Network IP default fallback
  cachedIp = '192.168.1.105';
  return cachedIp;
}

// Pre-trigger IP fetch on module load
if (typeof window !== 'undefined') {
  fetchClientIp();
}

// Synchronously parse User Agent string for Browser, OS, and Device Type
export function parseUserAgent(uaString?: string): { browser: string; deviceType: 'Desktop' | 'Mobile' | 'Tablet'; os: string } {
  const ua = uaString || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  let os = 'Unknown OS';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6.1/i.test(ua)) os = 'Windows 7';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'ChromeOS';

  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    deviceType = 'Mobile';
  }

  let browser = 'Unknown Browser';
  if (/edg\//i.test(ua)) {
    const match = ua.match(/edg\/([\d.]+)/i);
    browser = `Edge ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/opr\/|opera/i.test(ua)) {
    const match = ua.match(/(?:opr|opera)\/([\d.]+)/i);
    browser = `Opera ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/chrome|crios|crmo/i.test(ua) && !/edg\//i.test(ua)) {
    const match = ua.match(/(?:chrome|crios|crmo)\/([\d.]+)/i);
    browser = `Chrome ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/firefox|fxios/i.test(ua)) {
    const match = ua.match(/(?:firefox|fxios)\/([\d.]+)/i);
    browser = `Firefox ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua)) {
    const match = ua.match(/version\/([\d.]+)/i);
    browser = `Safari ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/trident/i.test(ua)) {
    browser = 'Internet Explorer';
  }

  return { browser, deviceType, os };
}

export function getFullClientMeta(): ClientMeta {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const parsed = parseUserAgent(ua);

  if (!cachedIp) {
    fetchClientIp();
  }

  return {
    ipAddress: cachedIp || '192.168.1.105',
    browser: `${parsed.browser} (${parsed.os})`,
    deviceType: parsed.deviceType,
    os: parsed.os,
    userAgent: ua,
  };
}
