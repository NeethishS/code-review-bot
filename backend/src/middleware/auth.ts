import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface AuthRequest extends Request {
    userId?: number;
    userEmail?: string;
}

/**
 * Middleware: Verify JWT token from Authorization header.
 * Attaches userId and userEmail to the request object.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const token = header.slice(7);

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
        req.userId = payload.id;
        req.userEmail = payload.email;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(userId: number, email: string): string {
    return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export default requireAuth;
