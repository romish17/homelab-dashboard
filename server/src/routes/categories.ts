import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/categories - Returns all categories with nested links
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const catResult = await query(
      'SELECT id, title FROM categories WHERE user_id = $1 ORDER BY sort_order',
      [userId]
    );

    const categories = [];
    for (const cat of catResult.rows) {
      const linkResult = await query(
        'SELECT id, title, url, icon_url as "iconUrl", created_at as "createdAt" FROM links WHERE category_id = $1 ORDER BY sort_order',
        [cat.id]
      );
      categories.push({
        id: cat.id,
        title: cat.title,
        links: linkResult.rows.map(l => ({
          ...l,
          createdAt: Number(l.createdAt),
        })),
      });
    }

    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/categories
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id, title } = req.body;

    if (!id || !title) {
      res.status(400).json({ error: 'ID et titre requis' });
      return;
    }

    const maxOrder = await query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM categories WHERE user_id = $1',
      [userId]
    );

    await query(
      'INSERT INTO categories (id, user_id, title, sort_order) VALUES ($1, $2, $3, $4)',
      [id, userId, title, maxOrder.rows[0].next]
    );

    res.status(201).json({ id, title, links: [] });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/categories/reorder
router.put('/reorder', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'orderedIds requis' });
      return;
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await query(
        'UPDATE categories SET sort_order = $1 WHERE id = $2 AND user_id = $3',
        [i, orderedIds[i], userId]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Reorder categories error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Titre requis' });
      return;
    }

    await query(
      'UPDATE categories SET title = $1 WHERE id = $2 AND user_id = $3',
      [title, id, userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
