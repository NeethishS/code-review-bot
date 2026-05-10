import { useState, useEffect, useCallback } from 'react';
import githubService, { type GHRepo, type GHTreeItem } from '../services/githubService';
import './GitHubBrowser.css';

const LANG_EXT: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java', cpp: 'cpp', cc: 'cpp', cxx: 'cpp',
    c: 'c', h: 'c', cs: 'csharp', go: 'go', rs: 'rust',
    rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin',
};

const CODE_EXTS = new Set(Object.keys(LANG_EXT).concat(['html', 'css', 'json', 'md', 'sh', 'yaml', 'yml', 'xml', 'sql']));

function extOf(path: string) {
    return path.split('.').pop()?.toLowerCase() || '';
}

function isCodeFile(path: string) {
    return CODE_EXTS.has(extOf(path));
}

function langOf(path: string) {
    return LANG_EXT[extOf(path)] || 'plaintext';
}

interface Props {
    onAnalyse: (code: string, language: string, filename: string) => void;
    onExplain?: (code: string, language: string, filename: string) => void;
    onGoToSettings: () => void;
    ghUser?: { login: string; avatar_url: string } | null;
    onLogout?: () => void;
}

type View = 'repos' | 'tree';

interface TreeNode {
    name: string;
    path: string;
    type: 'blob' | 'tree';
    children?: TreeNode[];
    depth: number;
}

function buildTree(items: GHTreeItem[]): TreeNode[] {
    const root: TreeNode[] = [];
    const map = new Map<string, TreeNode>();

    // Sort: folders first, then files
    const sorted = [...items].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
        return a.path.localeCompare(b.path);
    });

    for (const item of sorted) {
        const parts = item.path.split('/');
        const name = parts[parts.length - 1];
        const depth = parts.length - 1;
        const node: TreeNode = { name, path: item.path, type: item.type, depth, children: item.type === 'tree' ? [] : undefined };
        map.set(item.path, node);

        if (parts.length === 1) {
            root.push(node);
        } else {
            const parentPath = parts.slice(0, -1).join('/');
            const parent = map.get(parentPath);
            if (parent?.children) parent.children.push(node);
        }
    }
    return root;
}

function TreeNodeRow({ node, onFileClick, loadingFile }: {
    node: TreeNode;
    onFileClick: (path: string, action: 'analyze' | 'explain') => void;
    loadingFile: string | null;
}) {
    const [open, setOpen] = useState(node.depth < 1);
    const isFile = node.type === 'blob';
    const isCode = isFile && isCodeFile(node.path);
    const isLoading = loadingFile === node.path;

    return (
        <div className="tree-node">
            <div
                className={`tree-row ${isFile ? 'tree-file' : 'tree-folder'} ${isCode ? 'tree-code' : ''} ${isLoading ? 'tree-loading' : ''}`}
                style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
                onClick={() => {
                    if (!isFile) setOpen(o => !o);
                }}
            >
                <span className="tree-icon">
                    {isFile ? (isCode ? '📄' : '📃') : (open ? '📂' : '📁')}
                </span>
                <span className="tree-name">{node.name}</span>
                {isLoading && <span className="tree-spinner">⏳</span>}
                {isCode && !isLoading && <span className="tree-analyse-hint">click for options</span>}
            </div>
            {isCode && !isLoading && (
                <div className="tree-actions">
                    <button className="tree-action-btn tree-analyze-btn" onClick={() => onFileClick(node.path, 'analyze')} title="Analyze code">
                        🔍 Analyze
                    </button>
                    <button className="tree-action-btn tree-explain-btn" onClick={() => onFileClick(node.path, 'explain')} title="Explain code">
                        💬 Explain
                    </button>
                </div>
            )}
            {!isFile && open && node.children?.map(child => (
                <TreeNodeRow key={child.path} node={child} onFileClick={onFileClick} loadingFile={loadingFile} />
            ))}
        </div>
    );
}

export default function GitHubBrowser({ onAnalyse, onExplain, onGoToSettings, ghUser, onLogout }: Props) {
    const [view, setView] = useState<View>('repos');
    const hasToken = githubService.isLoggedIn();
    const [user] = useState(ghUser || githubService.getUser());
    const [myRepos, setMyRepos] = useState<GHRepo[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GHRepo[]>([]);
    const [searching, setSearching] = useState(false);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<GHRepo | null>(null);
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [loadingTree, setLoadingTree] = useState(false);
    const [loadingFile, setLoadingFile] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (hasToken) loadMyRepos();
    }, [hasToken]);

    const loadMyRepos = async () => {
        setLoadingRepos(true);
        setError('');
        try {
            const repos = await githubService.getMyRepos();
            setMyRepos(repos);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoadingRepos(false);
        }
    };

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        setError('');
        try {
            const results = await githubService.searchRepos(searchQuery);
            setSearchResults(results);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSearching(false);
        }
    }, [searchQuery]);

    const openRepo = async (repo: GHRepo) => {
        setSelectedRepo(repo);
        setView('tree');
        setLoadingTree(true);
        setTree([]);
        setError('');
        try {
            const items = await githubService.getTree(repo.owner.login, repo.name, repo.default_branch);
            setTree(buildTree(items.filter(i => i.type === 'blob' || i.type === 'tree')));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoadingTree(false);
        }
    };

    const handleFileClick = async (path: string, action: 'analyze' | 'explain' = 'analyze') => {
        if (!selectedRepo) return;
        setLoadingFile(path);
        setError('');
        try {
            const { content, size } = await githubService.getFileContent(
                selectedRepo.owner.login, selectedRepo.name, path
            );
            if (size > 100 * 1024) {
                setError(`File too large (${Math.round(size / 1024)}KB). Max 100KB for analysis.`);
                return;
            }
            const language = langOf(path);
            const filename = path.split('/').pop() || path;
            
            if (action === 'explain') {
                onExplain?.(content, language, filename);
            } else {
                onAnalyse(content, language, filename);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoadingFile(null);
        }
    };

    if (!hasToken) {
        return (
            <div className="gh-no-token">
                <span className="gh-big-icon">🔑</span>
                <h2>GitHub Token Required</h2>
                <p>Add your GitHub Personal Access Token in Settings to browse repos and analyse files.</p>
                <button className="btn btn-primary" onClick={onGoToSettings}>Go to Settings</button>
                <p className="gh-token-hint">
                    Need a token? <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">Generate one here</a> with <code>repo</code> scope.
                </p>
                <button className="btn btn-ghost gh-refresh-btn" onClick={() => window.location.reload()}>
                    I've added my token ↻
                </button>
            </div>
        );
    }

    return (
        <div className="gh-browser animate-fade-in">
            <div className="page-header">
                <div>
                    <h2>🐙 GitHub Browser</h2>
                    <p className="text-muted">Browse repos and send files directly to the AI Analyser</p>
                </div>
                <div className="gh-header-right">
                    {user && (
                        <div className="gh-user-badge">
                            <img src={user.avatar_url} alt={user.login} className="gh-avatar" />
                            <span>@{user.login}</span>
                        </div>
                    )}
                    <button 
                        className="btn btn-danger gh-disconnect-btn"
                        onClick={() => {
                            if (confirm('Disconnect your GitHub account?')) {
                                onLogout?.();
                            }
                        }}
                        title="Disconnect GitHub account"
                    >
                        🔌 Disconnect
                    </button>
                </div>
            </div>

            {error && (
                <div className="gh-error">
                    ⚠️ {error}
                    <button onClick={() => setError('')}>✕</button>
                </div>
            )}

            {view === 'repos' && (
                <div className="gh-repos-view">
                    {/* Search bar */}
                    <div className="glass-card gh-search-card">
                        <h3>🔍 Search Public Repos</h3>
                        <div className="gh-search-row">
                            <input
                                className="input"
                                placeholder="e.g. facebook/react or just react"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                            <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
                                {searching ? '⏳' : '🔍 Search'}
                            </button>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="gh-repo-grid">
                                {searchResults.map(repo => (
                                    <RepoCard key={repo.id} repo={repo} onClick={() => openRepo(repo)} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* My repos */}
                    <div className="glass-card">
                        <h3>📁 My Repositories</h3>
                        {loadingRepos ? (
                            <div className="gh-loading">⏳ Loading repositories...</div>
                        ) : myRepos.length === 0 ? (
                            <p className="text-muted">No repositories found.</p>
                        ) : (
                            <div className="gh-repo-grid">
                                {myRepos.map(repo => (
                                    <RepoCard key={repo.id} repo={repo} onClick={() => openRepo(repo)} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'tree' && selectedRepo && (
                <div className="gh-tree-view">
                    <div className="gh-tree-header">
                        <button className="btn btn-ghost btn-sm" onClick={() => setView('repos')}>
                            ← Back to Repos
                        </button>
                        <div className="gh-repo-title">
                            <span className="gh-repo-name">{selectedRepo.full_name}</span>
                            <span className="gh-branch-badge">🌿 {selectedRepo.default_branch}</span>
                        </div>
                    </div>

                    <div className="glass-card gh-tree-card">
                        <p className="gh-tree-hint">Click any code file to send it to the AI Analyser</p>
                        {loadingTree ? (
                            <div className="gh-loading">⏳ Loading file tree...</div>
                        ) : (
                            <div className="gh-tree">
                                {tree.map(node => (
                                    <TreeNodeRow key={node.path} node={node} onFileClick={handleFileClick} loadingFile={loadingFile} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function RepoCard({ repo, onClick }: { repo: GHRepo; onClick: () => void }) {
    return (
        <div className="gh-repo-card" onClick={onClick}>
            <div className="gh-repo-card-header">
                <span className="gh-repo-card-name">{repo.full_name}</span>
                {repo.private && <span className="gh-private-badge">🔒 Private</span>}
            </div>
            {repo.description && <p className="gh-repo-desc">{repo.description}</p>}
            <div className="gh-repo-meta">
                {repo.language && <span className="gh-lang-badge">{repo.language}</span>}
                <span>⭐ {repo.stargazers_count}</span>
                <span>🕒 {new Date(repo.updated_at).toLocaleDateString()}</span>
            </div>
        </div>
    );
}
