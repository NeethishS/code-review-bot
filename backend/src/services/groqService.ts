import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

interface GroqConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
}

interface AnalysisResult {
    success: boolean;
    data?: any;
    error?: string;
    tokensUsed?: number;
    cost?: number;
}

class GroqService {
    private client: Groq;
    private config: GroqConfig;
    private backupConfig: GroqConfig;
    private requestCount: number = 0;
    private lastResetTime: number = Date.now();

    constructor() {
        this.backupConfig = {
            apiKey: process.env.BACKUP_GROQ_API_KEY || '',
            model: process.env.BACKUP_GROQ_MODEL || 'qwen/qwen3.8-27b',
            maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '2500'),
            temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.05'),
        };

        this.config = {
            apiKey: process.env.GROQ_API_KEY || '',
            model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
            maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '2500'),
            temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.05'),
        };

        if (!this.config.apiKey) {
            throw new Error('GROQ_API_KEY is not set in environment variables');
        }

        this.client = new Groq({
            apiKey: this.config.apiKey,
        });

        console.log('✅ Groq LLM Service initialized with model:', this.config.model);
    }

    /**
     * Rate limiting check
     */
    private checkRateLimit(): boolean {
        const now = Date.now();
        const oneMinute = 60 * 1000;

        // Reset counter every minute
        if (now - this.lastResetTime > oneMinute) {
            this.requestCount = 0;
            this.lastResetTime = now;
        }

        const maxRequests = parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '30');

        if (this.requestCount >= maxRequests) {
            return false;
        }

        this.requestCount++;
        return true;
    }

    /**
     * Core method to send prompts to Groq LLM
     */
    async sendPrompt(
        systemPrompt: string,
        userPrompt: string,
        options?: {
            temperature?: number;
            maxTokens?: number;
            model?: string;
            customApiKey?: string;
            jsonMode?: boolean;
        }
    ): Promise<AnalysisResult> {
        const isJson = options?.jsonMode ?? systemPrompt.includes('JSON');

        const execute = async (apiKey: string, model: string) => {
            const tempClient = new Groq({ apiKey });
            const startTime = Date.now();
            const requestPayload: any = {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                model: model,
                temperature: options?.temperature ?? this.config.temperature,
                max_tokens: options?.maxTokens || this.config.maxTokens,
                top_p: 1,
                stream: false,
            };

            if (isJson) {
                requestPayload.response_format = { type: 'json_object' };
            }

            try {
                const completion = await tempClient.chat.completions.create(requestPayload);
                const endTime = Date.now();
                return { completion, responseTime: endTime - startTime };
            } catch (err: any) {
                // If json_object response_format failed (e.g. unsupported, json_validate_failed, 400), retry once without it
                if (isJson && (
                    err?.message?.includes('response_format') ||
                    err?.message?.includes('validate JSON') ||
                    err?.error?.code === 'json_validate_failed' ||
                    err?.status === 400
                )) {
                    console.warn('⚠️ json_object validation failed on Groq, retrying without strict schema...');
                    delete requestPayload.response_format;
                    const completion = await tempClient.chat.completions.create(requestPayload);
                    const endTime = Date.now();
                    return { completion, responseTime: endTime - startTime };
                }
                throw err;
            }
        };

        try {
            if (!this.checkRateLimit()) {
                // If system limit reached, try backup key before rejecting
                if (this.backupConfig.apiKey) {
                    console.warn('⚠️ Local rate threshold reached, routing to Backup Key...');
                    const result = await execute(this.backupConfig.apiKey, this.backupConfig.model);
                    const content = result.completion.choices[0]?.message?.content || '';
                    const tokensUsed = result.completion.usage?.total_tokens || 0;
                    return {
                        success: true,
                        data: content,
                        tokensUsed,
                        cost: this.calculateCost(tokensUsed),
                    };
                }
                return { success: false, error: 'Rate limit exceeded. Please try again in a minute.' };
            }

            let result;

            if (options?.customApiKey) {
                try {
                    result = await execute(options.customApiKey, options.model || this.config.model);
                    console.log(`✅ Groq API Response via Custom Key`);
                } catch (customErr: any) {
                    console.warn('⚠️ Custom API Key failed, falling back to System Key:', customErr.message);
                }
            }

            if (!result) {
                try {
                    result = await execute(this.config.apiKey, options?.model || this.config.model);
                    console.log(`✅ Groq API Response via System Key`);
                } catch (systemErr: any) {
                    if ((systemErr.status === 429 || systemErr.status === 503) && this.backupConfig.apiKey) {
                        console.warn('⚠️ System Key issue (status ' + systemErr.status + '), falling back to Backup Key...');
                        try {
                            result = await execute(this.backupConfig.apiKey, this.backupConfig.model);
                            console.log(`✅ Groq API Response via Backup Key`);
                        } catch (backupErr: any) {
                            throw backupErr;
                        }
                    } else {
                        throw systemErr;
                    }
                }
            }

            const content = result.completion.choices[0]?.message?.content || '';
            const tokensUsed = result.completion.usage?.total_tokens || 0;

            return {
                success: true,
                data: content,
                tokensUsed,
                cost: this.calculateCost(tokensUsed),
            };
        } catch (error: any) {
            console.error('❌ Groq API Error:', error.message);
            if (error.status === 429) {
                return { success: false, error: 'Rate limit exceeded from Groq API. Please try again later.' };
            }
            if (error.status === 401) {
                return { success: false, error: 'Invalid Groq API key. Please check your configuration.' };
            }
            if (error.status === 404) {
                return { success: false, error: `Model not found or deprecated: ${error.message}` };
            }
            return { success: false, error: error.message || 'Failed to get response from Groq API' };
        }
    }

    /**
     * Calculate approximate cost for Groq inference (extremely cost effective)
     */
    private calculateCost(tokens: number): number {
        // Groq pricing is extremely low, approximately $0.00001 per 1K tokens
        return (tokens / 1000) * 0.00001;
    }

    /**
     * Clean and repair JSON string that may have unescaped control characters or trailing commas
     */
    private repairJsonString(raw: string): string {
        if (!raw || typeof raw !== 'string') return '';

        // Strip trailing commas before } or ]
        let cleaned = raw.replace(/,\s*([}\]])/g, '$1');

        // Escape unescaped control characters (literal newlines, tabs, carriage returns) inside string literals
        let insideString = false;
        let escaped = false;
        let result = '';

        for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];

            if (escaped) {
                result += char;
                escaped = false;
                continue;
            }

            if (char === '\\') {
                result += char;
                escaped = true;
                continue;
            }

            if (char === '"') {
                insideString = !insideString;
                result += char;
                continue;
            }

            if (insideString) {
                if (char === '\n') {
                    result += '\\n';
                } else if (char === '\r') {
                    result += '\\r';
                } else if (char === '\t') {
                    result += '\\t';
                } else if (char.charCodeAt(0) < 32) {
                    result += ' ';
                } else {
                    result += char;
                }
            } else {
                result += char;
            }
        }

        return result;
    }

    /**
     * Robust parser for LLM JSON output
     */
    parseJsonResponse(response: string): any {
        if (!response || typeof response !== 'string') {
            return null;
        }

        const trimmed = response.trim();

        // 1. Try direct parse
        try {
            return JSON.parse(trimmed);
        } catch (e) {}

        // 2. Try markdown fenced code block ```json ... ``` or ``` ... ```
        const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) {
            const blockContent = codeBlockMatch[1].trim();
            try {
                return JSON.parse(blockContent);
            } catch (e) {}
            try {
                return JSON.parse(this.repairJsonString(blockContent));
            } catch (e) {}
        }

        // 3. Try to extract outermost JSON object { ... }
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            const potentialJson = trimmed.slice(firstBrace, lastBrace + 1);
            try {
                return JSON.parse(potentialJson);
            } catch (e) {}
            try {
                return JSON.parse(this.repairJsonString(potentialJson));
            } catch (e) {}
        }

        // 4. Try to extract outermost JSON array [ ... ]
        const firstBracket = trimmed.indexOf('[');
        const lastBracket = trimmed.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket > firstBracket) {
            const potentialJson = trimmed.slice(firstBracket, lastBracket + 1);
            try {
                return JSON.parse(potentialJson);
            } catch (e) {}
            try {
                return JSON.parse(this.repairJsonString(potentialJson));
            } catch (e) {}
        }

        // 5. Try repair on whole trimmed text
        try {
            return JSON.parse(this.repairJsonString(trimmed));
        } catch (e) {}

        console.warn('⚠️ Could not parse JSON response cleanly, falling back to raw representation');
        return { _raw: response, summary: response };
    }

    /**
     * Get available active Groq models
     */
    getAvailableModels(): string[] {
        return [
            'qwen/qwen3.8-27b',
            'openai/gpt-oss-20b',
            'openai/gpt-oss-120b',
            'groq/compound-mini',
            'groq/compound',
        ];
    }

    /**
     * Get current configuration
     */
    getConfig(): GroqConfig {
        return { ...this.config };
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        try {
            const result = await this.sendPrompt(
                'You are a helpful assistant.',
                'Reply with just the word "OK" if you can read this.',
                { maxTokens: 100, jsonMode: false }
            );
            return result.success && (result.data?.toLowerCase().includes('ok') || result.data?.length > 0);
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
export const groqService = new GroqService();
export default groqService;
