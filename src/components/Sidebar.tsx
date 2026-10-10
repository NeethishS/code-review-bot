import './Sidebar.css';

import type { Page } from '../types';

interface SidebarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    isOpen: boolean;
    onClose: () => void;
    authUser?: { id: number; email: string; displayName: string } | null;
}

function Sidebar({ currentPage, onNavigate, isOpen, onClose, authUser }: SidebarProps) {
    const menuItems = [
        { id: 'dashboard' as Page, label: 'Dashboard', icon: '📊' },
        { id: 'history' as Page, label: 'Review History', icon: '📜' },
        { id: 'repositories' as Page, label: 'Repositories', icon: '📁' },
        { id: 'ai-demo' as Page, label: 'AI Code Analyser', icon: '🤖' },
        { id: 'upload' as Page, label: 'Upload & Analyse', icon: '📂' },
        { id: 'explainer' as Page, label: 'Code Explainer', icon: '💬' },
        { id: 'auto-fix' as Page, label: 'Auto-Fix', icon: '🔧' },
        { id: 'github' as Page, label: 'GitHub Browser', icon: '🐙' },
        { id: 'automate-prs' as Page, label: 'Automate PRs', icon: '⚡' },
        { id: 'settings' as Page, label: 'Settings', icon: '⚙️' },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-icon">🤖</span>
                    <span className="logo-text">CodeReview AI</span>
                </div>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="user-avatar">👤</div>
                    <div className="user-info">
                        <div className="user-name">{authUser?.displayName || 'User'}</div>
                        <div className="user-role">{authUser?.email || 'Not logged in'}</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
