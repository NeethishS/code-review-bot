import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import './ReviewHistory.css';

interface Props {
    onViewReview: (id: string) => void;
}

const ANALYSIS_TYPES = ['all', 'code-smell', 'security', 'performance', 'complexity', 'duplicates', 'test-generation', 'full-review'];
const LANGUAGES = ['all', 'javascript', 'python', 'java', 'cpp', 'c'];
const PAGE_SIZE = 10;

export default function ReviewHistory({ onViewReview }: Props) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [filterType, setFilterType] = useState('all');
    const [filterLang, setFilterLang] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        const res = await apiService.getReviews(PAGE_SIZE, page * PAGE_SIZE);
        if (res.success) {
            setReviews(res.data || []);
            setTotal(res.total || 0);
        }
        setLoading(false);
    }, [page]);

    useEffect(() => { load(); }, [load]);

    const filtered = reviews.filter(r => {
        if (filterType !== 'all' && r.analysis_type !== filterType) return false;
        if (filterLang !== 'all' && r.language !== filterLang) return false;
        if (filterStatus === 'success' && !r.success) return false;
        if (filterStatus === 'failed' && r.success) return false;
        return true;
    });

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const formatTime = (ts: string) => {
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return new Date(ts).toLocaleDateString();
    };

    const typeIcon: Record<string, string> = {
        'code-smell': '🔍', 'security': '🔒', 'performance': '⚡',
        'complexity': '📊', 'duplicates': '🔄', 'test-generation': '🧪', 'full-review': '📋',
    };

    return (
        <div className="review-history animate-fade-in">
            <div className="page-header">
                <div>
                    <h2>📜 Review History</h2>
                    <p className="text-muted">{total} total reviews saved</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
            </div>

            {/* Filters */}
            <div className="glass-card rh-filters">
                <div className="rh-filter-group">
                    <label>Type</label>
                    <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        {ANALYSIS_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
                    </select>
                </div>
                <div className="rh-filter-group">
                    <label>Language</label>
                    <select className="input" value={filterLang} onChange={e => setFilterLang(e.target.value)}>
                        {LANGUAGES.map(l => <option key={l} value={l}>{l === 'all' ? 'All Languages' : l}</option>)}
                    </select>
                </div>
                <div className="rh-filter-group">
                    <label>Status</label>
                    <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="all">All</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
                <div className="rh-filter-count">
                    Showing {filtered.length} of {reviews.length}
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rh-table-card">
                {loading ? (
                    <div className="rh-loading">⏳ Loading reviews...</div>
                ) : filtered.length === 0 ? (
                    <div className="rh-empty">
                        <span>📭</span>
                        <p>No reviews match your filters.</p>
                    </div>
                ) : (
                    <table className="rh-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Type</th>
                                <th>Language</th>
                                <th>Status</th>
                                <th>Tokens</th>
                                <th>Cost</th>
                                <th>Time</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r.id} className="rh-row" onClick={() => onViewReview(r.id.toString())}>
                                    <td className="rh-id">#{r.id}</td>
                                    <td>
                                        <span className="rh-type-badge">
                                            {typeIcon[r.analysis_type] || '📄'} {r.analysis_type}
                                        </span>
                                    </td>
                                    <td><span className="rh-lang-badge">{r.language}</span></td>
                                    <td>
                                        <span className={`badge badge-${r.success ? 'success' : 'error'}`}>
                                            {r.success ? '✓ success' : '✗ failed'}
                                        </span>
                                    </td>
                                    <td className="rh-num">{r.tokens_used || 0}</td>
                                    <td className="rh-num">${Number(r.cost || 0).toFixed(6)}</td>
                                    <td className="rh-time">{formatTime(r.created_at)}</td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm rh-view-btn"
                                            onClick={e => { e.stopPropagation(); onViewReview(r.id.toString()); }}>
                                            View →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="rh-pagination">
                    <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <span>Page {page + 1} of {totalPages}</span>
                    <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
            )}
        </div>
    );
}
