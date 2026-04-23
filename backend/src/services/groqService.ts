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
    private requestCount: number = 0;
    private lastResetTime: number = Date.now();

    constructor() {
        this.config = {
            apiKey: process.env.GROQ_API_KEY || '',
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '8000'),
            temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.1'),
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

        const maxRequests = parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '10');

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
        }
    ): Promise<AnalysisResult> {
        try {
            // Check rate limiting
            if (!this.checkRateLimit()) {
                return {
                    success: false,
                    error: 'Rate limit exceeded. Please try again in a minute.',
                };
            }

            const startTime = Date.now();

            const completion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: userPrompt,
                    },
                ],
                model: options?.model || this.config.model,
                temperature: options?.temperature ?? this.config.temperature,
                max_tokens: options?.maxTokens || this.config.maxTokens,
                top_p: 1,
                stream: false,
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            const content = completion.choices[0]?.message?.content || '';
            const tokensUsed = completion.usage?.total_tokens || 0;

            console.log(`✅ Groq API Response (${responseTime}ms, ${tokensUsed} tokens)`);

            return {
                success: true,
                data: content,
                tokensUsed,
                cost: this.calculateCost(tokensUsed),
            };
        } catch (error: any) {
            console.error('❌ Groq API Error:', error.message);

            // Handle specific error types
            if (error.status === 429) {
                return {
                    success: false,
                    error: 'Rate limit exceeded from Groq API. Please try again later.',
                };
            }

            if (error.status === 401) {
                return {
                    success: false,
                    error: 'Invalid Groq API key. Please check your configuration.',
                };
            }

            return {
                success: false,
                error: error.message || 'Failed to get response from Groq API',
            };
        }
    }

    /**
     * Calculate approximate cost (Groq is very cheap/free for many models)
     */
    private calculateCost(tokens: number): number {
        // Groq pricing is extremely low, approximately $0.00001 per 1K tokens
        // This is just for tracking purposes
        return (tokens / 1000) * 0.00001;
    }

    /**
     * Parse JSON response from LLM
     */
    parseJsonResponse(response: string): any {
        try {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }

            // Try to find any JSON object in the response
            const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
            if (jsonObjectMatch) {
                return JSON.parse(jsonObjectMatch[0]);
            }

            // Try to parse directly
            return JSON.parse(response);
        } catch (error) {
            console.error('Failed to parse JSON response, returning raw string');
            // Return the raw string so the frontend can still display it
            return { _raw: response, summary: response };
        }
    }

    /**
     * Get available models
     */
    getAvailableModels(): string[] {
        return [
            'llama-3.3-70b-versatile',
            'llama-3.1-70b-versatile',
            'llama-3.1-8b-instant',
            'mixtral-8x7b-32768',
            'gemma2-9b-it',
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
                { maxTokens: 10 }
            );
            return result.success && result.data?.includes('OK');
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
export const groqService = new GroqService();
export default groqService;
