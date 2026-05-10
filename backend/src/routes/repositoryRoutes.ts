import { Router, Request, Response } from 'express';
import pool from '../db/index';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all repositories
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT * FROM repositories WHERE user_id = $1 ORDER BY created_at DESC',
            [req.userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET single repository
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT * FROM repositories WHERE id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Repository not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST create repository
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
    const { name, description, language } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

    try {
        const result = await pool.query(
            'INSERT INTO repositories (user_id, name, description, language) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.userId, name, description || null, language || null]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH toggle enabled
router.patch('/:id/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            'UPDATE repositories SET enabled = NOT enabled, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Repository not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE repository
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        await pool.query('DELETE FROM repositories WHERE id = $1', [req.params.id, req.userId]);
        res.json({ success: true, message: 'Repository deleted' });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
