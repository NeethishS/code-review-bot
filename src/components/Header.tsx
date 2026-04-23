import { useState } from 'react';
import type { GHUser } from '../services/githubService';
import './Header.css';

interface HeaderProps {
    onMenuClick: () => void;
    ghUser?: GHUser | null;
    onGitHubLogin?: () => void;
    authUser?: { id: number; email: string; displayName: string } | null;
    onLogout?: () => void;
}

interface Notification {
    id: number;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
    time: string;
    read: boolean;
}

function Header({ onMenuClick, ghUser, onGitHubLogin, authUser, onLogout }: HeaderProps) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: 1,
            type: 'success',
            title: 'Review Completed',
            message: 'Code review for PR #234 has been completed successfully',
            time: '5 minutes ago',
            read: false,
        },
        {
            id: 2,
            type: 'warning',
            title: 'Security Issue Found',
            message: '3 security vulnerabilities detected in backend-api',
            time: '1 hour ago',
            read: false,
        },
        {
            id: 3,
            type: 'info',
            title: 'New Repository Connected',
            message: 'mobile-app repository has been successfully connected',
            time: '2 hours ago',
            read: false,
        },
        {
            id: 4,
            type: 'success',
            title: 'Tests Generated',
            message: '12 unit tests generated for authentication module',
            time: '3 hours ago',
            read: true,
        },
        {
            id: 5,
            type: 'error',
            title: 'Analysis Failed',
            message: 'Failed to analyze data-pipeline due to timeout',
            time: '5 hours ago',
            read: true,
        },
    ]);

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(notif =>
            notif.id === id ? { ...notif, read: true } : notif
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    };

    const clearNotification = (id: number) => {
        setNotifications(notifications.filter(notif => notif.id !== id));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return '🔔';
        }
    };

    return (
        <>
        <header className="header">
            <div className="header-content">
                <button className="menu-btn" onClick={onMenuClick}>
                    ☰
                </button>

                <div className="header-left">
                    <h1 className="page-title">Code Review Dashboard</h1>
                    <p className="page-subtitle">AI-powered code analysis and review automation</p>
                </div>

                <div className="header-right">
                    <div className="notification-container">
                        <button 
                            className="btn btn-ghost notification-btn"
                            onClick={toggleNotifications}
                        >
                            <span className="notification-icon">🔔</span>
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                <div 
                                    className="notification-overlay"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <div className="notification-dropdown">
                                    <div className="notification-header">
                                        <h3>Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button 
                                                className="mark-all-read"
                                                onClick={markAllAsRead}
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>

                                    <div className="notification-list">
                                        {notifications.length === 0 ? (
                                            <div className="no-notifications">
                                                <span className="empty-icon">🔕</span>
                                                <p>No notifications</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div 
                                                    key={notif.id}
                                                    className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                                                    onClick={() => markAsRead(notif.id)}
                                                >
                                                    <div className="notification-content">
                                                        <div className="notification-icon-wrapper">
                                                            <span className="notif-icon">
                                                                {getNotificationIcon(notif.type)}
                                                            </span>
                                                        </div>
                                                        <div className="notification-text">
                                                            <h4>{notif.title}</h4>
                                                            <p>{notif.message}</p>
                                                            <span className="notification-time">{notif.time}</span>
                                                        </div>
                                                        <button 
                                                            className="clear-notification"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                clearNotification(notif.id);
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {ghUser ? (
                        <div className="gh-header-user">
                            <img src={ghUser.avatar_url} alt={ghUser.login} className="gh-header-avatar" />
                            <span className="gh-header-login">@{ghUser.login}</span>
                        </div>
                    ) : (
                        <button className="btn btn-ghost gh-login-btn" onClick={onGitHubLogin}>
                            <span>🐙</span>
                            <span>Link GitHub</span>
                        </button>
                    )}

                    {authUser && (
                        <div className="header-user-profile">
                            <span className="header-user-avatar">👤</span>
                            <span className="header-user-name">{authUser.displayName}</span>
                            <button className="btn btn-ghost header-logout-btn" onClick={onLogout} title="Sign out">
                                🚪
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
        </>
    );
}

export default Header;
