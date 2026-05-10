import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import RepositoryList from './pages/RepositoryList';
import ReviewDetails from './pages/ReviewDetails';
import Settings from './pages/Settings';
import AIDemo from './pages/AIDemo';
import UploadAnalyser from './pages/UploadAnalyser';
import CodeExplainer from './pages/CodeExplainer';
import GitHubBrowser from './pages/GitHubBrowser';
import AutoFix from './pages/AutoFix';
import ReviewHistory from './pages/ReviewHistory';
import Login from './pages/Login';
import Landing from './pages/Landing';
import AutomatePRs from './pages/AutomatePRs';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import githubService from './services/githubService';
import apiService from './services/apiService';

import type { Page } from './types';

interface PreloadedCode {
    code: string;
    language: string;
    filename: string;
}

interface AuthUser {
    id: number;
    email: string;
    displayName: string;
}

const TOKEN_KEY = 'crb_token';
const USER_KEY = 'crb_user';

function App() {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [preloadedCode, setPreloadedCode] = useState<PreloadedCode | null>(null);
    const [ghUser, setGhUser] = useState(githubService.getUser());

    // ── Auth state ───────────────────────────────────────────
    const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    });

    const isLoggedIn = !!authToken && !!authUser;

    // Verify token on mount and set in API service
    useEffect(() => {
        if (authToken) {
            // Set token in API service
            apiService.setAuthToken(authToken);
            
            // Verify token is still valid
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
            fetch(`${backendUrl}/auth/me`, {
                headers: { Authorization: `Bearer ${authToken}` },
            })
                .then((r) => r.json())
                .then((data) => {
                    if (!data.success) {
                        console.warn('🔄 Session expired or invalid. Logging out.');
                        handleLogout();
                    } else {
                        console.log('✅ Session verified.');
                    }
                })
                .catch((err) => {
                    console.error('⚠️ Backend unreachable or network error:', err.message);
                    // Don't force logout on network error - server might just be sleeping (cold start)
                });
        }
    }, []);

    const handleLoginSuccess = (token: string, user: { id: number; email: string; displayName: string }) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setAuthToken(token);
        setAuthUser(user);
        // Set the token in the API service
        apiService.setAuthToken(token);
    };

    const handleLogout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setAuthToken(null);
        setAuthUser(null);
        // Clear the token from the API service
        apiService.setAuthToken(null);
    };

    // Handle GitHub OAuth callback on mount
    useEffect(() => {
        const didLogin = githubService.handleOAuthCallback();
        if (didLogin) {
            setGhUser(githubService.getUser());
            setCurrentPage('github');
        }
        // Also check for auth_error param
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth_error')) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleAnalyseFromGitHub = (code: string, language: string, filename: string) => {
        setPreloadedCode({ code, language, filename });
        setCurrentPage('ai-demo');
        setSidebarOpen(false);
    };

    const handleExplainFromGitHub = (code: string, language: string, filename: string) => {
        setPreloadedCode({ code, language, filename });
        setCurrentPage('explainer');
        setSidebarOpen(false);
    };



    // ── If not logged in, show Landing page ───────────────────
    if (!isLoggedIn) {
        if (currentPage === 'landing' || currentPage === 'dashboard') {
            return <Landing onGetStarted={() => setCurrentPage('login')} />;
        }
        return <Login onLoginSuccess={handleLoginSuccess} onBackToLanding={() => setCurrentPage('landing')} />;
    }



    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard onViewReview={(id) => {
                    setSelectedReviewId(id);
                    setCurrentPage('review');
                }} onViewAllReviews={() => setCurrentPage('history')} onNavigateToAnalyser={() => setCurrentPage('ai-demo')} />;
            case 'repositories':
                return <RepositoryList onNavigate={handleNavigate} />;
            case 'review':
                return <ReviewDetails reviewId={selectedReviewId} />;
            case 'settings':
                return <Settings />;
            case 'ai-demo':
                return <AIDemo preloadedCode={preloadedCode} onPreloadConsumed={() => setPreloadedCode(null)} />;
            case 'upload':
                return <UploadAnalyser />;
            case 'explainer':
                return <CodeExplainer preloadedCode={preloadedCode} onPreloadConsumed={() => setPreloadedCode(null)} />;
            case 'github':
                return <GitHubBrowser onAnalyse={handleAnalyseFromGitHub} onExplain={handleExplainFromGitHub} onGoToSettings={() => setCurrentPage('settings')} ghUser={ghUser} onLogout={() => { githubService.logout(); setGhUser(null); }} />;
            case 'auto-fix':
                return <AutoFix />;
            case 'history':
                return <ReviewHistory onViewReview={(id) => { setSelectedReviewId(id); setCurrentPage('review'); }} />;
            case 'automate-prs':
                return <AutomatePRs />;
            default:
                return <Dashboard onViewReview={(id) => {
                    setSelectedReviewId(id);
                    setCurrentPage('review');
                }} onViewAllReviews={() => setCurrentPage('history')} onNavigateToAnalyser={() => setCurrentPage('ai-demo')} />;
        }
    };

    const handleNavigate = (page: Page) => {
        setCurrentPage(page);
        setSidebarOpen(false);
    };

    return (
        <div className="app-container">
            <Sidebar
                currentPage={currentPage}
                onNavigate={handleNavigate}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                authUser={authUser}
            />
            <div className="main-content">
                <Header
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    ghUser={ghUser}
                    onGitHubLogin={() => githubService.login()}
                    onGitHubLogout={() => {
                        if (window.confirm('Disconnect GitHub account?')) {
                            githubService.logout();
                            setGhUser(null);
                        }
                    }}
                    authUser={authUser}
                    onLogout={handleLogout}
                />
                <div className="page-content">
                    {renderPage()}
                </div>
            </div>
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
        </div>
    );
}

export default App;
