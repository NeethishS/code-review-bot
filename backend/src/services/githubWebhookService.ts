import { Octokit } from '@octokit/rest';
import crypto from 'crypto';
import codeAnalyzer from './codeAnalyzer';

export interface WebhookPayload {
    action: string;
    number: number;
    pull_request: {
        number: number;
        title: string;
        diff_url: string;
        base: { repo: { name: string; owner: { login: string } } };
    };
    repository: {
        name: string;
        owner: { login: string };
    };
}

class GithubWebhookService {
    private octokit: Octokit;

    constructor() {
        this.octokit = new Octokit({
            auth: process.env.GITHUB_PAT,
        });
    }

    /**
     * Verify the incoming GitHub webhook signature
     */
    verifySignature(payload: string, signature: string, userSecret: string): boolean {
        const hmac = crypto.createHmac('sha256', userSecret);
        const digest = 'sha256=' + hmac.update(payload).digest('hex');
        
        try {
            return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
        } catch {
            return false;
        }
    }

    /**
     * Handle the PR webhook event
     */
    async handlePullRequestEvent(payload: WebhookPayload) {
        // Only handle opened or synchronize (new commits pushed)
        if (payload.action !== 'opened' && payload.action !== 'synchronize') {
            console.log(`[Webhook] Ignoring PR action: ${payload.action}`);
            return;
        }

        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const pull_number = payload.pull_request.number;

        console.log(`[Webhook] Processing PR #${pull_number} for ${owner}/${repo}`);

        try {
            // 1. Fetch changed files
            const files = await this.getChangedFiles(owner, repo, pull_number);
            if (files.length === 0) {
                console.log(`[Webhook] No files to review for PR #${pull_number}`);
                return;
            }

            console.log(`[Webhook] Found ${files.length} changed file(s). Running AI Review...`);

            // 2. Analyze the diffs
            const reviewComments = await this.analyzeFiles(files);

            // 3. Post a general review comment
            await this.postReviewComment(owner, repo, pull_number, reviewComments);

            console.log(`[Webhook] Successfully posted AI review for PR #${pull_number}`);
        } catch (error) {
            console.error(`[Webhook] Error processing PR #${pull_number}:`, error);
        }
    }

    private async getChangedFiles(owner: string, repo: string, pull_number: number) {
        const { data } = await this.octokit.pulls.listFiles({
            owner,
            repo,
            pull_number,
        });

        return data.filter(file => file.status !== 'removed' && file.patch);
    }

    private async analyzeFiles(files: any[]) {
        let allComments = [];
        let totalScore = 0;
        let filesReviewed = 0;

        for (const file of files) {
            // Skip non-code files (images, etc) based on patch size or extension
            if (!file.patch || file.patch.length > 8000) continue; // Skip huge files to save context

            const ext = file.filename.split('.').pop()?.toLowerCase();
            const language = this.mapExtensionToLanguage(ext);
            if (!language) continue;

            const codeSnippet = file.patch; // We review the DIFF (patch), not the whole file

            try {
                const result = await codeAnalyzer.analyzeCodeSmells(codeSnippet, language);
                
                if (result.success && result.data && result.data.issues) {
                    const issues = result.data.issues.slice(0, 3); // Max 3 issues per file
                    if (issues.length > 0) {
                        allComments.push({
                            filename: file.filename,
                            issues: issues
                        });
                    }
                    
                    if (result.data.scoreBreakdown && result.data.scoreBreakdown.overall) {
                        totalScore += result.data.scoreBreakdown.overall;
                        filesReviewed++;
                    }
                }
            } catch (err: any) {
                console.error(`[Webhook] AI Analysis failed for file ${file.filename}:`, err.message);
                // Continue reviewing other files even if one fails
            }
        }

        const avgScore = filesReviewed > 0 ? Math.round(totalScore / filesReviewed) : 100;
        return { comments: allComments, score: avgScore, filesReviewed };
    }

    private async postReviewComment(owner: string, repo: string, pull_number: number, reviewResult: any) {
        let body = `## 🤖 AI Code Review Summary\n\n`;
        
        body += `**Overall Score:** ${reviewResult.score}/100\n`;
        body += `**Files Reviewed:** ${reviewResult.filesReviewed}\n\n`;

        if (reviewResult.comments.length === 0) {
            body += `✅ No major issues found in the changed files. Great job!`;
        } else {
            body += `### ⚠️ Key Observations\n\n`;
            for (const fileReview of reviewResult.comments) {
                body += `#### \`${fileReview.filename}\`\n`;
                for (const issue of fileReview.issues) {
                    const severityIco = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟠' : '🟢';
                    body += `* ${severityIco} **${issue.type || 'Issue'}:** ${issue.description}\n`;
                    if (issue.suggestion || issue.fix) {
                        body += `  * *Suggestion:* ${issue.suggestion || issue.fix}\n`;
                    }
                }
                body += `\n`;
            }
        }

        body += `\n---\n*Auto-generated by your Code Review Bot* 🚀`;

        try {
            await this.octokit.issues.createComment({
                owner,
                repo,
                issue_number: pull_number, // PRs are issues in GitHub API
                body,
            });
        } catch (err: any) {
            console.error(`[Webhook] Failed to post comment to PR #${pull_number}:`, err.message);
            if (err.status === 401 || err.status === 403) {
                console.error('[Webhook] Tip: Check if GITHUB_PAT is valid and has "repo" permissions.');
            }
        }
    }

    private mapExtensionToLanguage(ext: string | undefined): string | null {
        const map: Record<string, string> = {
            'js': 'javascript', 'jsx': 'javascript', 'ts': 'javascript', 'tsx': 'javascript',
            'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'h': 'c', 'go': 'go',
            'rb': 'ruby', 'php': 'php', 'cs': 'csharp'
        };
        return ext ? (map[ext] || null) : null;
    }
}

export const githubWebhookService = new GithubWebhookService();
export default githubWebhookService;
