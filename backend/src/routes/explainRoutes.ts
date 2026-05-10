import { Router, Request, Response } from 'express';
import explainService from '../services/explainService';

const router = Router();

// POST /api/explain/index — index files into vector store
router.post('/index', async (req: Request, res: Response) => {
    try {
        const { sessionId, files } = req.body;
        if (!sessionId || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ success: false, error: 'sessionId and files[] are required' });
        }
        const totalChunks = explainService.indexFiles(sessionId, files);
        const indexedFiles = explainService.listIndexedFiles(sessionId);
        return res.json({ success: true, totalChunks, indexedFiles });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/explain/query — query the vector store + explain
router.post('/query', async (req: Request, res: Response) => {
    try {
        const { sessionId, query } = req.body;
        const customApiKey = req.header('x-custom-api-key');
        if (!sessionId || !query) {
            return res.status(400).json({ success: false, error: 'sessionId and query are required' });
        }
        const result = await explainService.explain(sessionId, query, customApiKey);
        return res.json(result);
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/explain/files/:sessionId — list indexed files
router.get('/files/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const files = explainService.listIndexedFiles(sessionId);
    return res.json({ success: true, files });
});

// DELETE /api/explain/session/:sessionId — clear session
router.delete('/session/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    explainService.clearSession(sessionId);
    return res.json({ success: true, message: 'Session cleared' });
});

export default router;
