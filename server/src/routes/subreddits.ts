import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const redditCache = new Map<string, { posts: unknown[]; fetchedAt: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min

// GET /api/subreddits
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await query(
      'SELECT id, name FROM subreddits WHERE user_id = $1 ORDER BY sort_order',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get subreddits error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/subreddits
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id, name } = req.body;
    if (!id || !name) {
      res.status(400).json({ error: 'ID et nom requis' });
      return;
    }
    const cleanName = name.replace(/^r\//, '').trim();
    const maxOrder = await query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM subreddits WHERE user_id = $1',
      [userId]
    );
    await query(
      'INSERT INTO subreddits (id, user_id, name, sort_order) VALUES ($1, $2, $3, $4)',
      [id, userId, cleanName, maxOrder.rows[0].next]
    );
    res.status(201).json({ id, name: cleanName });
  } catch (err) {
    console.error('Create subreddit error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/subreddits/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    await query('DELETE FROM subreddits WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete subreddit error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/subreddits/:id/posts
router.get('/:id/posts', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const sub = await query(
      'SELECT name FROM subreddits WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (sub.rows.length === 0) {
      res.status(404).json({ error: 'Subreddit non trouvé' });
      return;
    }

    const name = sub.rows[0].name;
    const cached = redditCache.get(name);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      res.json(cached.posts);
      return;
    }

    const response = await fetch(`https://www.reddit.com/r/${name}/hot.json?limit=20`, {
      headers: { 'User-Agent': 'HomeLab-Dashboard/1.0' },
    });

    if (!response.ok) {
      res.status(502).json({ error: 'Erreur API Reddit' });
      return;
    }

    const data = await response.json() as { data: { children: Array<{ data: Record<string, unknown> }> } };
    const posts = data.data.children.map((child) => ({
      id: child.data.id,
      title: child.data.title,
      url: child.data.url,
      permalink: `https://www.reddit.com${child.data.permalink}`,
      score: child.data.score,
      numComments: child.data.num_comments,
      author: child.data.author,
      createdUtc: child.data.created_utc,
      thumbnail: typeof child.data.thumbnail === 'string' && child.data.thumbnail.startsWith('http') ? child.data.thumbnail : null,
      selftext: typeof child.data.selftext === 'string' ? child.data.selftext.substring(0, 200) : null,
    }));

    redditCache.set(name, { posts, fetchedAt: Date.now() });
    res.json(posts);
  } catch (err) {
    console.error('Get subreddit posts error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
