import dotenv from 'dotenv';
dotenv.config();

/**
 * Simple in-memory cache for API responses
 * Saves credits by caching identical requests
 */

interface CacheEntry {
    data: any;
    timestamp: number;
    tokensUsed: number;
}

class ResponseCache {
    private cache: Map<string, CacheEntry> = new Map();
    private enabled: boolean;
    private ttlMinutes: number;
    private hits: number = 0;
    private misses: number = 0;

    constructor() {
        this.enabled = process.env.ENABLE_RESPONSE_CACHE === 'true';
        this.ttlMinutes = parseInt(process.env.CACHE_TTL_MINUTES || '60');

        if (this.enabled) {
            console.log(`✅ Response cache enabled (TTL: ${this.ttlMinutes} minutes)`);
            // Clean cache every 10 minutes
            setInterval(() => this.cleanup(), 10 * 60 * 1000);
        }
    }

    /**
     * Generate cache key from request
     */
    private generateKey(code: string, language: string, analysisType: string): string {
        // Simple hash function
        const str = `${code}|${language}|${analysisType}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `${analysisType}_${Math.abs(hash)}`;
    }

    /**
     * Get cached response
     */
    get(code: string, language: string, analysisType: string): any | null {
        if (!this.enabled) return null;

        const key = this.generateKey(code, language, analysisType);
        const entry = this.cache.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        // Check if expired
        const now = Date.now();
        const age = (now - entry.timestamp) / 1000 / 60; // minutes

        if (age > this.ttlMinutes) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        console.log(`💾 Cache HIT! Saved ${entry.tokensUsed} tokens (${this.getHitRate()}% hit rate)`);
        return entry.data;
    }

    /**
     * Store response in cache
     */
    set(code: string, language: string, analysisType: string, data: any, tokensUsed: number): void {
        if (!this.enabled) return;

        const key = this.generateKey(code, language, analysisType);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            tokensUsed,
        });

        console.log(`💾 Cached response (${this.cache.size} items in cache)`);
    }

    /**
     * Clean expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            const age = (now - entry.timestamp) / 1000 / 60;
            if (age > this.ttlMinutes) {
                this.cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`🧹 Cache cleanup: removed ${removed} expired entries`);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            enabled: this.enabled,
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.getHitRate(),
            ttlMinutes: this.ttlMinutes,
        };
    }

    /**
     * Get hit rate percentage
     */
    private getHitRate(): number {
        const total = this.hits + this.misses;
        if (total === 0) return 0;
        return Math.round((this.hits / total) * 100);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        console.log('🧹 Cache cleared');
    }
}

// Export singleton instance
export const responseCache = new ResponseCache();
export default responseCache;
