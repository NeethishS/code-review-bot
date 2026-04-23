import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/aiRoutes';
import repositoryRoutes from './routes/repositoryRoutes';
import reviewRoutes from './routes/reviewRoutes';
import notificationRoutes from './routes/notificationRoutes';
import explainRoutes from './routes/explainRoutes';
import authRoutes from './routes/authRoutes';
import groqService from './services/groqService';
import responseCache from './utils/responseCache';
import migrate from './db/migrate';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger code files
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
    const groqHealthy = await groqService.healthCheck();
    const cacheStats = responseCache.getStats();

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            groq: groqHealthy ? 'healthy' : 'unhealthy',
        },
        config: {
            model: groqService.getConfig().model,
            availableModels: groqService.getAvailableModels(),
            maxTokens: groqService.getConfig().maxTokens,
        },
        cache: cacheStats,
        optimization: {
            status: 'CREDIT SAVING MODE',
            features: [
                'Fast 8B model (90% token savings)',
                'Response caching enabled',
                'Reduced max tokens (3000)',
                'Conservative rate limiting (5/min)',
            ],
        },
    });
});

// API Routes
app.use('/api/ai', aiRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/explain', explainRoutes);
app.use('/auth', authRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: '🤖 Code Review Bot API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            ai: {
                analyze: 'POST /api/ai/analyze',
                codeSmell: 'POST /api/ai/code-smell',
                security: 'POST /api/ai/security-scan',
                performance: 'POST /api/ai/performance',
                complexity: 'POST /api/ai/complexity',
                duplicates: 'POST /api/ai/duplicates',
                generateTests: 'POST /api/ai/generate-tests',
                fullReview: 'POST /api/ai/full-review',
            },
        },
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
});

// Start server
app.listen(PORT, async () => {
    // Run DB migrations
    await migrate();

    console.log('');
    console.log('🚀 ========================================');
    console.log(`🤖 Code Review Bot API Server`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`⚡ Powered by Groq (${groqService.getConfig().model})`);
    console.log(`🗄️  PostgreSQL connected`);
    console.log('🚀 ========================================');
    console.log('');
});

export default app;
