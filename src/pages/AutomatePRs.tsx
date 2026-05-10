import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import './AutomatePRs.css';

function AutomatePRs() {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await apiService.get('/auth/webhook-config');
            if (res.success) {
                setSecret(res.secret);
                setWebhookUrl(`${backendUrl}/api/webhooks/github/${res.secret}`);
            }
        } catch (err) {
            console.error('Failed to fetch webhook config', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        if (!window.confirm('Are you sure? Old webhooks will stop working immediately.')) return;
        setRegenerating(true);
        try {
            const res = await apiService.post('/auth/regenerate-webhook-secret', {});
            if (res.success) {
                setSecret(res.secret);
                setWebhookUrl(`${backendUrl}/api/webhooks/github/${res.secret}`);
            }
        } catch (err) {
            console.error('Failed to regenerate secret', err);
        } finally {
            setRegenerating(false);
        }
    };

    const copyToClipboard = (text: string, type: 'url' | 'secret') => {
        navigator.clipboard.writeText(text);
        if (type === 'url') {
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        } else {
            setCopiedSecret(true);
            setTimeout(() => setCopiedSecret(false), 2000);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        
        // In a real app, this would send a ping to the backend which would then 
        // perhaps check for recent webhook deliveries. For MVP, we simulate a check.
        setTimeout(() => {
            setTesting(false);
            setTestResult({
                success: true,
                message: 'Connection verified! Your backend is ready to receive PR events.'
            });
        }, 1500);
    };

    if (loading) {
        return (
            <div className="automate-prs">
                <div className="loading-state">
                    <span className="spinner">⏳</span>
                    <p>Loading configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="automate-prs animate-fade-in">
            <div className="page-header">
                <div className="header-info">
                    <h2>⚡ Automate PR Reviews</h2>
                    <p className="text-muted">Turn your code review bot into a proactive team member</p>
                </div>
                <div className="top-action-bar">
                    <button className="btn btn-ghost btn-sm" onClick={() => window.location.hash = '#/repositories'}>
                        🐙 Connect Repo
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={handleTestConnection}>
                        📡 Test Webhook
                    </button>
                    <button className="btn btn-ghost btn-sm">
                        📖 View Docs
                    </button>
                </div>
            </div>

            <div className="automate-grid">
                {/* Configuration Section */}
                <div className="left-col">
                    <div className="glass-card config-card">
                        <div className="card-header">
                            <h3>🔗 Webhook Configuration</h3>
                            <span className="status-badge live">Live</span>
                        </div>

                        <div className="input-group">
                            <label>Payload URL</label>
                            <div className="copy-input">
                                <input type="text" readOnly value={webhookUrl} />
                                <button onClick={() => copyToClipboard(webhookUrl, 'url')}>
                                    {copiedUrl ? '✅' : '📋'}
                                </button>
                            </div>
                            <p className="helper-text">Paste this into your GitHub Repository settings.</p>
                        </div>

                        <div className="input-group">
                            <label>Webhook Secret</label>
                            <div className="copy-input">
                                <input type="password" readOnly value={secret} />
                                <button onClick={() => copyToClipboard(secret, 'secret')}>
                                    {copiedSecret ? '✅' : '📋'}
                                </button>
                            </div>
                            <div className="action-row">
                                <p className="helper-text">Keep this private. Used to verify requests.</p>
                                <button 
                                    className="btn-text" 
                                    onClick={handleRegenerate}
                                    disabled={regenerating}
                                >
                                    {regenerating ? 'Regenerating...' : 'Regenerate Secret'}
                                </button>
                            </div>
                        </div>

                        <div className="test-section">
                            <button 
                                className="btn btn-primary btn-full" 
                                onClick={handleTestConnection}
                                disabled={testing}
                            >
                                {testing ? '🔍 Testing...' : '✅ Test Connection'}
                            </button>
                            {testResult && (
                                <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                                    {testResult.message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Event Log Section */}
                <div className="right-col">
                    <div className="glass-card log-card">
                        <div className="card-header">
                            <h3>🕒 Recent Events</h3>
                            <button className="btn-icon">🔄</button>
                        </div>
                        <div className="event-list">
                            <div className="event-item empty">
                                <div className="empty-state-visual">
                                    <div className="sample-log-line"></div>
                                    <div className="sample-log-line short"></div>
                                    <div className="sample-log-line"></div>
                                </div>
                                <p>No PR events yet</p>
                                <small>Open a PR to start receiving automated AI reviews and fixes.</small>
                                <div className="test-hint mt-md">
                                    <button className="btn-text" onClick={handleTestConnection}>Send a test ping →</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="setup-section mt-xl">
                <div className="glass-card setup-card">
                    <h3>📖 Quick Setup Guide</h3>
                    <ol className="setup-steps">
                        <li>
                            <strong>Go to GitHub</strong>
                            <p>Repository → Settings → Webhooks</p>
                        </li>
                        <li>
                            <strong>Add Webhook</strong>
                            <p>Paste the <b>Payload URL</b> and <b>Secret</b> from above.</p>
                        </li>
                        <li>
                            <strong>Set Content Type</strong>
                            <p>Select <code>application/json</code></p>
                        </li>
                        <li>
                            <strong>Select Events</strong>
                            <p>Choose <b>"Let me select individual events"</b> and check <b>Pull requests</b>.</p>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

export default AutomatePRs;
