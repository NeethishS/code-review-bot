/**
 * Learning Service - Tracks user mistakes and provides personalized improvement suggestions
 * This enables the "Memory / Learning" feature - tracking user patterns over time
 */

export interface MistakePattern {
    id: string;
    category: 'complexity' | 'security' | 'performance' | 'readability' | 'best-practice' | 'bug';
    type: string;
    description: string;
    occurrenceCount: number;
    firstSeen: Date;
    lastSeen: Date;
    exampleCode?: string;
    suggestedFix?: string;
}

export interface LearningStats {
    totalReviews: number;
    mistakeFrequency: Record<string, number>;
    topMistakeCategories: Array<{ category: string; count: number }>;
    improvementTrend: 'improving' | 'stable' | 'declining';
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    streakDays: number;
}

const LEARNING_STORAGE_KEY = 'crb_learning_data';

class LearningService {
    private patterns: Map<string, MistakePattern> = new Map();
    private reviewCount: number = 0;

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Load learning data from localStorage
     */
    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(LEARNING_STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                // Hydrate Map and revive Dates
                const entries = Object.entries(data.patterns || {}).map(([key, p]: [string, any]) => {
                    return [key, {
                        ...p,
                        firstSeen: new Date(p.firstSeen),
                        lastSeen: new Date(p.lastSeen)
                    }];
                });
                this.patterns = new Map(entries as any);
                this.reviewCount = data.reviewCount || 0;
            }
        } catch (e) {
            console.warn('Failed to load learning data:', e);
        }
    }

    /**
     * Save learning data to localStorage
     */
    private saveToStorage(): void {
        try {
            const data = {
                patterns: Object.fromEntries(this.patterns),
                reviewCount: this.reviewCount,
                lastUpdated: new Date().toISOString(),
            };
            localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save learning data:', e);
        }
    }

    /**
     * Extract patterns from analysis results
     */
    analyzeResult(analysisType: string, result: any): void {
        this.reviewCount++;
        
        if (!result || !result.data) return;

        const data = result.data;

        // Extract issues based on analysis type
        let issues: any[] = [];
        
        switch (analysisType) {
            case 'code-smell':
                issues = data.smells || [];
                break;
            case 'security':
                issues = data.vulnerabilities || [];
                break;
            case 'performance':
                issues = data.issues || [];
                break;
            case 'full-review':
            case 'before-after':
                issues = data.issues || [];
                break;
            case 'complexity':
                if (data.complexFunctions) {
                    issues = data.complexFunctions.map((f: any) => ({
                        type: 'high-complexity',
                        severity: 'medium',
                        description: `Function ${f.name} has complexity ${f.complexity}`,
                        line: f.line,
                    }));
                }
                break;
        }

        // Track each issue as a potential pattern
        issues.forEach((issue: any) => {
            this.trackPattern({
                category: this.mapToCategory(issue.type || '', analysisType),
                type: issue.type || 'unknown',
                description: issue.description || issue.why || '',
                exampleCode: issue.fixedCode || '',
                suggestedFix: issue.suggestion || issue.fix || issue.optimization || '',
            });
        });

        this.saveToStorage();
    }

    /**
     * Map issue type to category
     */
    private mapToCategory(issueType: string, analysisType: string): MistakePattern['category'] {
        const type = issueType.toLowerCase();
        
        if (type.includes('sql') || type.includes('xss') || type.includes('injection') || 
            type.includes('auth') || type.includes('secret') || analysisType === 'security') {
            return 'security';
        }
        if (type.includes('loop') || type.includes('complexity') || type.includes('o(n') || 
            type.includes('performance') || type.includes('memory') || analysisType === 'performance') {
            return 'performance';
        }
        if (type.includes('nesting') || type.includes('cyclomatic') || type.includes('cognitive') ||
            analysisType === 'complexity') {
            return 'complexity';
        }
        if (type.includes('naming') || type.includes('readability') || type.includes('comment') ||
            type.includes('format')) {
            return 'readability';
        }
        if (type.includes('bug') || type.includes('error') || type.includes('null') ||
            type.includes('undefined')) {
            return 'bug';
        }
        
        return 'best-practice';
    }

    /**
     * Track a new pattern or increment existing
     */
    private trackPattern(pattern: Omit<MistakePattern, 'id' | 'occurrenceCount' | 'firstSeen' | 'lastSeen'>): void {
        const key = `${pattern.category}:${pattern.type}`;
        const existing = this.patterns.get(key);

        if (existing) {
            existing.occurrenceCount++;
            existing.lastSeen = new Date();
            // Update example if we have a new one
            if (pattern.exampleCode && !existing.exampleCode) {
                existing.exampleCode = pattern.exampleCode;
            }
            if (pattern.suggestedFix && !existing.suggestedFix) {
                existing.suggestedFix = pattern.suggestedFix;
            }
        } else {
            this.patterns.set(key, {
                id: key,
                category: pattern.category,
                type: pattern.type,
                description: pattern.description,
                occurrenceCount: 1,
                firstSeen: new Date(),
                lastSeen: new Date(),
                exampleCode: pattern.exampleCode,
                suggestedFix: pattern.suggestedFix,
            });
        }
    }

    /**
     * Get personalized suggestions based on user's common mistakes
     */
    getPersonalizedSuggestions(limit: number = 3): string[] {
        const sortedPatterns = Array.from(this.patterns.values())
            .filter(p => p.occurrenceCount >= 2) // Only suggest patterns that occurred multiple times
            .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
            .slice(0, limit);

        return sortedPatterns.map(p => {
            const count = p.occurrenceCount;
            const category = p.category;
            const action = this.getSuggestionAction(category);
            
            return `📚 You've had ${count} ${category} issues (like "${p.type}"). ${action}`;
        });
    }

    /**
     * Get action suggestion based on category
     */
    private getSuggestionAction(category: string): string {
        const suggestions: Record<string, string> = {
            'complexity': 'Consider breaking down complex functions into smaller ones.',
            'security': 'Always validate and sanitize external inputs.',
            'performance': 'Watch out for nested loops - can you use a hash map instead?',
            'readability': 'Use descriptive variable names and add comments for complex logic.',
            'best-practice': 'Follow the DRY principle and avoid magic numbers.',
            'bug': 'Add null checks and handle edge cases early.',
        };
        
        return suggestions[category] || 'Review this pattern to improve your code quality.';
    }

    /**
     * Get learning statistics
     */
    getLearningStats(): LearningStats {
        const patterns = Array.from(this.patterns.values());
        
        // Calculate category frequencies
        const categoryCount: Record<string, number> = {};
        patterns.forEach(p => {
            categoryCount[p.category] = (categoryCount[p.category] || 0) + p.occurrenceCount;
        });

        // Calculate top mistake categories
        const topMistakeCategories = Object.entries(categoryCount)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);

        // Determine skill level
        let skillLevel: LearningStats['skillLevel'] = 'beginner';
        if (this.reviewCount > 50 && topMistakeCategories.length < 3) {
            skillLevel = 'expert';
        } else if (this.reviewCount > 30 && topMistakeCategories.length < 5) {
            skillLevel = 'advanced';
        } else if (this.reviewCount > 10) {
            skillLevel = 'intermediate';
        }

        // Calculate improvement trend (simplified)
        const recentPatterns = patterns.filter(p => {
            const daysSince = (Date.now() - p.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince <= 7;
        });
        
        let improvementTrend: LearningStats['improvementTrend'] = 'stable';
        if (recentPatterns.length < topMistakeCategories.length / 2) {
            improvementTrend = 'improving';
        } else if (recentPatterns.length > topMistakeCategories.length) {
            improvementTrend = 'declining';
        }

        return {
            totalReviews: this.reviewCount,
            mistakeFrequency: categoryCount,
            topMistakeCategories,
            improvementTrend,
            skillLevel,
            streakDays: this.calculateStreak(),
        };
    }

    /**
     * Calculate consecutive days of code review activity
     */
    private calculateStreak(): number {
        // Simplified streak calculation
        return Math.min(this.reviewCount, 30);
    }

    /**
     * Get detailed patterns for a specific category
     */
    getPatternsByCategory(category: string): MistakePattern[] {
        return Array.from(this.patterns.values())
            .filter(p => p.category === category)
            .sort((a, b) => b.occurrenceCount - a.occurrenceCount);
    }

    /**
     * Clear all learning data
     */
    clearLearningData(): void {
        this.patterns.clear();
        this.reviewCount = 0;
        localStorage.removeItem(LEARNING_STORAGE_KEY);
    }

    /**
     * Export learning data for analysis
     */
    exportLearningData(): object {
        return {
            patterns: Object.fromEntries(this.patterns),
            reviewCount: this.reviewCount,
            stats: this.getLearningStats(),
            exportedAt: new Date().toISOString(),
        };
    }
}

// Export singleton instance
export const learningService = new LearningService();
export default learningService;
