import { Router, Request, Response } from 'express';
import pool from '../db/index';

const router = Router();

// GET all notifications
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
        );
        res.json({ success: true, data: result.rows });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST create notification
router.post('/', async (req: Request, res: Response) => {
    const { type, title, message } = req.body;
    if (!type || !title || !message) {
        return res.status(400).json({ success: false, error: 'type, title, and message are required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO notifications (type, title, message) VALUES ($1, $2, $3) RETURNING *',
            [type, title, message]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH mark all as read — must be BEFORE /:id/read to avoid route conflict
router.patch('/read-all', async (req: Request, res: Response) => {
    try {
        await pool.query('UPDATE notifications SET read = true WHERE read = false');
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH mark single notification as read
router.patch('/:id/read', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'UPDATE notifications SET read = true WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE notification
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await pool.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Notification deleted' });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
