import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pool from '../db/index';
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth';
import { validateEmail, generateVerificationToken } from '../utils/emailValidator';

dotenv.config();

const router = Router();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const CALLBACK_URL = process.env.GITHUB_CALLBACK_URL!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Local Auth ────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Create a new user account with email validation
 */
router.post('/register', async (req: Request, res: Response) => {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    try {
        // Validate email format and domain
        const emailValidation = await validateEmail(email.toLowerCase());
        if (!emailValidation.valid) {
            return res.status(400).json({ success: false, error: emailValidation.error });
        }

        // Check if user already exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, error: 'An account with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Create user (unverified)
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, display_name, email_verified, verification_token) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, display_name',
            [email.toLowerCase(), passwordHash, displayName || email.split('@')[0], false, verificationToken]
        );

        const user = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Account created! Please verify your email to login.',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.display_name,
                },
            },
        });
    } catch (err: any) {
        console.error('Register error:', err.message);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

/**
 * POST /auth/login
 * Log in with email + password (only if email is verified)
 */
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    try {
        const result = await pool.query(
            'SELECT id, email, password_hash, display_name, avatar_url, email_verified FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(403).json({ 
                success: false, 
                error: 'Please verify your email before logging in. Check your inbox for verification link.' 
            });
        }

        // Check password
        if (!user.password_hash) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const token = generateToken(user.id, user.email);

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.display_name,
                    avatarUrl: user.avatar_url,
                },
            },
        });
    } catch (err: any) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

/**
 * POST /auth/verify-email
 * Verify email with token (for demo, just mark as verified)
 */
router.post('/verify-email', async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
    }

    try {
        // For demo purposes, just mark email as verified
        // In production, you'd send an email with a verification link
        const result = await pool.query(
            'UPDATE users SET email_verified = true, verification_token = NULL WHERE email = $1 RETURNING id, email, display_name',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const user = result.rows[0];
        const token = generateToken(user.id, user.email);

        res.json({
            success: true,
            message: 'Email verified! You can now login.',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.display_name,
                },
            },
        });
    } catch (err: any) {
        console.error('Email verification error:', err.message);
        res.status(500).json({ success: false, error: 'Email verification failed' });
    }
});

/**
 * GET /auth/me
 * Get current authenticated user (JWT)
 */
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT id, email, display_name, avatar_url, github_login, email_verified, created_at FROM users WHERE id = $1',
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                avatarUrl: user.avatar_url,
                githubLogin: user.github_login,
                emailVerified: user.email_verified,
                createdAt: user.created_at,
            },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
});

// ── GitHub OAuth ──────────────────────────────────────────────────

// Step 1: Redirect user to GitHub OAuth
router.get('/github', (req: Request, res: Response) => {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: CALLBACK_URL,
        scope: 'repo read:user',
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Step 2: GitHub redirects back here with ?code=...
router.get('/github/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
        return res.redirect(`${FRONTEND_URL}?auth_error=no_code`);
    }

    try {
        // Exchange code for access token
        const tokenRes = await axios.post(
            'https://github.com/login/oauth/access_token',
            { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri: CALLBACK_URL },
            { headers: { Accept: 'application/json' } }
        );

        const accessToken = tokenRes.data.access_token;
        if (!accessToken) {
            return res.redirect(`${FRONTEND_URL}?auth_error=no_token`);
        }

        // Fetch user info
        const userRes = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github+json',
            },
        });

        const ghUser = userRes.data;

        // Redirect back to frontend with token + user info in query params
        const params = new URLSearchParams({
            gh_token: accessToken,
            gh_login: ghUser.login,
            gh_name: ghUser.name || ghUser.login,
            gh_avatar: ghUser.avatar_url,
        });

        res.redirect(`${FRONTEND_URL}?${params}`);
    } catch (err: any) {
        console.error('GitHub OAuth error:', err.message);
        res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent(err.message)}`);
    }
});

/**
 * POST /auth/github-login
 * Handle GitHub OAuth login/registration (auto-verified)
 */
router.post('/github-login', async (req: Request, res: Response) => {
    const { githubToken, githubLogin, displayName, avatarUrl } = req.body;

    if (!githubToken || !githubLogin) {
        return res.status(400).json({ success: false, error: 'GitHub token and login required' });
    }

    try {
        // Check if user exists by GitHub login
        let result = await pool.query(
            'SELECT id, email, display_name FROM users WHERE github_login = $1',
            [githubLogin]
        );

        let user;
        if (result.rows.length > 0) {
            // User exists, just login
            user = result.rows[0];
        } else {
            // Create new user with GitHub info (auto-verified)
            const email = `${githubLogin}@github.local`;
            result = await pool.query(
                'INSERT INTO users (email, github_login, display_name, avatar_url, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, display_name',
                [email, githubLogin, displayName || githubLogin, avatarUrl, true]
            );
            user = result.rows[0];
        }

        const token = generateToken(user.id, user.email);

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.display_name,
                },
            },
        });
    } catch (err: any) {
        console.error('GitHub login error:', err.message);
        res.status(500).json({ success: false, error: 'GitHub login failed' });
    }
});

// ── Webhook Configuration ──────────────────────────────────────────

/**
 * GET /auth/webhook-config
 * Get user's webhook secret or generate one if missing
 */
router.get('/webhook-config', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        let result = await pool.query('SELECT webhook_secret FROM users WHERE id = $1', [req.userId]);
        let secret = result.rows[0]?.webhook_secret;

        if (!secret) {
            secret = crypto.randomBytes(16).toString('hex');
            await pool.query('UPDATE users SET webhook_secret = $1 WHERE id = $2', [secret, req.userId]);
        }

        res.json({ success: true, secret });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch webhook config' });
    }
});

/**
 * POST /auth/regenerate-webhook-secret
 * Regenerate a new secret for the user
 */
router.post('/regenerate-webhook-secret', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const newSecret = crypto.randomBytes(16).toString('hex');
        await pool.query('UPDATE users SET webhook_secret = $1 WHERE id = $2', [newSecret, req.userId]);
        res.json({ success: true, secret: newSecret });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Failed to regenerate secret' });
    }
});

export default router;
