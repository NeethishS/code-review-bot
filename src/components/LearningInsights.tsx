import { useState, useEffect } from 'react';
import learningService, { type LearningStats, type MistakePattern } from '../services/learningService';
import './LearningInsights.css';

interface LearningInsightsProps {
    compact?: boolean;
    onNavigateToAnalyser?: () => void;
}

function LearningInsights({ compact = false, onNavigateToAnalyser }: LearningInsightsProps) {
    const [stats, setStats] = useState<LearningStats | null>(null);
    const [patterns, setPatterns] = useState<MistakePattern[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(!compact);

    useEffect(() => {
        const loadData = () => {
            const learningStats = learningService.getLearningStats();
            const allPatterns = Array.from(learningService['patterns'].values());
            const personalizedSuggestions = learningService.getPersonalizedSuggestions(5);
            
            setStats(learningStats);
            setPatterns(allPatterns.sort((a, b) => b.occurrenceCount - a.occurrenceCount));
            setSuggestions(personalizedSuggestions);
        };

        loadData();
        // Refresh every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!stats || stats.totalReviews === 0) {
        return (
            <div className="learning-insights empty">
                <div className="learning-header">
                    <span className="learning-icon">🧠</span>
                    <h3>Learning Insights</h3>
                </div>
                <p className="learning-empty-text">
                    Start analyzing code to build your personalized learning profile!
                </p>
                <div className="learning-features">
                    <button 
                        className="feature-tag-btn" 
                        onClick={onNavigateToAnalyser}
                        title="Go to AI Code Analyser"
                    >
                        📊 Track mistakes
                    </button>
                    <button 
                        className="feature-tag-btn" 
                        onClick={onNavigateToAnalyser}
                        title="Go to AI Code Analyser"
                    >
                        📚 Get tips
                    </button>
                    <button 
                        className="feature-tag-btn" 
                        onClick={onNavigateToAnalyser}
                        title="Go to AI Code Analyser"
                    >
                        📈 See progress
                    </button>
                </div>
            </div>
        );
    }

    const getSkillBadge = (level: string) => {
        const badges: Record<string, { icon: string; color: string }> = {
            'beginner': { icon: '🌱', color: '#22c55e' },
            'intermediate': { icon: '🌿', color: '#3b82f6' },
            'advanced': { icon: '🌳', color: '#8b5cf6' },
            'expert': { icon: '⭐', color: '#f59e0b' },
        };
        return badges[level] || badges['beginner'];
    };

    const getTrendIcon = (trend: string) => {
        const trends: Record<string, string> = {
            'improving': '📈',
            'stable': '➡️',
            'declining': '📉',
        };
        return trends[trend] || '➡️';
    };

    const badge = getSkillBadge(stats.skillLevel);

    return (
        <div className={`learning-insights ${compact ? 'compact' : ''}`}>
            <div className="learning-header" onClick={() => compact && setIsExpanded(!isExpanded)}>
                <span className="learning-icon">🧠</span>
                <h3>Learning Insights</h3>
                {compact && (
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                )}
            </div>

            {isExpanded && (
                <>
                    {/* Stats Overview */}
                    <div className="learning-stats-grid">
                        <div className="stat-item skill-badge" style={{ borderColor: badge.color }}>
                            <span className="stat-icon" style={{ color: badge.color }}>{badge.icon}</span>
                            <div className="stat-content">
                                <span className="stat-label">Skill Level</span>
                                <span className="stat-value" style={{ color: badge.color }}>
                                    {stats.skillLevel.charAt(0).toUpperCase() + stats.skillLevel.slice(1)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="stat-item">
                            <span className="stat-icon">📋</span>
                            <div className="stat-content">
                                <span className="stat-label">Reviews</span>
                                <span className="stat-value">{stats.totalReviews}</span>
                            </div>
                        </div>
                        
                        <div className="stat-item">
                            <span className="stat-icon">🔥</span>
                            <div className="stat-content">
                                <span className="stat-label">Streak</span>
                                <span className="stat-value">{stats.streakDays} days</span>
                            </div>
                        </div>
                        
                        <div className="stat-item">
                            <span className="stat-icon">{getTrendIcon(stats.improvementTrend)}</span>
                            <div className="stat-content">
                                <span className="stat-label">Trend</span>
                                <span className={`stat-value trend-${stats.improvementTrend}`}>
                                    {stats.improvementTrend}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Personalized Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="learning-section">
                            <h4 className="section-title">💡 Personalized Tips</h4>
                            <ul className="suggestions-list">
                                {suggestions.map((suggestion, index) => (
                                    <li key={index} className="suggestion-item">
                                        <span className="suggestion-bullet">▸</span>
                                        <span className="suggestion-text">{suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Top Mistake Categories */}
                    {stats.topMistakeCategories.length > 0 && (
                        <div className="learning-section">
                            <h4 className="section-title">⚠️ Focus Areas</h4>
                            <div className="category-bars">
                                {stats.topMistakeCategories.slice(0, 5).map((cat, index) => {
                                    const maxCount = stats.topMistakeCategories[0].count;
                                    const percentage = (cat.count / maxCount) * 100;
                                    const colors: Record<string, string> = {
                                        'security': '#ef4444',
                                        'performance': '#f59e0b',
                                        'complexity': '#8b5cf6',
                                        'readability': '#3b82f6',
                                        'best-practice': '#10b981',
                                        'bug': '#ec4899',
                                    };
                                    
                                    return (
                                        <div key={index} className="category-bar-item">
                                            <div className="category-label">
                                                <span className="category-name">
                                                    {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                                                </span>
                                                <span className="category-count">{cat.count}</span>
                                            </div>
                                            <div className="category-bar-track">
                                                <div 
                                                    className="category-bar-fill"
                                                    style={{ 
                                                        width: `${percentage}%`,
                                                        backgroundColor: colors[cat.category] || '#6366f1'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Detailed Patterns */}
                    {!compact && patterns.length > 0 && (
                        <div className="learning-section">
                            <h4 className="section-title">🔍 Common Patterns</h4>
                            <div className="patterns-list">
                                {patterns.slice(0, 5).map((pattern) => (
                                    <div key={pattern.id} className={`pattern-card severity-${pattern.category}`}>
                                        <div className="pattern-header">
                                            <span className="pattern-category">{pattern.category}</span>
                                            <span className="pattern-count">×{pattern.occurrenceCount}</span>
                                        </div>
                                        <p className="pattern-type">{pattern.type}</p>
                                        <p className="pattern-desc">{pattern.description.substring(0, 100)}...</p>
                                        {pattern.suggestedFix && (
                                            <div className="pattern-fix">
                                                <strong>Tip:</strong> {pattern.suggestedFix.substring(0, 80)}...
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Learning Summary */}
                    <div className="learning-summary">
                        <p>
                            💪 Keep analyzing code to improve your skills! 
                            {stats.improvementTrend === 'improving' 
                                ? ' You\'re making great progress!' 
                                : stats.improvementTrend === 'declining'
                                    ? ' Try to review the suggestions above.'
                                    : ' Consistency is key to improvement.'}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}

export default LearningInsights;
