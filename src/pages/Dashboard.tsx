import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import LearningInsights from '../components/LearningInsights';
import './Dashboard.css';

interface DashboardProps {
    onViewReview: (id: string) => void;
    onViewAllReviews?: () => void;
    onNavigateToAnalyser?: () => void;
}

function Dashboard({ onViewReview, onViewAllReviews, onNavigateToAnalyser }: DashboardProps) {
    const [stats, setStats] = useState({ total_reviews: 0, successful: 0, failed: 0, total_tokens: 0, by_type: [] as any[] });
    const [recentReviews, setRecentReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [statsRes, reviewsRes] = await Promise.all([
                apiService.getReviewStats(),
                apiService.getReviews(5),
            ]);
            if (statsRes.success && statsRes.data) {
                setStats({
                    total_reviews: Number(statsRes.data.total_reviews) || 0,
                    successful: Number(statsRes.data.successful) || 0,
                    failed: Number(statsRes.data.failed) || 0,
                    total_tokens: Number(statsRes.data.total_tokens) || 0,
                    by_type: statsRes.data.by_type || [],
                });
            }
            if (reviewsRes.success) setRecentReviews(reviewsRes.data || []);
            setLoading(false);
        };
        load();
    }, []);

    const statCards = [
        { label: 'Total Reviews', value: stats.total_reviews?.toString() || '0', icon: '📋' },
        { label: 'Successful', value: stats.successful?.toString() || '0', icon: '✅' },
        { label: 'Failed', value: stats.failed?.toString() || '0', icon: '❌' },
        { label: 'Tokens Used', value: stats.total_tokens ? Number(stats.total_tokens).toLocaleString() : '0', icon: '🎫' },
    ];

    const formatTime = (ts: string) => {
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="dashboard animate-fade-in">
            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-header">
                            <span className="stat-icon">{stat.icon}</span>
                        </div>
                        <div className="stat-value">{loading ? '...' : stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <div className="glass-card chart-card">
                    <h3 className="chart-title">Analysis by Type</h3>
                    <div className="chart-placeholder">
                        {stats.by_type.length > 0 ? (
                            <div className="bar-chart">
                                {stats.by_type.map((item: any, i: number) => {
                                    const max = Math.max(...stats.by_type.map((x: any) => Number(x.count)));
                                    const pct = max > 0 ? (Number(item.count) / max) * 100 : 10;
                                    return (
                                        <div key={i} className="bar-wrapper">
                                            <div className="bar" style={{ height: `${pct}%` }} title={`${item.count} reviews`} />
                                            <span className="bar-label">{item.analysis_type.replace('-', ' ').slice(0, 6)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                <p>No analysis data yet</p>
                                <p style={{ fontSize: '0.8rem' }}>Run some analyses to see stats</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card chart-card">
                    <h3 className="chart-title">Success Rate</h3>
                    <div className="chart-placeholder">
                        {stats.total_reviews > 0 ? (
                            <>
                                <div className="donut-chart">
                                    <div className="donut-center">
                                        <div className="donut-value">
                                            {Math.round((stats.successful / stats.total_reviews) * 100)}%
                                        </div>
                                        <div className="donut-label">Success</div>
                                    </div>
                                </div>
                                <div className="donut-legend">
                                    <div className="legend-item">
                                        <span className="legend-dot" style={{ background: 'var(--color-accent)' }}></span>
                                        <span>Success ({stats.successful})</span>
                                    </div>
                                    <div className="legend-item">
                                        <span className="legend-dot" style={{ background: 'var(--color-error)' }}></span>
                                        <span>Failed ({stats.failed})</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                <p>No data yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Learning Insights - Memory/Learning Feature */}
            <LearningInsights onNavigateToAnalyser={onNavigateToAnalyser} />

            {/* Recent Reviews */}
            <div className="glass-card recent-reviews">
                <div className="section-header">
                    <h3>Recent Reviews</h3>
                    {onViewAllReviews && (
                        <button className="btn btn-ghost btn-sm" onClick={onViewAllReviews}>
                            View All →
                        </button>
                    )}
                </div>

                <div className="reviews-list">
                    {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
                    {!loading && recentReviews.length === 0 && (
                        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                            No reviews yet. Go to AI Code Analyser and run your first analysis!
                        </p>
                    )}
                    {recentReviews.map((review) => (
                        <div
                            key={review.id}
                            className="review-item"
                            onClick={() => onViewReview(review.id.toString())}
                        >
                            <div className="review-main">
                                <div className="review-info">
                                    <div className="review-repo">
                                        📦 {review.repository_name || 'Direct Analysis'}
                                    </div>
                                    <div className="review-pr">
                                        {review.analysis_type} — {review.language}
                                    </div>
                                    <div className="review-meta">
                                        <span className="review-time">🕐 {formatTime(review.created_at)}</span>
                                        {review.tokens_used > 0 && (
                                            <span>🎫 {review.tokens_used} tokens</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="review-status">
                                <span className={`badge badge-${review.success ? 'success' : 'error'}`}>
                                    {review.success ? 'success' : 'failed'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
