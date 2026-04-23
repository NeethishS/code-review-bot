import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface AnalysisRequest {
    code: string;
    language: string;
    analysisType?: 'code-smell' | 'security' | 'performance' | 'complexity' | 'duplicates' | 'test-generation' | 'full-review';
    framework?: string;
}

export interface AnalysisResponse {
    success: boolean;
    data?: any;
    error?: string;
    tokensUsed?: number;
    cost?: number;
    analysisType?: string;
}

class ApiService {
    private baseURL: string;

    constructor() {
        this.baseURL = API_BASE_URL;
    }

    /**
     * Generic analysis method
     */
    async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/ai/analyze`, request);
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
            };
        }
    }

    /**
     * Code smell detection
     */
    async analyzeCodeSmells(code: string, language: string): Promise<AnalysisResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/ai/code-smell`, {
                code,
                language,
            });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
            };
        }
    }

    /**
     * Security vulnerability scan
     */
    async scanSecurity(code: string, language: string): Promise<AnalysisResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/ai/security-scan`, {
                code,
                language,
            });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
            };
        }
    }

    /**
     * Performance analysis
     */
    async analyzePerformance(code: string, language: string): Promise<AnalysisResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/ai/performance`, {
                code,
                language,
            });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
            };
        }
    }

    /**
     * Complexity analysis
     */
    async analyzeComplexity(code: string, language: string): Promise<AnalysisResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/ai/complexity`, {
                code,
                language,
            });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
            };
        }
    }

    /**
     * Duplicate code detection
     */
    async detectDuplicates(code: string, language: string): Promise<AnalysisResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/ai/duplicates`, {
                code,
                language,
            });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
            };
        }
    }

    /**
     * Generate unit tests
     */
    async generateTests(code: string, language: string, framework?: string): Promise<AnalysisResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/ai/generate-tests`, {
                code,
                language,
                framework,
            });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
            };
        }
    }

    /**
     * Full code review
     */
    async fullReview(code: string, language: string): Promise<AnalysisResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/ai/full-review`, { code, language });
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async analyzePatterns(code: string, language: string): Promise<AnalysisResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/ai/pattern-analysis`, { code, language });
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async generateEdgeCases(code: string, language: string): Promise<AnalysisResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/ai/edge-cases`, { code, language });
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async beforeAfterReview(code: string, language: string): Promise<AnalysisResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/ai/before-after`, { code, language });
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<any> {
        try {
            const response = await axios.get(`http://localhost:3001/health`);
            return response.data;
        } catch (error: any) {
            return { status: 'error', error: error.message };
        }
    }

    // ── Repositories ──────────────────────────────────────────────

    async getRepositories(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseURL}/repositories`);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async createRepository(name: string, description?: string, language?: string): Promise<any> {
        try {
            const response = await axios.post(`${this.baseURL}/repositories`, { name, description, language });
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async toggleRepository(id: number): Promise<any> {
        try {
            const response = await axios.patch(`${this.baseURL}/repositories/${id}/toggle`);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async deleteRepository(id: number): Promise<any> {
        try {
            const response = await axios.delete(`${this.baseURL}/repositories/${id}`);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    // ── Reviews ───────────────────────────────────────────────────

    async getReviews(limit = 20, offset = 0): Promise<any> {
        try {
            const response = await axios.get(`${this.baseURL}/reviews`, { params: { limit, offset } });
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async getReview(id: number): Promise<any> {
        try {
            const response = await axios.get(`${this.baseURL}/reviews/${id}`);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async saveReview(data: {
        language: string;
        analysis_type: string;
        code_snippet?: string;
        result?: any;
        tokens_used?: number;
        cost?: number;
        success?: boolean;
        error_message?: string;
        repository_id?: number;
    }): Promise<any> {
        try {
            const response = await axios.post(`${this.baseURL}/reviews`, data);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async getReviewStats(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseURL}/reviews/stats/summary`);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    // ── Notifications ─────────────────────────────────────────────

    async getNotifications(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseURL}/notifications`);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async createNotification(type: string, title: string, message: string): Promise<any> {
        try {
            const response = await axios.post(`${this.baseURL}/notifications`, { type, title, message });
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async markNotificationRead(id: number): Promise<any> {
        try {
            const response = await axios.patch(`${this.baseURL}/notifications/${id}/read`);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async markAllNotificationsRead(): Promise<any> {
        try {
            const response = await axios.patch(`${this.baseURL}/notifications/read-all`);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async deleteNotification(id: number): Promise<any> {
        try {
            const response = await axios.delete(`${this.baseURL}/notifications/${id}`);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    // ── Code Explainer ────────────────────────────────────────────

    async explainIndexFiles(sessionId: string, files: Array<{ name: string; language: string; content: string }>): Promise<any> {
        try {
            const response = await axios.post(`${this.baseURL}/explain/index`, { sessionId, files });
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async explainQuery(sessionId: string, query: string): Promise<any> {
        try {
            const response = await axios.post(`${this.baseURL}/explain/query`, { sessionId, query });
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async explainListFiles(sessionId: string): Promise<any> {
        try {
            const response = await axios.get(`${this.baseURL}/explain/files/${sessionId}`);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }

    async explainClearSession(sessionId: string): Promise<any> {
        try {
            const response = await axios.delete(`${this.baseURL}/explain/session/${sessionId}`);
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
