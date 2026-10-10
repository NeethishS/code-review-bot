import { useState, type FormEvent, useEffect } from 'react';
import './Login.css';

interface LoginProps {
    onLoginSuccess: (token: string, user: { id: number; email: string; displayName: string }) => void;
    onBackToLanding?: () => void;
}

type Tab = 'login' | 'register';

export default function Login({ onLoginSuccess, onBackToLanding }: LoginProps) {
    const [tab, setTab] = useState<Tab>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const API = `${backendUrl}/auth`;

    // Handle GitHub OAuth callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ghToken = params.get('gh_token');
        const ghLogin = params.get('gh_login');
        const ghName = params.get('gh_name');
        const ghAvatar = params.get('gh_avatar');
        const authError = params.get('auth_error');

        if (authError) {
            setError(`GitHub login failed: ${authError}`);
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        if (ghToken && ghLogin) {
            handleGitHubSuccess(ghToken, ghLogin, ghName || ghLogin, ghAvatar || '');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleGitHubSuccess = async (ghToken: string, ghLogin: string, ghName: string, ghAvatar: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/github-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    githubToken: ghToken,
                    githubLogin: ghLogin,
                    displayName: ghName || ghLogin,
                    avatarUrl: ghAvatar,
                }),
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error || 'GitHub login failed');
                setLoading(false);
                return;
            }

            onLoginSuccess(data.data.token, data.data.user);
        } catch (err: any) {
            setError('Failed to process GitHub login');
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setDisplayName('');
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const endpoint = tab === 'login' ? `${API}/login` : `${API}/register`;
            const body: any = { email, password };
            if (tab === 'register' && displayName) body.displayName = displayName;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error || 'Something went wrong');
                setLoading(false);
                return;
            }

            if (tab === 'register') {
                setSuccess('Account created! Initializing your workspace...');
                setTimeout(async () => {
                    try {
                        const verifyRes = await fetch(`${API}/verify-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email }),
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            onLoginSuccess(verifyData.data.token, verifyData.data.user);
                        }
                    } catch (err) {
                        setError('Email verification failed');
                        setLoading(false);
                    }
                }, 1000);
            } else {
                onLoginSuccess(data.data.token, data.data.user);
            }
        } catch (err: any) {
            setError('Cannot connect to server. Make sure the backend is running.');
            setLoading(false);
        }
    };

    const handleGitHubLogin = () => {
        window.location.href = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/auth/github`;
    };

    return (
        <div className="login-viewport">
            {/* Ambient Background Glow Orbs */}
            <div className="login-ambient-grid" />
            <div className="login-orb login-orb-1" />
            <div className="login-orb login-orb-2" />
            <div className="login-orb login-orb-3" />

            <div className="login-shell">
                {/* ── LEFT COLUMN: Visual Showcase & Brand ── */}
                <div className="login-showcase">
                    <div className="showcase-content">
                        {/* Brand Badge */}
                        <div className="showcase-badge">
                            <span className="badge-pulse" />
                            <span className="badge-text">Next-Gen Code Intelligence</span>
                        </div>

                        {/* Title & Tagline */}
                        <h1 className="showcase-title">
                            Code reviews at the <br />
                            <span className="title-gradient">speed of thought.</span>
                        </h1>
                        <p className="showcase-desc">
                            Deterministic AST static analysis meets high-speed Groq LPU inference.
                            Catch security flaws, memory leaks, and complex code smells before they reach production.
                        </p>

                        {/* Live Code Inspector Preview Card */}
                        <div className="code-preview-card">
                            <div className="preview-header">
                                <div className="window-dots">
                                    <span className="dot dot-red" />
                                    <span className="dot dot-yellow" />
                                    <span className="dot dot-green" />
                                </div>
                                <span className="preview-filename">paymentProcessor.ts · AST Inspector</span>
                                <span className="preview-status-pill">
                                    <span className="status-indicator" /> Live
                                </span>
                            </div>
                            <div className="preview-code-body">
                                <div className="code-line">
                                    <span className="line-num">1</span>
                                    <span className="token-keyword">async function</span> <span className="token-fn">processBatch</span>(orders) {'{'}
                                </div>
                                <div className="code-line line-flagged-critical">
                                    <span className="line-num">2</span>
                                    <span>  <span className="token-danger">exec</span>(`echo ${'{'}orders[0].id{'}'}`);</span>
                                    <span className="line-tag-critical">CRITICAL · Unsafe OS Call</span>
                                </div>
                                <div className="code-line line-flagged-warning">
                                    <span className="line-num">3</span>
                                    <span>  <span className="token-var">const</span> <span className="token-unused">feeMultiplier</span> = 0.05;</span>
                                    <span className="line-tag-warning">AST · Unused Variable</span>
                                </div>
                                <div className="code-line">
                                    <span className="line-num">4</span>
                                    <span>  <span className="token-keyword">return</span> orders.map(o =&gt; o.total);</span>
                                </div>
                                <div className="code-line">
                                    <span className="line-num">5</span>
                                    <span>{'}'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Feature Badges */}
                        <div className="showcase-metrics">
                            <div className="metric-pill">
                                <svg className="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                                <span><strong>&lt; 5ms</strong> AST Latency</span>
                            </div>
                            <div className="metric-pill">
                                <svg className="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                <span><strong>Deterministic</strong> Safety Guard</span>
                            </div>
                            <div className="metric-pill">
                                <svg className="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                <span><strong>17/17 Rules</strong> Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: High-End Glassmorphic Auth Form ── */}
                <div className="login-card-container">
                    <div className="login-card">
                        {onBackToLanding && (
                            <button className="back-link" onClick={onBackToLanding} aria-label="Back to home">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Back to Home
                            </button>
                        )}

                        {/* Header */}
                        <div className="login-header">
                            <div className="brand-logo-mark">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                    <line x1="8" y1="21" x2="16" y2="21" />
                                    <line x1="12" y1="17" x2="12" y2="21" />
                                </svg>
                            </div>
                            <h2 className="login-title">
                                {tab === 'login' ? 'Welcome back' : 'Create an account'}
                            </h2>
                            <p className="login-subtitle">
                                {tab === 'login'
                                    ? 'Sign in to access your analysis dashboard and PR webhooks'
                                    : 'Start reviewing and auto-fixing code with AI-powered depth'}
                            </p>
                        </div>

                        {/* Modern Segmented Tab Switcher */}
                        <div className="auth-tab-bar" role="tablist">
                            <button
                                role="tab"
                                aria-selected={tab === 'login'}
                                className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
                                onClick={() => { setTab('login'); resetForm(); }}
                            >
                                Sign In
                            </button>
                            <button
                                role="tab"
                                aria-selected={tab === 'register'}
                                className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
                                onClick={() => { setTab('register'); resetForm(); }}
                            >
                                Create Account
                            </button>
                        </div>

                        {/* Form */}
                        <form className="auth-form" onSubmit={handleSubmit}>
                            {/* Error Banner */}
                            {error && (
                                <div className="auth-banner banner-error">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Success Banner */}
                            {success && (
                                <div className="auth-banner banner-success">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    <span>{success}</span>
                                </div>
                            )}

                            {/* Display Name (register only) */}
                            {tab === 'register' && (
                                <div className="form-field">
                                    <label htmlFor="displayNameInput">Your Name</label>
                                    <div className="input-group">
                                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <input
                                            id="displayNameInput"
                                            type="text"
                                            placeholder="Alex Developer"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            autoComplete="name"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div className="form-field">
                                <label htmlFor="emailInput">Work or Personal Email</label>
                                <div className="input-group">
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    <input
                                        id="emailInput"
                                        type="email"
                                        placeholder="alex@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="form-field">
                                <div className="label-row">
                                    <label htmlFor="passwordInput">Password</label>
                                    {tab === 'register' && (
                                        <span className="label-hint">Min. 6 characters</span>
                                    )}
                                </div>
                                <div className="input-group">
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        id="passwordInput"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={tab === 'register' ? '••••••••••••' : 'Enter your password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                                    />
                                    <button
                                        type="button"
                                        className="btn-toggle-eye"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading && (
                                    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                )}
                                <span>
                                    {loading
                                        ? (tab === 'login' ? 'Authenticating...' : 'Creating Account...')
                                        : (tab === 'login' ? 'Sign In to Workspace' : 'Get Started Free')
                                    }
                                </span>
                            </button>

                            {/* Divider */}
                            <div className="auth-divider">
                                <span>or continue with</span>
                            </div>

                            {/* GitHub Button */}
                            <button type="button" className="auth-github-btn" onClick={handleGitHubLogin}>
                                <svg className="github-icon" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                                </svg>
                                Continue with GitHub
                            </button>
                        </form>

                        {/* Security Footer Note */}
                        <div className="auth-card-footer">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <span>End-to-End Encrypted Session · Groq LPU Powered</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
