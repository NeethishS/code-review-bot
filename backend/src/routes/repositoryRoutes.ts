import { Router, Request, Response } from 'express';
import pool from '../db/index';

const router = Router();

// GET all repositories
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT * FROM repositories ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET single repository
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT * FROM repositories WHERE id = $1',
            [req.params.id]
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
router.post('/', async (req: Request, res: Response) => {
    const { name, description, language } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

    try {
        const result = await pool.query(
            'INSERT INTO repositories (name, description, language) VALUES ($1, $2, $3) RETURNING *',
            [name, description || null, language || null]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH toggle enabled
router.patch('/:id/toggle', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'UPDATE repositories SET enabled = NOT enabled, updated_at = NOW() WHERE id = $1 RETURNING *',
            [req.params.id]
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
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await pool.query('DELETE FROM repositories WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Repository deleted' });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
