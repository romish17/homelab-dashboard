import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// POST /api/categories/:catId/links
router.post('/categories/:catId/links', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { catId } = req.params;
    const { id, title, url, iconUrl } = req.body;

    if (!id || !title || !url) {
      res.status(400).json({ error: 'ID, titre et URL requis' });
      return;
    }

    // Verify the category belongs to the user
    const catCheck = await query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [catId, userId]
    );
    if (catCheck.rows.length === 0) {
      res.status(404).json({ error: 'Catégorie non trouvée' });
      return;
    }

    const maxOrder = await query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM links WHERE category_id = $1',
      [catId]
    );

    const createdAt = Date.now();
    await query(
      'INSERT INTO links (id, category_id, title, url, icon_url, sort_order, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, catId, title, url, iconUrl || null, maxOrder.rows[0].next, createdAt]
    );

    res.status(201).json({ id, title, url, iconUrl: iconUrl || null, createdAt });
  } catch (err) {
    console.error('Add link error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/links/:id
router.put('/links/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title, url, iconUrl } = req.body;

    // Verify the link belongs to a category owned by the user
    const check = await query(
      `SELECT l.id FROM links l
       JOIN categories c ON l.category_id = c.id
       WHERE l.id = $1 AND c.user_id = $2`,
      [id, userId]
    );
    if (check.rows.length === 0) {
      res.status(404).json({ error: 'Lien non trouvé' });
      return;
    }

    await query(
      'UPDATE links SET title = $1, url = $2, icon_url = $3 WHERE id = $4',
      [title, url, iconUrl || null, id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Update link error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/links/:id
router.delete('/links/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Verify the link belongs to a category owned by the user
    const check = await query(
      `SELECT l.id FROM links l
       JOIN categories c ON l.category_id = c.id
       WHERE l.id = $1 AND c.user_id = $2`,
      [id, userId]
    );
    if (check.rows.length === 0) {
      res.status(404).json({ error: 'Lien non trouvé' });
      return;
    }

    await query('DELETE FROM links WHERE id = $1', [id]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete link error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
