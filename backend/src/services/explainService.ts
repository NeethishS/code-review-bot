import Groq from 'groq-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
import vectorStore from './vectorStore';

dotenv.config();

const groqExplain = new Groq({
    apiKey: process.env.GROQ_EXPLAIN_API_KEY || process.env.GROQ_API_KEY || '',
});

const EXPLAIN_MODEL = process.env.GROQ_EXPLAIN_MODEL || 'llama-3.1-8b-instant';

interface ExplainResult {
    success: boolean;
    explanation?: string;
    relevantFile?: string;
    relevantLines?: { start: number; end: number };
    codeChunk?: string;
    source?: 'groq' | 'rapidapi-fallback';
    error?: string;
}

class ExplainService {
    /** Main explain method — finds relevant chunk via vector search, then explains it */
    async explain(sessionId: string, query: string, customApiKey?: string): Promise<ExplainResult> {
        // 1. Find relevant chunks
        const chunks = vectorStore.search(sessionId, query, 3);

        if (chunks.length === 0) {
            return {
                success: false,
                error: 'No indexed files found for this session. Please upload files first.',
            };
        }

        // 2. Build context from top chunks
        const context = chunks
            .map(c => `// File: ${c.fileName} (lines ${c.startLine}-${c.endLine})\n${c.content}`)
            .join('\n\n---\n\n');

        const topChunk = chunks[0];

        const systemPrompt = `You are a code explanation assistant. You explain code clearly and concisely.
When given a code snippet and a question, explain what the code does in plain English.
Focus on: what it does, how it works, and any important patterns or potential issues.
Keep explanations under 300 words unless the code is complex.`;

        const userPrompt = `Question: ${query}

Relevant code context:
\`\`\`${topChunk.language}
${context}
\`\`\`

Please explain the relevant parts that answer the question.`;

        // 3. Try Groq first

        const execute = async (apiKey: string, model: string) => {
            const tempClient = new Groq({ apiKey });
            const completion = await tempClient.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                model: model,
                temperature: 0.2,
                max_tokens: 1024,
            });
            return completion.choices[0]?.message?.content || '';
        };

        try {
            let explanation = '';
            
            if (customApiKey) {
                try {
                    explanation = await execute(customApiKey, EXPLAIN_MODEL);
                    console.log('✅ Groq Explain via Custom Key');
                } catch (customErr: any) {
                    console.warn('⚠️ Custom API Key failed in explainer, falling back:', customErr.message);
                }
            }
            
            if (!explanation) {
                try {
                    explanation = await execute(process.env.GROQ_EXPLAIN_API_KEY || process.env.GROQ_API_KEY || '', EXPLAIN_MODEL);
                    console.log('✅ Groq Explain via System Key');
                } catch (sysErr: any) {
                    if (sysErr.status === 429 && process.env.BACKUP_GROQ_API_KEY) {
                        console.warn('⚠️ System Key Rate Limit (429), falling back to Backup Key in Explainer...');
                        explanation = await execute(process.env.BACKUP_GROQ_API_KEY, process.env.BACKUP_GROQ_MODEL || 'llama-3.1-8b-instant');
                        console.log('✅ Groq Explain via Backup Key');
                    } else {
                        throw sysErr;
                    }
                }
            }

            return {
                success: true,
                explanation,
                relevantFile: topChunk.fileName,
                relevantLines: { start: topChunk.startLine, end: topChunk.endLine },
                codeChunk: topChunk.content,
                source: 'groq',
            };
        } catch (groqError: any) {
            console.warn('⚠️ Groq explain failed, trying RapidAPI fallback:', groqError.message);
            return this.rapidApiFallback(query, topChunk);
        }
    }

    /** RapidAPI fallback */
    private async rapidApiFallback(query: string, chunk: any): Promise<ExplainResult> {
        try {
            const response = await axios.post(
                'https://ai-text-moderation-toxicity-aspects-sentiment-analyzer.p.rapidapi.com/analyze.php',
                {
                    text: `Code question: ${query}\n\nCode snippet:\n${chunk.content.slice(0, 500)}`,
                    metadata: { request_id: `explain-${Date.now()}` },
                },
                {
                    headers: {
                        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
                        'x-rapidapi-host': process.env.RAPIDAPI_HOST || '',
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                }
            );

            const data = response.data;
            const sentiment = data?.sentiment?.label || 'neutral';
            const aspects = data?.aspects?.map((a: any) => a.aspect).join(', ') || 'none detected';

            return {
                success: true,
                explanation: `[Fallback analysis — Groq unavailable]\n\nThe code in ${chunk.fileName} (lines ${chunk.startLine}-${chunk.endLine}) was analyzed.\n\nSentiment of the query context: ${sentiment}\nKey aspects detected: ${aspects}\n\nNote: For full code explanation, please try again when the primary AI service is available.`,
                relevantFile: chunk.fileName,
                relevantLines: { start: chunk.startLine, end: chunk.endLine },
                codeChunk: chunk.content,
                source: 'rapidapi-fallback',
            };
        } catch (fallbackError: any) {
            return {
                success: false,
                error: `Both primary (Groq) and fallback (RapidAPI) services failed. Groq: rate limit or API error. Fallback: ${fallbackError.message}`,
            };
        }
    }

    /** Index uploaded files into the vector store */
    indexFiles(sessionId: string, files: Array<{ name: string; language: string; content: string }>): number {
        let total = 0;
        for (const file of files) {
            total += vectorStore.indexFile(sessionId, file.name, file.language, file.content);
        }
        return total;
    }

    listIndexedFiles(sessionId: string): string[] {
        return vectorStore.listFiles(sessionId);
    }

    clearSession(sessionId: string): void {
        vectorStore.clearSession(sessionId);
    }
}

export const explainService = new ExplainService();
export default explainService;
