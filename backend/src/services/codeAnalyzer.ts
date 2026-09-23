import groqService from './groqService';
import promptTemplates from '../utils/promptTemplates';
import responseCache from '../utils/responseCache';
import staticAnalyzer, { StaticAnalysisResult } from './staticAnalyzer';

export interface CodeAnalysisRequest {
    code: string;
    language: string;
    analysisType: 'code-smell' | 'security' | 'performance' | 'complexity' | 'duplicates' | 'test-generation' | 'full-review' | 'pattern-analysis' | 'edge-cases' | 'before-after' | 'static-analysis';
    framework?: string;
    customApiKey?: string;
}

export interface CodeAnalysisResponse {
    success: boolean;
    data?: any;
    error?: string;
    tokensUsed?: number;
    cost?: number;
    analysisType: string;
    staticAnalysis?: StaticAnalysisResult;
}

class CodeAnalyzer {
    /**
     * Analyze code for smells and anti-patterns
     */
    async analyzeCodeSmells(code: string, language: string, customApiKey?: string): Promise<CodeAnalysisResponse> {
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

        // Run pre-analysis static inspection
        const staticFacts = staticAnalyzer.analyze(code, language);
        const staticPromptContext = staticAnalyzer.formatForPrompt(staticFacts);

        const result = await groqService.sendPrompt(
            promptTemplates.codeSmell.system,
            promptTemplates.codeSmell.user(code, language, staticPromptContext),
            { customApiKey }
        );

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                analysisType: 'code-smell',
                staticAnalysis: staticFacts,
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
            staticAnalysis: staticFacts,
        };
    }

    /**
     * Scan code for security vulnerabilities
     */
    async scanSecurity(code: string, language: string, customApiKey?: string): Promise<CodeAnalysisResponse> {
        console.log(`🔒 Scanning for security vulnerabilities in ${language} code...`);

        const result = await groqService.sendPrompt(
            promptTemplates.security.system,
            promptTemplates.security.user(code, language),
            { customApiKey }
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
    async analyzePerformance(code: string, language: string, customApiKey?: string): Promise<CodeAnalysisResponse> {
        console.log(`⚡ Analyzing performance for ${language} code...`);

        const result = await groqService.sendPrompt(
            promptTemplates.performance.system,
            promptTemplates.performance.user(code, language),
            { customApiKey }
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
    async analyzeComplexity(code: string, language: string, customApiKey?: string): Promise<CodeAnalysisResponse> {
        console.log(`📊 Analyzing complexity for ${language} code...`);

        const result = await groqService.sendPrompt(
            promptTemplates.complexity.system,
            promptTemplates.complexity.user(code, language),
            { customApiKey }
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
    async detectDuplicates(code: string, language: string, customApiKey?: string): Promise<CodeAnalysisResponse> {
        console.log(`🔄 Detecting duplicate code in ${language}...`);

        const result = await groqService.sendPrompt(
            promptTemplates.duplicates.system,
            promptTemplates.duplicates.user(code, language),
            { customApiKey }
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
    async generateTests(code: string, language: string, framework?: string, customApiKey?: string): Promise<CodeAnalysisResponse> {
        console.log(`🧪 Generating tests for ${language} code...`);

        const result = await groqService.sendPrompt(
            promptTemplates.testGeneration.system,
            promptTemplates.testGeneration.user(code, language, framework),
            { customApiKey }
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
    async fullReview(code: string, language: string, customApiKey?: string): Promise<CodeAnalysisResponse> {
        console.log(`📋 Performing full code review for ${language} code...`);

        const staticFacts = staticAnalyzer.analyze(code, language);
        const staticPromptContext = staticAnalyzer.formatForPrompt(staticFacts);

        const result = await groqService.sendPrompt(
            promptTemplates.codeReview.system,
            promptTemplates.codeReview.user(code, language, staticPromptContext),
            { customApiKey }
        );

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                analysisType: 'full-review',
                staticAnalysis: staticFacts,
            };
        }

        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };

        return {
            success: true,
            data: parsedData,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
            analysisType: 'full-review',
            staticAnalysis: staticFacts,
        };
    }

    /**
     * Pattern recognition — DSA + design patterns
     */
    async analyzePatterns(code: string, language: string, customApiKey?: string): Promise<CodeAnalysisResponse> {
        console.log(`🎯 Analyzing patterns for ${language} code...`);
        const result = await groqService.sendPrompt(
            promptTemplates.patternAnalysis.system,
            promptTemplates.patternAnalysis.user(code, language),
            { customApiKey }
        );
        if (!result.success) return { success: false, error: result.error, analysisType: 'pattern-analysis' };
        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };
        return { success: true, data: parsedData, tokensUsed: result.tokensUsed, cost: result.cost, analysisType: 'pattern-analysis' };
    }

    /**
     * Edge case generator
     */
    async generateEdgeCases(code: string, language: string, customApiKey?: string): Promise<CodeAnalysisResponse> {
        console.log(`🧪 Generating edge cases for ${language} code...`);
        const result = await groqService.sendPrompt(
            promptTemplates.edgeCaseGenerator.system,
            promptTemplates.edgeCaseGenerator.user(code, language),
            { customApiKey }
        );
        if (!result.success) return { success: false, error: result.error, analysisType: 'edge-cases' };
        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };
        return { success: true, data: parsedData, tokensUsed: result.tokensUsed, cost: result.cost, analysisType: 'edge-cases' };
    }

    /**
     * Before vs After — full review with improved code
     */
    async beforeAfterReview(code: string, language: string, customApiKey?: string): Promise<CodeAnalysisResponse> {
        console.log(`🔄 Before/After review for ${language} code...`);
        const result = await groqService.sendPrompt(
            promptTemplates.beforeAfter.system,
            promptTemplates.beforeAfter.user(code, language),
            { customApiKey }
        );
        if (!result.success) return { success: false, error: result.error, analysisType: 'before-after' };
        const parsedData = groqService.parseJsonResponse(result.data) || { _raw: result.data, summary: result.data };
        return { success: true, data: parsedData, tokensUsed: result.tokensUsed, cost: result.cost, analysisType: 'before-after' };
    }

    /**
     * Resilient Auto-Fix parser that guarantees clean fixedCode output
     */
    private parseAutoFixResult(rawResponse: string, originalCode: string): any {
        // 1. Try groqService.parseJsonResponse
        const parsed = groqService.parseJsonResponse(rawResponse);

        if (parsed && typeof parsed === 'object' && typeof parsed.fixedCode === 'string' && parsed.fixedCode.trim().length > 0) {
            let cleanCode = parsed.fixedCode.trim();
            // Verify fixedCode isn't accidentally a dumped raw JSON object
            if (cleanCode.startsWith('{') && cleanCode.includes('"fixedCode"')) {
                const nested = this.extractAutoFixFields(cleanCode, originalCode);
                if (nested.fixedCode && nested.fixedCode !== cleanCode) {
                    return nested;
                }
            }

            return {
                originalCode,
                fixedCode: cleanCode,
                issues: Array.isArray(parsed.issues) && parsed.issues.length > 0 ? parsed.issues : ['Code quality and security issues detected.'],
                fixes: Array.isArray(parsed.fixes) && parsed.fixes.length > 0 ? parsed.fixes : ['Automated fixes and refactoring applied.'],
                explanation: typeof parsed.explanation === 'string' && parsed.explanation.trim().length > 0 
                    ? parsed.explanation 
                    : 'The code has been refactored to resolve detected issues and improve maintainability.'
            };
        }

        // 2. Field-level fallback extraction from raw text
        return this.extractAutoFixFields(rawResponse, originalCode);
    }

    /**
     * Fallback extractor using regex and code block detection
     */
    private extractAutoFixFields(raw: string, originalCode: string): any {
        let fixedCode: string | null = null;
        let issues: string[] = [];
        let fixes: string[] = [];
        let explanation = '';

        // Extract fixedCode from "fixedCode": "..."
        const fixedCodeMatch = raw.match(/"fixedCode"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"(?:issues|fixes|explanation)"|\s*})/);
        if (fixedCodeMatch) {
            fixedCode = fixedCodeMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
        }

        // If no fixedCode via regex, check if LLM returned a markdown code block ```language ... ```
        if (!fixedCode || fixedCode.trim().length === 0) {
            const codeBlock = raw.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
            if (codeBlock && codeBlock[1].trim().length > 0) {
                fixedCode = codeBlock[1].trim();
            }
        }

        // Extract issues array
        const issuesMatch = raw.match(/"issues"\s*:\s*\[([\s\S]*?)\]/);
        if (issuesMatch) {
            issues = issuesMatch[1]
                .split('\n')
                .map(s => s.trim().replace(/^["']/, '').replace(/["'],?$/, '').replace(/\\"/g, '"'))
                .filter(s => s.length > 0);
        }

        // Extract fixes array
        const fixesMatch = raw.match(/"fixes"\s*:\s*\[([\s\S]*?)\]/);
        if (fixesMatch) {
            fixes = fixesMatch[1]
                .split('\n')
                .map(s => s.trim().replace(/^["']/, '').replace(/["'],?$/, '').replace(/\\"/g, '"'))
                .filter(s => s.length > 0);
        }

        // Extract explanation
        const expMatch = raw.match(/"explanation"\s*:\s*"([\s\S]*?)"(?=\s*})/);
        if (expMatch) {
            explanation = expMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }

        if (fixedCode && fixedCode.trim().length > 0 && !fixedCode.trim().startsWith('{"fixedCode"')) {
            return {
                originalCode,
                fixedCode: fixedCode.trim(),
                issues: issues.length > 0 ? issues : ['Identified code issues and security vulnerabilities.'],
                fixes: fixes.length > 0 ? fixes : ['Applied automated security fixes and refactoring.'],
                explanation: explanation || 'Code refactored and updated.'
            };
        }

        // Ultimate safety: never dump raw JSON text as code
        console.warn('⚠️ Auto-fix completely failed to extract clean code');
        return {
            originalCode,
            fixedCode: originalCode,
            issues: ['Could not extract clean code from AI response. Please try again.'],
            fixes: ['No automatic modifications applied.'],
            explanation: 'The AI model response could not be parsed into a clean code format.'
        };
    }

    /**
     * Auto-Fix — AI generates fixed code with diff
     */
    async autoFix(code: string, language: string, customApiKey?: string): Promise<CodeAnalysisResponse> {
        console.log(`🔧 Auto-fixing ${language} code...`);
        const result = await groqService.sendPrompt(
            promptTemplates.autoFix.system,
            promptTemplates.autoFix.user(code, language),
            { customApiKey }
        );

        if (!result.success) return { success: false, error: result.error, analysisType: 'auto-fix' };

        const parsedData = this.parseAutoFixResult(result.data, code);

        return { 
            success: true, 
            data: parsedData, 
            tokensUsed: result.tokensUsed, 
            cost: result.cost, 
            analysisType: 'auto-fix' 
        };
    }

    /**
     * Main analysis method - routes to appropriate analyzer
     */
    async analyze(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
        const { code, language, analysisType, framework, customApiKey } = request;

        switch (analysisType) {
            case 'code-smell':
                return this.analyzeCodeSmells(code, language, customApiKey);
            case 'security':
                return this.scanSecurity(code, language, customApiKey);
            case 'performance':
                return this.analyzePerformance(code, language, customApiKey);
            case 'complexity':
                return this.analyzeComplexity(code, language, customApiKey);
            case 'duplicates':
                return this.detectDuplicates(code, language, customApiKey);
            case 'test-generation':
                return this.generateTests(code, language, framework, customApiKey);
            case 'full-review':
                return this.fullReview(code, language, customApiKey);
            case 'pattern-analysis':
                return this.analyzePatterns(code, language, customApiKey);
            case 'edge-cases':
                return this.generateEdgeCases(code, language, customApiKey);
            case 'before-after':
                return this.beforeAfterReview(code, language, customApiKey);
            case 'auto-fix' as any:
                return this.autoFix(code, language, customApiKey);
            case 'static-analysis':
                const staticResult = staticAnalyzer.analyze(code, language);
                return {
                    success: true,
                    data: staticResult,
                    tokensUsed: 0,
                    cost: 0,
                    analysisType: 'static-analysis',
                    staticAnalysis: staticResult,
                };
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
