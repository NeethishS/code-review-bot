import groqService from './groqService';
import promptTemplates from '../utils/promptTemplates';
import responseCache from '../utils/responseCache';

export interface CodeAnalysisRequest {
    code: string;
    language: string;
    analysisType: 'code-smell' | 'security' | 'performance' | 'complexity' | 'duplicates' | 'test-generation' | 'full-review' | 'pattern-analysis' | 'edge-cases' | 'before-after';
    framework?: string;
}

export interface CodeAnalysisResponse {
    success: boolean;
    data?: any;
    error?: string;
    tokensUsed?: number;
    cost?: number;
    analysisType: string;
}

class CodeAnalyzer {
    /**
     * Analyze code for smells and anti-patterns
     */
    async analyzeCodeSmells(code: string, language: string): Promise<CodeAnalysisResponse> {
        console.log(`🔍 Analyzing code smells for ${language} code...`);

        // Check cache first
        const cached = responseCache.get(code, language, 'code-smell');
        if (cached) {
            return {
                success: true,
                data: cached,
                analysisType: 'code-smell',
                tokensUsed: 0, // No tokens used for cached response
                cost: 0,
            };
        }

        const result = await groqService.sendPrompt(
            promptTemplates.codeSmell.system,
            promptTemplates.codeSmell.user(code, language)
        );

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                analysisType: 'code-smell',
            };
        }

        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };

        // Cache the response
        responseCache.set(code, language, 'code-smell', parsedData, result.tokensUsed || 0);

        return {
            success: true,
            data: parsedData,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
            analysisType: 'code-smell',
        };
    }

    /**
     * Scan code for security vulnerabilities
     */
    async scanSecurity(code: string, language: string): Promise<CodeAnalysisResponse> {
        console.log(`🔒 Scanning for security vulnerabilities in ${language} code...`);

        const result = await groqService.sendPrompt(
            promptTemplates.security.system,
            promptTemplates.security.user(code, language)
        );

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                analysisType: 'security',
            };
        }

        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };

        return {
            success: true,
            data: parsedData,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
            analysisType: 'security',
        };
    }

    /**
     * Analyze code for performance issues
     */
    async analyzePerformance(code: string, language: string): Promise<CodeAnalysisResponse> {
        console.log(`⚡ Analyzing performance for ${language} code...`);

        const result = await groqService.sendPrompt(
            promptTemplates.performance.system,
            promptTemplates.performance.user(code, language)
        );

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                analysisType: 'performance',
            };
        }

        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };

        return {
            success: true,
            data: parsedData,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
            analysisType: 'performance',
        };
    }

    /**
     * Analyze code complexity
     */
    async analyzeComplexity(code: string, language: string): Promise<CodeAnalysisResponse> {
        console.log(`📊 Analyzing complexity for ${language} code...`);

        const result = await groqService.sendPrompt(
            promptTemplates.complexity.system,
            promptTemplates.complexity.user(code, language)
        );

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                analysisType: 'complexity',
            };
        }

        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };

        return {
            success: true,
            data: parsedData,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
            analysisType: 'complexity',
        };
    }

    /**
     * Detect duplicate code
     */
    async detectDuplicates(code: string, language: string): Promise<CodeAnalysisResponse> {
        console.log(`🔄 Detecting duplicate code in ${language}...`);

        const result = await groqService.sendPrompt(
            promptTemplates.duplicates.system,
            promptTemplates.duplicates.user(code, language)
        );

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                analysisType: 'duplicates',
            };
        }

        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };

        return {
            success: true,
            data: parsedData,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
            analysisType: 'duplicates',
        };
    }

    /**
     * Generate unit tests
     */
    async generateTests(
        code: string,
        language: string,
        framework?: string
    ): Promise<CodeAnalysisResponse> {
        console.log(`🧪 Generating tests for ${language} code...`);

        const result = await groqService.sendPrompt(
            promptTemplates.testGeneration.system,
            promptTemplates.testGeneration.user(code, language, framework)
        );

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                analysisType: 'test-generation',
            };
        }

        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };

        return {
            success: true,
            data: parsedData,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
            analysisType: 'test-generation',
        };
    }

    /**
     * Perform full code review (all analyses)
     */
    async fullReview(code: string, language: string): Promise<CodeAnalysisResponse> {
        console.log(`📋 Performing full code review for ${language} code...`);

        const result = await groqService.sendPrompt(
            promptTemplates.codeReview.system,
            promptTemplates.codeReview.user(code, language)
        );

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                analysisType: 'full-review',
            };
        }

        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };

        return {
            success: true,
            data: parsedData,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
            analysisType: 'full-review',
        };
    }

    /**
     * Pattern recognition — DSA + design patterns
     */
    async analyzePatterns(code: string, language: string): Promise<CodeAnalysisResponse> {
        console.log(`🎯 Analyzing patterns for ${language} code...`);
        const result = await groqService.sendPrompt(
            promptTemplates.patternAnalysis.system,
            promptTemplates.patternAnalysis.user(code, language)
        );
        if (!result.success) return { success: false, error: result.error, analysisType: 'pattern-analysis' };
        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };
        return { success: true, data: parsedData, tokensUsed: result.tokensUsed, cost: result.cost, analysisType: 'pattern-analysis' };
    }

    /**
     * Edge case generator
     */
    async generateEdgeCases(code: string, language: string): Promise<CodeAnalysisResponse> {
        console.log(`🧪 Generating edge cases for ${language} code...`);
        const result = await groqService.sendPrompt(
            promptTemplates.edgeCaseGenerator.system,
            promptTemplates.edgeCaseGenerator.user(code, language)
        );
        if (!result.success) return { success: false, error: result.error, analysisType: 'edge-cases' };
        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };
        return { success: true, data: parsedData, tokensUsed: result.tokensUsed, cost: result.cost, analysisType: 'edge-cases' };
    }

    /**
     * Before vs After — full review with improved code
     */
    async beforeAfterReview(code: string, language: string): Promise<CodeAnalysisResponse> {
        console.log(`🔄 Before/After review for ${language} code...`);
        const result = await groqService.sendPrompt(
            promptTemplates.beforeAfter.system,
            promptTemplates.beforeAfter.user(code, language)
        );
        if (!result.success) return { success: false, error: result.error, analysisType: 'before-after' };
        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };
        return { success: true, data: parsedData, tokensUsed: result.tokensUsed, cost: result.cost, analysisType: 'before-after' };
    }

    /**
     * Main analysis method - routes to appropriate analyzer
     */
    async analyze(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
        const { code, language, analysisType, framework } = request;

        switch (analysisType) {
            case 'code-smell':
                return this.analyzeCodeSmells(code, language);
            case 'security':
                return this.scanSecurity(code, language);
            case 'performance':
                return this.analyzePerformance(code, language);
            case 'complexity':
                return this.analyzeComplexity(code, language);
            case 'duplicates':
                return this.detectDuplicates(code, language);
            case 'test-generation':
                return this.generateTests(code, language, framework);
            case 'full-review':
                return this.fullReview(code, language);
            case 'pattern-analysis':
                return this.analyzePatterns(code, language);
            case 'edge-cases':
                return this.generateEdgeCases(code, language);
            case 'before-after':
                return this.beforeAfterReview(code, language);
            default:
                return {
                    success: false,
                    error: `Unknown analysis type: ${analysisType}`,
                    analysisType,
                };
        }
    }
}

// Export singleton instance
export const codeAnalyzer = new CodeAnalyzer();
export default codeAnalyzer;
