/**
 * GitHub REST API service.
 * Token comes from OAuth flow (stored in localStorage after callback).
 */

const GH_API = 'https://api.github.com';
const TOKEN_KEY = 'gh_token';
const USER_KEY = 'gh_user';

export interface GHUser {
    login: string;
    name: string;
    avatar_url: string;
}

export interface GHRepo {
    id: number;
    full_name: string;
    name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    updated_at: string;
    private: boolean;
    default_branch: string;
    owner: { login: string; avatar_url: string };
}

export interface GHTreeItem {
    path: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
}

export interface GHFileContent {
    content: string;
    encoding: string;
    name: string;
    path: string;
    size: number;
}

class GitHubService {
    /** Called on app load — picks up OAuth params from URL if present */
    handleOAuthCallback(): boolean {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('gh_token');
        if (!token) return false;

        this.setToken(token);
        const user: GHUser = {
            login: params.get('gh_login') || '',
            name: params.get('gh_name') || '',
            avatar_url: params.get('gh_avatar') || '',
        };
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        return true;
    }

    getToken(): string {
        return localStorage.getItem(TOKEN_KEY) || '';
    }

    setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token.trim());
    }

    getUser(): GHUser | null {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    }

    logout(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    /** Redirect to backend OAuth start */
    login(): void {
        window.location.href = 'http://localhost:3001/auth/github';
    }

    private async request<T>(path: string): Promise<T> {
        const token = this.getToken();
        const headers: Record<string, string> = {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${GH_API}${path}`, { headers });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `GitHub API error ${res.status}`);
        }
        return res.json();
    }

    async getMyRepos(page = 1): Promise<GHRepo[]> {
        return this.request(`/user/repos?sort=updated&per_page=30&page=${page}`);
    }

    async searchRepos(query: string): Promise<GHRepo[]> {
        const data = await this.request<{ items: GHRepo[] }>(
            `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=20`
        );
        return data.items;
    }

    async getRepo(owner: string, repo: string): Promise<GHRepo> {
        return this.request(`/repos/${owner}/${repo}`);
    }

    async getTree(owner: string, repo: string, branch: string): Promise<GHTreeItem[]> {
        const data = await this.request<{ tree: GHTreeItem[] }>(
            `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
        );
        return data.tree;
    }

    async getFileContent(owner: string, repo: string, path: string): Promise<{ content: string; size: number }> {
        const data = await this.request<GHFileContent>(`/repos/${owner}/${repo}/contents/${path}`);
        if (data.encoding !== 'base64') throw new Error('Unexpected encoding: ' + data.encoding);
        const content = atob(data.content.replace(/\n/g, ''));
        return { content, size: data.size };
    }
}

export const githubService = new GitHubService();
export default githubService;
