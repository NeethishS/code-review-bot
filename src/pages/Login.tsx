import { useState, type FormEvent } from 'react';
import './Login.css';

interface LoginProps {
    onLoginSuccess: (token: string, user: { id: number; email: string; displayName: string }) => void;
}

type Tab = 'login' | 'register';

export default function Login({ onLoginSuccess }: LoginProps) {
    const [tab, setTab] = useState<Tab>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const API = 'http://localhost:3001/auth';

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
                setSuccess('Account created! Logging you in...');
                setTimeout(() => {
                    onLoginSuccess(data.data.token, data.data.user);
                }, 800);
            } else {
                onLoginSuccess(data.data.token, data.data.user);
            }
        } catch (err: any) {
            setError('Cannot connect to server. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleGitHubLogin = () => {
        window.location.href = 'http://localhost:3001/auth/github';
    };

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Brand */}
                <div className="login-brand">
                    <div className="login-brand-icon">🤖</div>
                    <h1>Code Review Bot</h1>
                    <p>AI-powered code analysis & review</p>
                </div>

                {/* Tabs */}
                <div className="login-tabs">
                    <button
                        className={`login-tab ${tab === 'login' ? 'active' : ''}`}
                        onClick={() => { setTab('login'); resetForm(); }}
                    >
                        Sign In
                    </button>
                    <button
                        className={`login-tab ${tab === 'register' ? 'active' : ''}`}
                        onClick={() => { setTab('register'); resetForm(); }}
                    >
                        Create Account
                    </button>
                </div>

                {/* Form */}
                <form className="login-form" onSubmit={handleSubmit}>
                    {/* Error */}
                    {error && (
                        <div className="login-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="login-success">
                            <span>✅</span> {success}
                        </div>
                    )}

                    {/* Display Name (register only) */}
                    {tab === 'register' && (
                        <div className="login-input-group">
                            <label>Display Name</label>
                            <div className="login-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    autoComplete="name"
                                />
                                <span className="login-input-icon">👤</span>
                            </div>
                        </div>
                    )}

                    {/* Email */}
                    <div className="login-input-group">
                        <label>Email Address</label>
                        <div className="login-input-wrapper">
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                            <span className="login-input-icon">✉️</span>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="login-input-group">
                        <label>Password</label>
                        <div className="login-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={tab === 'register' ? 'Min. 6 characters' : 'Enter your password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                            />
                            <span className="login-input-icon">🔒</span>
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" className="login-submit" disabled={loading}>
                        {loading && <span className="btn-spinner" />}
                        {loading
                            ? (tab === 'login' ? 'Signing in...' : 'Creating account...')
                            : (tab === 'login' ? 'Sign In' : 'Create Account')
                        }
                    </button>

                    {/* Divider */}
                    <div className="login-divider">
                        <span>or continue with</span>
                    </div>

                    {/* GitHub */}
                    <button type="button" className="login-github" onClick={handleGitHubLogin}>
                        <svg viewBox="0 0 16 16">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                        </svg>
                        Continue with GitHub
                    </button>
                </form>

                {/* Footer */}
                <div className="login-footer">
                    Powered by Groq LLM • Built with ❤️
                </div>
            </div>
        </div>
    );
}
