import { Router, Request, Response } from 'express';
import pool from '../db/index';
import { requireAuth, AuthRequest } from '../middleware/auth';
import exportService from '../services/exportService';

const router = Router();

// GET stats summary — filtered by user
router.get('/stats/summary', requireAuth, async (req: AuthRequest, res: Response) => {
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
            WHERE user_id = $1
        `, [req.userId]);
        
        const byType = await pool.query(`
            SELECT analysis_type, COUNT(*) as count
            FROM reviews
            WHERE user_id = $1
            GROUP BY analysis_type
            ORDER BY count DESC
        `, [req.userId]);
        
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

// GET all reviews (paginated) — filtered by user
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    try {
        const result = await pool.query(
            `SELECT r.*, rep.name as repository_name
             FROM reviews r
             LEFT JOIN repositories rep ON r.repository_id = rep.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.userId, limit, offset]
        );
        const count = await pool.query('SELECT COUNT(*) FROM reviews WHERE user_id = $1', [req.userId]);
        res.json({
            success: true,
            data: result.rows,
            total: parseInt(count.rows[0].count),
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET single review — check user ownership
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT r.*, rep.name as repository_name
             FROM reviews r
             LEFT JOIN repositories rep ON r.repository_id = rep.id
             WHERE r.id = $1 AND r.user_id = $2`,
            [req.params.id, req.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET export review — PDF or Markdown
router.get('/:id/export', requireAuth, async (req: AuthRequest, res: Response) => {
    const { format } = req.query;

    try {
        const result = await pool.query(
            `SELECT r.*, rep.name as repository_name
             FROM reviews r
             LEFT JOIN repositories rep ON r.repository_id = rep.id
             WHERE r.id = $1 AND r.user_id = $2`,
            [req.params.id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }

        const review = result.rows[0];

        if (format === 'markdown') {
            const md = exportService.generateMarkdown(review);
            res.setHeader('Content-Type', 'text/markdown');
            res.setHeader('Content-Disposition', `attachment; filename="review-report-${req.params.id}.md"`);
            return res.send(md);
        } else {
            // Default to PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="review-report-${req.params.id}.pdf"`);
            exportService.generatePDF(review, res);
        }
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST save a review result — requires auth
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
    const { repository_id, language, analysis_type, code_snippet, result: analysisResult, tokens_used, cost, success, error_message } = req.body;

    if (!language || !analysis_type) {
        return res.status(400).json({ success: false, error: 'language and analysis_type are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO reviews (user_id, repository_id, language, analysis_type, code_snippet, result, tokens_used, cost, success, error_message)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                req.userId,
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
