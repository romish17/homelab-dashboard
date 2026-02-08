import { Router, Request, Response } from 'express';

const router = Router();

const cache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

// Sources to try in order, from best quality to lowest
function getFaviconSources(domain: string): string[] {
  return [
    `https://${domain}/apple-touch-icon.png`,
    `https://${domain}/apple-touch-icon-precomposed.png`,
    `https://${domain}/favicon-32x32.png`,
    `https://${domain}/favicon.png`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://${domain}/favicon.ico`,
  ];
}

async function fetchWithTimeout(url: string, timeoutMs = 3000): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 HomeLab-Dashboard' },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isImageResponse(res: globalThis.Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return ct.startsWith('image/');
}

// GET /api/favicon/:domain
router.get('/:domain', async (req: Request, res: Response) => {
  const { domain } = req.params;

  // Validate domain format
  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
    res.status(400).send('Invalid domain');
    return;
  }

  // Check cache
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.set('Content-Type', cached.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(cached.data);
    return;
  }

  const sources = getFaviconSources(domain);

  for (const url of sources) {
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok && isImageResponse(response)) {
        const buffer = Buffer.from(await response.arrayBuffer());
        // Skip tiny images (likely 1x1 placeholders)
        if (buffer.length < 100) continue;

        const contentType = response.headers.get('content-type') || 'image/png';

        // Cache it
        cache.set(domain, { data: buffer, contentType, timestamp: Date.now() });

        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
        return;
      }
    } catch {
      // Try next source
    }
  }

  res.status(404).send('No favicon found');
});

export default router;
