import express, { Request, Response } from 'express';
import codeAnalyzer, { CodeAnalysisRequest } from '../services/codeAnalyzer';

const router = express.Router();

/**
 * POST /api/ai/analyze
 * Main endpoint for code analysis
 */
router.post('/analyze', async (req: Request, res: Response) => {
    try {
        const { code, language, analysisType, framework }: CodeAnalysisRequest = req.body;

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
        });

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
router.post('/code-smell', async (req: Request, res: Response) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.analyzeCodeSmells(code, language);
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
router.post('/security-scan', async (req: Request, res: Response) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.scanSecurity(code, language);
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
router.post('/performance', async (req: Request, res: Response) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.analyzePerformance(code, language);
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
router.post('/complexity', async (req: Request, res: Response) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.analyzeComplexity(code, language);
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
router.post('/duplicates', async (req: Request, res: Response) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.detectDuplicates(code, language);
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
router.post('/generate-tests', async (req: Request, res: Response) => {
    try {
        const { code, language, framework } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, language',
            });
        }

        const result = await codeAnalyzer.generateTests(code, language, framework);
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
router.post('/full-review', async (req: Request, res: Response) => {
    try {
        const { code, language } = req.body;
        if (!code || !language) return res.status(400).json({ success: false, error: 'Missing required fields: code, language' });
        const result = await codeAnalyzer.fullReview(code, language);
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/** POST /api/ai/pattern-analysis — DSA & design pattern detection */
router.post('/pattern-analysis', async (req: Request, res: Response) => {
    try {
        const { code, language } = req.body;
        if (!code || !language) return res.status(400).json({ success: false, error: 'Missing required fields' });
        const result = await codeAnalyzer.analyzePatterns(code, language);
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/** POST /api/ai/edge-cases — edge case generator */
router.post('/edge-cases', async (req: Request, res: Response) => {
    try {
        const { code, language } = req.body;
        if (!code || !language) return res.status(400).json({ success: false, error: 'Missing required fields' });
        const result = await codeAnalyzer.generateEdgeCases(code, language);
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/** POST /api/ai/before-after — before vs after improved code */
router.post('/before-after', async (req: Request, res: Response) => {
    try {
        const { code, language } = req.body;
        if (!code || !language) return res.status(400).json({ success: false, error: 'Missing required fields' });
        const result = await codeAnalyzer.beforeAfterReview(code, language);
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
