import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées'));
    }
  },
});

// GET /api/profile
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await query(
      'SELECT username, display_name, avatar_path FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }
    const user = result.rows[0];
    res.json({
      username: user.username,
      displayName: user.display_name || null,
      avatarUrl: user.avatar_path ? `/uploads/avatars/${user.avatar_path}` : null,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/profile
router.put('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { displayName } = req.body;
    await query('UPDATE users SET display_name = $1 WHERE id = $2', [displayName || null, userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/profile/avatar
router.post('/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier envoyé' });
      return;
    }

    // Delete old avatar
    const old = await query('SELECT avatar_path FROM users WHERE id = $1', [userId]);
    if (old.rows[0]?.avatar_path) {
      const oldPath = path.join(uploadDir, old.rows[0].avatar_path);
      fs.unlink(oldPath, () => {});
    }

    const filename = req.file.filename;
    await query('UPDATE users SET avatar_path = $1 WHERE id = $2', [filename, userId]);

    res.json({ avatarUrl: `/uploads/avatars/${filename}` });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
