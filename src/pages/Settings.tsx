import { useState } from 'react';
import githubService from '../services/githubService';
import './Settings.css';

const SETTINGS_KEY = 'app_settings';

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function Settings() {
    const saved = loadSettings();
    const [apiKey, setApiKey] = useState(saved.apiKey || '');
    const [githubToken, setGithubToken] = useState(githubService.getToken());
    const [autoComment, setAutoComment] = useState(saved.autoComment ?? true);
    const [strictMode, setStrictMode] = useState(saved.strictMode ?? false);
    const [notifications, setNotifications] = useState(saved.notifications ?? true);
    const [saveMsg, setSaveMsg] = useState('');

    const handleSave = () => {
        githubService.setToken(githubToken);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ apiKey, autoComment, strictMode, notifications }));
        setSaveMsg('✅ Settings saved!');
        setTimeout(() => setSaveMsg(''), 3000);
    };

    const handleReset = () => {
        setAutoComment(true);
        setStrictMode(false);
        setNotifications(true);
        localStorage.removeItem(SETTINGS_KEY);
        setSaveMsg('↺ Reset to defaults');
        setTimeout(() => setSaveMsg(''), 3000);
    };

    return (
        <div className="settings animate-fade-in">
            <div className="page-header">
                <div>
                    <h2>Settings</h2>
                    <p className="text-muted">Configure your Code Review Bot preferences</p>
                </div>
            </div>

            {/* API Configuration */}
            <div className="glass-card">
                <h3 className="section-title">🔑 API Configuration</h3>

                <div className="settings-group">
                    <div className="setting-item">
                        <label htmlFor="openai-key" className="setting-label">
                            OpenAI API Key
                            <span className="required">*</span>
                        </label>
                        <input
                            id="openai-key"
                            type="password"
                            className="input"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                        />
                        <p className="setting-help">
                            Used for AI-powered code analysis and test generation
                        </p>
                    </div>

                    <div className="setting-item">
                        <label htmlFor="github-token" className="setting-label">
                            GitHub Personal Access Token
                            <span className="required">*</span>
                        </label>
                        <input
                            id="github-token"
                            type="password"
                            className="input"
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            placeholder="ghp_..."
                        />
                        <p className="setting-help">
                            Required for GitHub Integration — browse repos and analyse files directly.
                            Generate one at <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">github.com/settings/tokens</a> (needs <code>repo</code> scope).
                        </p>
                    </div>
                </div>
            </div>

            {/* Review Preferences */}
            <div className="glass-card">
                <h3 className="section-title">⚙️ Review Preferences</h3>

                <div className="settings-group">
                    <div className="setting-toggle">
                        <div className="toggle-info">
                            <div className="toggle-label">Auto-comment on Pull Requests</div>
                            <p className="setting-help">
                                Automatically post review comments on GitHub PRs
                            </p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={autoComment}
                                onChange={(e) => setAutoComment(e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="setting-toggle">
                        <div className="toggle-info">
                            <div className="toggle-label">Strict Mode</div>
                            <p className="setting-help">
                                Enable stricter code analysis with more detailed checks
                            </p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={strictMode}
                                onChange={(e) => setStrictMode(e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="setting-toggle">
                        <div className="toggle-info">
                            <div className="toggle-label">Email Notifications</div>
                            <p className="setting-help">
                                Receive email alerts for completed reviews
                            </p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={notifications}
                                onChange={(e) => setNotifications(e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Severity Levels */}
            <div className="glass-card">
                <h3 className="section-title">🎯 Bug Severity Levels</h3>

                <div className="severity-grid">
                    <div className="severity-card">
                        <div className="severity-header">
                            <span className="badge badge-error">High</span>
                            <span className="severity-count">12 rules</span>
                        </div>
                        <p className="severity-description">
                            Critical bugs that could cause crashes or security issues
                        </p>
                    </div>

                    <div className="severity-card">
                        <div className="severity-header">
                            <span className="badge badge-warning">Medium</span>
                            <span className="severity-count">28 rules</span>
                        </div>
                        <p className="severity-description">
                            Important issues that should be addressed
                        </p>
                    </div>

                    <div className="severity-card">
                        <div className="severity-header">
                            <span className="badge badge-info">Low</span>
                            <span className="severity-count">45 rules</span>
                        </div>
                        <p className="severity-description">
                            Minor improvements and code quality suggestions
                        </p>
                    </div>
                </div>
            </div>

            {/* Webhook Configuration */}
            <div className="glass-card">
                <h3 className="section-title">🔗 Webhook Configuration</h3>

                <div className="webhook-info">
                    <div className="webhook-url">
                        <label className="setting-label">Webhook URL</label>
                        <div className="url-display">
                            <code>https://api.codereview-bot.com/webhook/github</code>
                            <button className="btn btn-ghost btn-sm">📋 Copy</button>
                        </div>
                    </div>

                    <div className="webhook-events">
                        <label className="setting-label">Events to Subscribe</label>
                        <div className="events-list">
                            <span className="badge badge-neutral">pull_request</span>
                            <span className="badge badge-neutral">pull_request_review</span>
                            <span className="badge badge-neutral">push</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="settings-actions">
                <button className="btn btn-ghost" onClick={handleReset}>Reset to Defaults</button>
                <button className="btn btn-primary" onClick={handleSave}>
                    <span>💾</span>
                    <span>Save Settings</span>
                </button>
                {saveMsg && <span className="save-msg">{saveMsg}</span>}
            </div>
        </div>
    );
}

export default Settings;
