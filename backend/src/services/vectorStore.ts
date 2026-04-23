/**
 * Lightweight in-memory vector store using TF-IDF cosine similarity.
 * No external model or API needed — works purely on token frequency.
 * Suitable for code search/retrieval within a session.
 */

interface CodeChunk {
    id: string;
    sessionId: string;
    fileName: string;
    language: string;
    content: string;
    startLine: number;
    endLine: number;
    tokens: Map<string, number>; // TF vector
}

class VectorStore {
    private chunks: CodeChunk[] = [];
    private readonly CHUNK_SIZE = 60; // lines per chunk

    /** Tokenize code into meaningful terms */
    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            // split on non-alphanumeric (handles camelCase, snake_case, etc.)
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(/[^a-z0-9_]+/)
            .filter(t => t.length > 1 && t.length < 40);
    }

    /** Build TF (term frequency) map */
    private buildTF(tokens: string[]): Map<string, number> {
        const tf = new Map<string, number>();
        for (const t of tokens) {
            tf.set(t, (tf.get(t) || 0) + 1);
        }
        return tf;
    }

    /** Cosine similarity between two TF maps */
    private cosineSim(a: Map<string, number>, b: Map<string, number>): number {
        let dot = 0, normA = 0, normB = 0;
        for (const [term, freq] of a) {
            dot += freq * (b.get(term) || 0);
            normA += freq * freq;
        }
        for (const [, freq] of b) {
            normB += freq * freq;
        }
        if (normA === 0 || normB === 0) return 0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /** Chunk a file into overlapping windows */
    private chunkFile(content: string, fileName: string, language: string, sessionId: string): CodeChunk[] {
        const lines = content.split('\n');
        const chunks: CodeChunk[] = [];
        const step = Math.floor(this.CHUNK_SIZE * 0.75); // 25% overlap

        for (let i = 0; i < lines.length; i += step) {
            const chunkLines = lines.slice(i, i + this.CHUNK_SIZE);
            const chunkContent = chunkLines.join('\n');
            const tokens = this.tokenize(chunkContent);
            chunks.push({
                id: `${sessionId}:${fileName}:${i}`,
                sessionId,
                fileName,
                language,
                content: chunkContent,
                startLine: i + 1,
                endLine: Math.min(i + this.CHUNK_SIZE, lines.length),
                tokens: this.buildTF(tokens),
            });
        }
        return chunks;
    }

    /** Index a file into the store */
    indexFile(sessionId: string, fileName: string, language: string, content: string): number {
        // Remove old chunks for this file in this session
        this.chunks = this.chunks.filter(c => !(c.sessionId === sessionId && c.fileName === fileName));
        const newChunks = this.chunkFile(content, fileName, language, sessionId);
        this.chunks.push(...newChunks);
        return newChunks.length;
    }

    /** Search for the most relevant chunks given a query */
    search(sessionId: string, query: string, topK = 3): CodeChunk[] {
        const queryTokens = this.tokenize(query);
        const queryTF = this.buildTF(queryTokens);

        const sessionChunks = this.chunks.filter(c => c.sessionId === sessionId);
        if (sessionChunks.length === 0) return [];

        const scored = sessionChunks.map(chunk => ({
            chunk,
            score: this.cosineSim(queryTF, chunk.tokens),
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK).filter(s => s.score > 0).map(s => s.chunk);
    }

    /** List all indexed files for a session */
    listFiles(sessionId: string): string[] {
        const files = new Set(
            this.chunks.filter(c => c.sessionId === sessionId).map(c => c.fileName)
        );
        return Array.from(files);
    }

    /** Clear all chunks for a session */
    clearSession(sessionId: string): void {
        this.chunks = this.chunks.filter(c => c.sessionId !== sessionId);
    }

    /** Stats */
    stats() {
        return {
            totalChunks: this.chunks.length,
            sessions: [...new Set(this.chunks.map(c => c.sessionId))].length,
        };
    }
}

export const vectorStore = new VectorStore();
export default vectorStore;
