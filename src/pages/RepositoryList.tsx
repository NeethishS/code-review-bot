import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import './RepositoryList.css';

import type { Page } from '../types';

interface RepositoryListProps {
    onNavigate: (page: Page, params?: any) => void;
}

function RepositoryList({ onNavigate }: RepositoryListProps) {
    const [repositories, setRepositories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newRepo, setNewRepo] = useState({ name: '', description: '', language: '' });
    const [saving, setSaving] = useState(false);

    const load = async () => {
        const res = await apiService.getRepositories();
        if (res.success) setRepositories(res.data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleToggle = async (id: number) => {
        const res = await apiService.toggleRepository(id);
        if (res.success) {
            setRepositories(prev => prev.map(r => r.id === id ? res.data : r));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this repository?')) return;
        await apiService.deleteRepository(id);
        setRepositories(prev => prev.filter(r => r.id !== id));
    };

    const handleAdd = async () => {
        if (!newRepo.name.trim()) return;
        setSaving(true);
        const res = await apiService.createRepository(newRepo.name, newRepo.description, newRepo.language);
        if (res.success) {
            setRepositories(prev => [res.data, ...prev]);
            setNewRepo({ name: '', description: '', language: '' });
            setShowAdd(false);
        }
        setSaving(false);
    };



    return (
        <div className="repository-list animate-fade-in">
            <div className="page-header">
                <div>
                    <h2>Connected Repositories</h2>
                    <p className="text-muted">Manage repositories and configure review settings</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
                    <span>➕</span>
                    <span>Add Repository</span>
                </button>
            </div>

            {/* Add Repository Form */}
            {showAdd && (
                <div className="glass-card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>New Repository</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        <input
                            className="input"
                            placeholder="Repository name (e.g. my-app)"
                            value={newRepo.name}
                            onChange={e => setNewRepo(p => ({ ...p, name: e.target.value }))}
                        />
                        <input
                            className="input"
                            placeholder="Description (optional)"
                            value={newRepo.description}
                            onChange={e => setNewRepo(p => ({ ...p, description: e.target.value }))}
                        />
                        <input
                            className="input"
                            placeholder="Language (e.g. TypeScript)"
                            value={newRepo.language}
                            onChange={e => setNewRepo(p => ({ ...p, language: e.target.value }))}
                        />
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
                                {saving ? 'Saving...' : 'Add Repository'}
                            </button>
                            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading repositories...</p>}

            {!loading && repositories.length === 0 && (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦</p>
                    <p style={{ color: 'var(--color-text-muted)' }}>No repositories yet. Add one to get started.</p>
                </div>
            )}

            <div className="repos-grid">
                {repositories.map((repo) => (
                    <div key={repo.id} className="glass-card repo-card">
                        <div className="repo-header">
                            <div className="repo-info">
                                <h3 className="repo-name">📦 {repo.name}</h3>
                                {repo.description && (
                                    <p className="repo-description">{repo.description}</p>
                                )}
                                {repo.language && (
                                    <span className="badge badge-neutral">{repo.language}</span>
                                )}
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={repo.enabled}
                                    onChange={() => handleToggle(repo.id)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="repo-footer">
                            <div className="repo-actions">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => onNavigate('ai-demo', { repoName: repo.name })}
                                >
                                    🔍 Review
                                </button>
                                <button
                                    className="btn btn-accent btn-sm"
                                    onClick={() => onNavigate('explainer', { repoName: repo.name })}
                                >
                                    💬 Explain
                                </button>
                            </div>
                            <button
                                className="btn btn-ghost btn-sm repo-delete-btn"
                                onClick={() => handleDelete(repo.id)}
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RepositoryList;
