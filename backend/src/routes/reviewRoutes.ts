import { Router, Request, Response } from 'express';
import pool from '../db/index';

const router = Router();

// GET stats summary — MUST be before /:id to avoid route conflict
router.get('/stats/summary', async (req: Request, res: Response) => {
    try {
        const stats = await pool.query(`
            SELECT
                COUNT(*) as total_reviews,
                COUNT(*) FILTER (WHERE success = true) as successful,
                COUNT(*) FILTER (WHERE success = false) as failed,
                COALESCE(SUM(tokens_used), 0) as total_tokens,
                COALESCE(SUM(cost), 0) as total_cost,
                COUNT(DISTINCT analysis_type) as analysis_types_used
            FROM reviews
        `);
        const byType = await pool.query(`
            SELECT analysis_type, COUNT(*) as count
            FROM reviews
            GROUP BY analysis_type
            ORDER BY count DESC
        `);
        res.json({
            success: true,
            data: {
                total_reviews: Number(stats.rows[0].total_reviews),
                successful: Number(stats.rows[0].successful),
                failed: Number(stats.rows[0].failed),
                total_tokens: Number(stats.rows[0].total_tokens),
                total_cost: Number(stats.rows[0].total_cost),
                analysis_types_used: Number(stats.rows[0].analysis_types_used),
                by_type: byType.rows.map(r => ({ ...r, count: Number(r.count) })),
            },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET all reviews (paginated)
router.get('/', async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    try {
        const result = await pool.query(
            `SELECT r.*, rep.name as repository_name
             FROM reviews r
             LEFT JOIN repositories rep ON r.repository_id = rep.id
             ORDER BY r.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        const count = await pool.query('SELECT COUNT(*) FROM reviews');
        res.json({
            success: true,
            data: result.rows,
            total: parseInt(count.rows[0].count),
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET single review
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT r.*, rep.name as repository_name
             FROM reviews r
             LEFT JOIN repositories rep ON r.repository_id = rep.id
             WHERE r.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST save a review result
router.post('/', async (req: Request, res: Response) => {
    const { repository_id, language, analysis_type, code_snippet, result: analysisResult, tokens_used, cost, success, error_message } = req.body;

    if (!language || !analysis_type) {
        return res.status(400).json({ success: false, error: 'language and analysis_type are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO reviews (repository_id, language, analysis_type, code_snippet, result, tokens_used, cost, success, error_message)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                repository_id || null,
                language,
                analysis_type,
                code_snippet || null,
                analysisResult ? JSON.stringify(analysisResult) : null,
                tokens_used || 0,
                cost || 0,
                success !== false,
                error_message || null,
            ]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
