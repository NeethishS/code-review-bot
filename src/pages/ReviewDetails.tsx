import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import './ReviewDetails.css';

interface ReviewDetailsProps {
    reviewId: string | null;
}

function ReviewDetails({ reviewId }: ReviewDetailsProps) {
    const [review, setReview] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!reviewId) return;
        setLoading(true);
        apiService.getReview(Number(reviewId)).then(res => {
            if (res.success) setReview(res.data);
            setLoading(false);
        });
    }, [reviewId]);

    if (!reviewId) {
        return (
            <div className="review-details animate-fade-in">
                <div className="empty-state">
                    <span className="empty-icon">📋</span>
                    <h3>No Review Selected</h3>
                    <p>Select a review from the dashboard to view details</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="review-details animate-fade-in">
                <div className="empty-state">
                    <span className="empty-icon">⏳</span>
                    <h3>Loading...</h3>
                </div>
            </div>
        );
    }

    if (!review) {
        return (
            <div className="review-details animate-fade-in">
                <div className="empty-state">
                    <span className="empty-icon">❌</span>
                    <h3>Review Not Found</h3>
                    <p>This review may have been deleted</p>
                </div>
            </div>
        );
    }

    const data = review.result || {};
    const issues = data.issues || data.smells || data.vulnerabilities || [];
    const strengths = data.strengths || [];
    const summary = data.summary || data._raw || 'No summary available';
    const score = data.overallScore || data.riskScore || null;

    const formatTime = (ts: string) => new Date(ts).toLocaleString();

    return (
        <div className="review-details animate-fade-in">
            {/* Review Header */}
            <div className="glass-card review-header">
                <div className="review-title-section">
                    <h2>
                        {review.analysis_type} — {review.language}
                    </h2>
                    <div className="review-meta-info">
                        <span>🕐 {formatTime(review.created_at)}</span>
                        {review.repository_name && <span>📦 {review.repository_name}</span>}
                        <span className={`badge badge-${review.success ? 'success' : 'error'}`}>
                            {review.success ? 'success' : 'failed'}
                        </span>
                    </div>
                </div>

                <div className="review-summary-stats">
                    <div className="summary-stat">
                        <div className="summary-value">{issues.length}</div>
                        <div className="summary-label">Issues Found</div>
                    </div>
                    <div className="summary-stat">
                        <div className="summary-value">{review.tokens_used || 0}</div>
                        <div className="summary-label">Tokens Used</div>
                    </div>
                    {score !== null && (
                        <div className="summary-stat">
                            <div className="summary-value">{score}</div>
                            <div className="summary-label">Score</div>
                        </div>
                    )}
                    <div className="summary-stat">
                        <div className="summary-value">${Number(review.cost || 0).toFixed(6)}</div>
                        <div className="summary-label">Cost</div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="glass-card">
                <h3 className="section-title">📝 Summary</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{summary}</p>
            </div>

            {/* Strengths */}
            {strengths.length > 0 && (
                <div className="glass-card">
                    <h3 className="section-title">✨ Strengths</h3>
                    <ul className="suggestions-list">
                        {strengths.map((s: string, i: number) => (
                            <li key={i} className="suggestion-item">{s}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Issues */}
            {issues.length > 0 && (
                <div className="glass-card">
                    <h3 className="section-title">⚠️ Issues Found ({issues.length})</h3>
                    <div className="bugs-list">
                        {issues.map((issue: any, i: number) => (
                            <div key={i} className="bug-item">
                                <div className="bug-header">
                                    <span className={`badge badge-${issue.severity === 'high' || issue.severity === 'critical' ? 'error' : issue.severity === 'medium' ? 'warning' : 'info'}`}>
                                        {issue.severity || 'info'}
                                    </span>
                                    {issue.line && (
                                        <span className="bug-location">Line {issue.line}</span>
                                    )}
                                    {issue.type && (
                                        <span className="bug-location">{issue.type}</span>
                                    )}
                                </div>
                                <div className="bug-message">{issue.description || issue.message}</div>
                                {(issue.suggestion || issue.fix || issue.optimization) && (
                                    <div className="bug-suggestion">
                                        💡 {issue.suggestion || issue.fix || issue.optimization}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Raw result if no structured data */}
            {issues.length === 0 && !data._raw && review.result && (
                <div className="glass-card">
                    <h3 className="section-title">📊 Raw Result</h3>
                    <pre style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', overflowX: 'auto' }}>
                        {JSON.stringify(review.result, null, 2)}
                    </pre>
                </div>
            )}

            {/* Code snippet */}
            {review.code_snippet && (
                <div className="glass-card">
                    <h3 className="section-title">💻 Analyzed Code</h3>
                    <pre style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', overflowX: 'auto', maxHeight: '300px' }}>
                        <code>{review.code_snippet}</code>
                    </pre>
                </div>
            )}
        </div>
    );
}

export default ReviewDetails;
