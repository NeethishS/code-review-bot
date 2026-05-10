import express, { Request, Response } from 'express';
import codeAnalyzer, { CodeAnalysisRequest } from '../services/codeAnalyzer';
import { requireAuth, AuthRequest } from '../middleware/auth';
import pool from '../db/index';

const router = express.Router();

/**
 * Helper function to save review to database
 */
async function saveReview(userId: number, language: string, analysisType: string, code: string, result: any, tokensUsed: number, cost: number, success: boolean, errorMessage?: string) {
    try {
        console.log(`💾 Saving review for user ${userId}, type: ${analysisType}`);
        await pool.query(
            `INSERT INTO reviews (user_id, language, analysis_type, code_snippet, result, tokens_used, cost, success, error_message)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [userId, language, analysisType, code, JSON.stringify(result), tokensUsed, cost, success, errorMessage || null]
        );
        console.log(`✅ Review saved successfully for user ${userId}`);
    } catch (err: any) {
        console.error('❌ Error saving review:', err.message);
    }
}

/**
 * POST /api/ai/analyze
 * Main endpoint for code analysis
 */
router.post('/analyze', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language, analysisType, framework }: CodeAnalysisRequest = req.body;
        const customApiKey = req.header("x-custom-api-key");

        // Validation
        if (!code || !language || !analysisType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language, analysisType',
            });
        }

        // Perform analysis
        const result = await codeAnalyzer.analyze({
            code,
            language,
            analysisType,
            framework,
            customApiKey,
        });

        // Save review to database
        if (req.userId) {
            await saveReview(
                req.userId,
                language,
                analysisType,
                code,
                result.data,
                result.tokensUsed || 0,
                result.cost || 0,
                result.success,
                result.error
            );
        }

        if (!result.success) {
            return res.status(500).json(result);
        }

        return res.json(result);
    } catch (error: any) {
        console.error('Error in /api/ai/analyze:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
        });
    }
});

/**
 * POST /api/ai/code-smell
 * Detect code smells
 */
router.post('/code-smell', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language } = req.body;
        const customApiKey = req.header("x-custom-api-key");

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.analyzeCodeSmells(code, language, customApiKey);
        
        // Save review
        if (req.userId) {
            await saveReview(req.userId, language, 'code-smell', code, result.data, result.tokensUsed || 0, result.cost || 0, result.success);
        }
        
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/ai/security-scan
 * Security vulnerability scanning
 */
router.post('/security-scan', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language } = req.body;
        const customApiKey = req.header("x-custom-api-key");

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.scanSecurity(code, language, customApiKey);
        
        // Save review
        if (req.userId) {
            await saveReview(req.userId, language, 'security', code, result.data, result.tokensUsed || 0, result.cost || 0, result.success);
        }
        
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/ai/performance
 * Performance analysis
 */
router.post('/performance', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language } = req.body;
        const customApiKey = req.header("x-custom-api-key");

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.analyzePerformance(code, language, customApiKey);
        
        // Save review
        if (req.userId) {
            await saveReview(req.userId, language, 'performance', code, result.data, result.tokensUsed || 0, result.cost || 0, result.success);
        }
        
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/ai/complexity
 * Code complexity analysis
 */
router.post('/complexity', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language } = req.body;
        const customApiKey = req.header("x-custom-api-key");

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.analyzeComplexity(code, language, customApiKey);
        
        // Save review
        if (req.userId) {
            await saveReview(req.userId, language, 'complexity', code, result.data, result.tokensUsed || 0, result.cost || 0, result.success);
        }
        
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/ai/duplicates
 * Duplicate code detection
 */
router.post('/duplicates', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language } = req.body;
        const customApiKey = req.header("x-custom-api-key");

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.detectDuplicates(code, language, customApiKey);
        
        // Save review
        if (req.userId) {
            await saveReview(req.userId, language, 'duplicates', code, result.data, result.tokensUsed || 0, result.cost || 0, result.success);
        }
        
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/ai/generate-tests
 * Generate unit tests
 */
router.post('/generate-tests', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language, framework } = req.body;
        const customApiKey = req.header("x-custom-api-key");

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.generateTests(code, language, framework, customApiKey);
        
        // Save review
        if (req.userId) {
            await saveReview(req.userId, language, 'test-generation', code, result.data, result.tokensUsed || 0, result.cost || 0, result.success);
        }
        
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/ai/full-review
 * Comprehensive code review
 */
router.post('/full-review', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language } = req.body;
        const customApiKey = req.header("x-custom-api-key");
        if (!code || !language) return res.status(400).json({ success: false, error: 'Missing required fields: code, language' });
        const result = await codeAnalyzer.fullReview(code, language, customApiKey);
        
        // Save review
        if (req.userId) {
            await saveReview(req.userId, language, 'full-review', code, result.data, result.tokensUsed || 0, result.cost || 0, result.success);
        }
        
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/** POST /api/ai/pattern-analysis — DSA & design pattern detection */
router.post('/pattern-analysis', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language } = req.body;
        const customApiKey = req.header("x-custom-api-key");
        if (!code || !language) return res.status(400).json({ success: false, error: 'Missing required fields' });
        const result = await codeAnalyzer.analyzePatterns(code, language, customApiKey);
        
        // Save review
        if (req.userId) {
            await saveReview(req.userId, language, 'pattern-analysis', code, result.data, result.tokensUsed || 0, result.cost || 0, result.success);
        }
        
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/** POST /api/ai/edge-cases — edge case generator */
router.post('/edge-cases', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language } = req.body;
        const customApiKey = req.header("x-custom-api-key");
        if (!code || !language) return res.status(400).json({ success: false, error: 'Missing required fields' });
        const result = await codeAnalyzer.generateEdgeCases(code, language, customApiKey);
        
        // Save review
        if (req.userId) {
            await saveReview(req.userId, language, 'edge-cases', code, result.data, result.tokensUsed || 0, result.cost || 0, result.success);
        }
        
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/** POST /api/ai/before-after — before vs after improved code */
router.post('/before-after', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language } = req.body;
        const customApiKey = req.header("x-custom-api-key");
        if (!code || !language) return res.status(400).json({ success: false, error: 'Missing required fields' });
        const result = await codeAnalyzer.beforeAfterReview(code, language, customApiKey);
        
        // Save review
        if (req.userId) {
            await saveReview(req.userId, language, 'before-after', code, result.data, result.tokensUsed || 0, result.cost || 0, result.success);
        }
        
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/** POST /api/ai/auto-fix — AI auto-fix with diff */
router.post('/auto-fix', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language } = req.body;
        const customApiKey = req.header("x-custom-api-key");
        if (!code || !language) return res.status(400).json({ success: false, error: 'Missing required fields: code, language' });
        const result = await codeAnalyzer.autoFix(code, language, customApiKey);
        
        // Save review
        if (req.userId) {
            await saveReview(req.userId, language, 'auto-fix', code, result.data, result.tokensUsed || 0, result.cost || 0, result.success);
        }
        
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
