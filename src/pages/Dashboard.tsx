import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

import './Dashboard.css';

interface DashboardProps {
    onViewReview: (id: string) => void;
    onViewAllReviews?: () => void;
    onNavigateToAnalyser?: () => void;
}

function Dashboard({ onViewReview, onViewAllReviews, onNavigateToAnalyser }: DashboardProps) {
    const [stats, setStats] = useState({ total_reviews: 0, successful: 0, failed: 0, total_tokens: 0, by_type: [] as any[] });
    const [recentReviews, setRecentReviews] = useState<any[]>([]);
    const [repoCount, setRepoCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [statsRes, reviewsRes, reposRes] = await Promise.all([
                apiService.getReviewStats(),
                apiService.getReviews(10),
                apiService.getRepositories()
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
            if (reposRes.success) setRepoCount(reposRes.data?.length || 0);
            setLoading(false);
        };
        load();
    }, []);

    const successRate = stats.total_reviews > 0 
        ? Math.round((stats.successful / stats.total_reviews) * 100) 
        : 0;

    const formatTime = (ts: string) => {
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const kpiCards = [
        { label: 'Total Reviews', value: stats.total_reviews, icon: '📋' },
        { label: 'Success Rate', value: `${successRate}%`, icon: '📈' },
        { label: 'Repos Connected', value: repoCount || 'No repos yet', icon: '🐙' },
        { label: 'Tokens Consumed', value: stats.total_tokens.toLocaleString(), icon: '🎫' },
    ];

    return (
        <div className="dashboard animate-fade-in">
            {/* KPI Section */}
            <div className="stats-grid">
                {kpiCards.map((card, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-header">
                            <span className="stat-icon">{card.icon}</span>
                        </div>
                        <div className="stat-value">
                            {loading ? <span className="skeleton" style={{ width: '80px', height: '2rem' }}></span> : card.value}
                        </div>
                        <div className="stat-label">
                            {loading ? <span className="skeleton" style={{ width: '100px', height: '0.8rem' }}></span> : card.label}
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-main-layout">
                <div className="dashboard-left-col">
                    {/* Recent Activity Table */}
                    <div className="glass-card recent-activity">
                        <div className="section-header">
                            <h3>Analysis History</h3>
                            {onViewAllReviews && (
                                <button className="btn btn-ghost btn-sm history-link" onClick={onViewAllReviews}>
                                    View Full History →
                                </button>
                            )}
                        </div>

                        <div className="responsive-table-container">
                            <table className="activity-table">
                                <thead>
                                    <tr>
                                        <th>Repository / Target</th>
                                        <th>Analysis Type</th>
                                        <th>Language</th>
                                        <th>Tokens</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i}>
                                                <td><div className="skeleton-text"></div></td>
                                                <td><div className="skeleton-text"></div></td>
                                                <td><div className="skeleton-text"></div></td>
                                                <td><div className="skeleton-text"></div></td>
                                                <td><div className="skeleton-text"></div></td>
                                                <td><div className="skeleton-text"></div></td>
                                            </tr>
                                        ))
                                    ) : recentReviews.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center p-xl">No analysis data yet.</td></tr>
                                    ) : (
                                        recentReviews.map((review) => (
                                            <tr 
                                                key={review.id} 
                                                onClick={() => onViewReview(review.id.toString())}
                                                className="clickable-row"
                                            >
                                                <td>
                                                    <div className="repo-cell">
                                                        <span className="repo-icon">📦</span>
                                                        <span className="repo-name">{review.repository_name || 'Direct Input'}</span>
                                                    </div>
                                                </td>
                                                <td><span className="type-tag">{review.analysis_type}</span></td>
                                                <td>{review.language}</td>
                                                <td>{review.tokens_used}</td>
                                                <td>
                                                    <span className={`status-pill ${review.success ? 'success' : 'error'}`}>
                                                        {review.success ? 'Success' : 'Failed'}
                                                    </span>
                                                </td>
                                                <td>{formatTime(review.created_at)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="dashboard-right-col">
                    {/* Quick Actions */}
                    <div className="glass-card quick-actions">
                        <h3>Quick Actions</h3>
                        <div className="actions-list">
                            <button className="action-btn" onClick={onNavigateToAnalyser}>
                                <span className="action-icon">🚀</span>
                                <div className="action-info">
                                    <strong>New Analysis</strong>
                                    <span>Run AI review on a snippet</span>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => window.location.hash = '#/repositories'}>
                                <span className="action-icon">🐙</span>
                                <div className="action-info">
                                    <strong>Connect Repo</strong>
                                    <span>Sync a new GitHub project</span>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => window.location.hash = '#/automate-prs'}>
                                <span className="action-icon">⚡</span>
                                <div className="action-info">
                                    <strong>PR Automation</strong>
                                    <span>Configure webhooks</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* AI Insights (Compact) */}
                    <div className="glass-card insights-card">
                        <div className="card-header">
                            <h3>💡 AI Tip</h3>
                        </div>
                        <ul className="mini-tips">
                            <li>Focus on reducing Big O complexity in <code>src/utils</code> to improve load times by ~15%.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
