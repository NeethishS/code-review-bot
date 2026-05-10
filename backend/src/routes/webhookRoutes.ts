import { Router, Request, Response } from 'express';
import githubWebhookService from '../services/githubWebhookService';
import pool from '../db/index';

const router = Router();

/**
 * POST /api/webhooks/github
 * Receives incoming webhooks from GitHub
 */
router.post('/github/:userSecret', async (req: Request, res: Response) => {
    const { userSecret } = req.params;
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);

    try {
        // 1. Verify user exists with this secret
        const result = await pool.query('SELECT id, github_login FROM users WHERE webhook_secret = $1', [userSecret]);
        if (result.rows.length === 0) {
            console.warn('[Webhook] Unauthorized webhook attempt - invalid user secret');
            return res.status(401).json({ error: 'Invalid user secret' });
        }

        const user = result.rows[0];

        // 2. Verify signature
        if (!signature || !githubWebhookService.verifySignature(payload, signature, userSecret)) {
            console.warn('[Webhook] Unauthorized webhook attempt - invalid signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const event = req.headers['x-github-event'];
        console.log(`[Webhook] Received GitHub event: ${event} for user ${user.github_login}`);

        // 3. Respond quickly
        res.status(202).json({ message: 'Accepted' });

        // 4. Process in background
        if (event === 'pull_request') {
            await githubWebhookService.handlePullRequestEvent(req.body);
        }
    } catch (err: any) {
        console.error('[Webhook] Error processing webhook:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
