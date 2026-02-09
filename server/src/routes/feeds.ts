import { Router, Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const feedCache = new Map<string, { entries: unknown[]; fetchedAt: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 min

interface RssEntry {
  title: string;
  link: string;
  published: string;
  summary?: string;
}

function parseRssXml(xml: string): RssEntry[] {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const parsed = parser.parse(xml);

  const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
  const list = Array.isArray(items) ? items : [items];

  return list.slice(0, 30).map((item: Record<string, unknown>) => ({
    title: (item.title as string) || 'Sans titre',
    link: ((item.link as Record<string, unknown>)?.['@_href'] as string) || (item.link as string) || '',
    published: (item.pubDate as string) || (item.published as string) || (item.updated as string) || '',
    summary: ((item.description as string) || (item.summary as string) || '').replace(/<[^>]*>/g, '').substring(0, 300),
  }));
}

// GET /api/feeds
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await query(
      'SELECT id, title, url FROM rss_feeds WHERE user_id = $1 ORDER BY sort_order',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get feeds error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/feeds
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id, title, url } = req.body;
    if (!id || !title || !url) {
      res.status(400).json({ error: 'ID, titre et URL requis' });
      return;
    }
    const maxOrder = await query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM rss_feeds WHERE user_id = $1',
      [userId]
    );
    await query(
      'INSERT INTO rss_feeds (id, user_id, title, url, sort_order) VALUES ($1, $2, $3, $4, $5)',
      [id, userId, title, url, maxOrder.rows[0].next]
    );
    res.status(201).json({ id, title, url });
  } catch (err) {
    console.error('Create feed error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/feeds/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    await query('DELETE FROM rss_feeds WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete feed error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/feeds/:id/entries
router.get('/:id/entries', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const feed = await query(
      'SELECT url FROM rss_feeds WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (feed.rows.length === 0) {
      res.status(404).json({ error: 'Feed non trouvé' });
      return;
    }

    const cached = feedCache.get(id);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      res.json(cached.entries);
      return;
    }

    const response = await fetch(feed.rows[0].url, {
      headers: { 'User-Agent': 'HomeLab-Dashboard/1.0' },
    });
    if (!response.ok) {
      res.status(502).json({ error: 'Erreur lors de la récupération du flux' });
      return;
    }

    const xml = await response.text();
    const entries = parseRssXml(xml);

    feedCache.set(id, { entries, fetchedAt: Date.now() });
    res.json(entries);
  } catch (err) {
    console.error('Get feed entries error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
