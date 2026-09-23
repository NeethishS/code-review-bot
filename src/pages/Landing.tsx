import { useState } from 'react';
import './Landing.css';

interface LandingProps {
    onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
    // Interactive states for Hero Mockup
    const [heroTab, setHeroTab] = useState<'issues' | 'suggestions' | 'explanation' | 'security'>('issues');
    const [heroFixed, setHeroFixed] = useState(false);
    const [heroCopied, setHeroCopied] = useState(false);

    // Interactive states for Diff Showcase
    const [diffTab, setDiffTab] = useState<'review' | 'diff' | 'files'>('review');
    const [diffFixed, setDiffFixed] = useState(false);
    const [accordionOpen, setAccordionOpen] = useState(false);

    const handleCopy = () => {
        const fixCode = `const result = await db.query(\n  "SELECT * FROM users WHERE id = ?", [input]\n);`;
        navigator.clipboard?.writeText(fixCode);
        setHeroCopied(true);
        setTimeout(() => setHeroCopied(false), 2000);
    };

    return (
        <div className="crb-landing">
            {/* Top Navigation Bar */}
            <header className="crb-navbar">
                <div className="crb-nav-inner">
                    <div className="crb-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="crb-logo-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="10" rx="2" />
                                <circle cx="12" cy="5" r="2" />
                                <path d="M12 7v4" />
                                <line x1="8" y1="16" x2="8" y2="16" />
                                <line x1="16" y1="16" x2="16" y2="16" />
                            </svg>
                        </div>
                        <span className="crb-logo-text">Code Review Bot</span>
                    </div>

                    <nav className="crb-nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How it works</a>
                        <a href="#demo">Docs</a>
                        <a href="#pricing">Pricing</a>
                    </nav>

                    <div className="crb-nav-right">
                        <button className="crb-btn-ghost" onClick={onGetStarted}>
                            Sign in
                        </button>
                        <button className="crb-btn-primary crb-btn-sm" onClick={onGetStarted}>
                            Get started
                        </button>
                        <button className="crb-theme-btn" aria-label="Toggle theme" title="Dark mode active">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="crb-hero">
                <div className="crb-hero-left">
                    <div className="crb-eyebrow">FOR DEVELOPERS, BY DEVELOPERS</div>
                    <h1 className="crb-hero-title">
                        Stronger code reviews. Less context switching.
                    </h1>
                    <p className="crb-hero-desc">
                        Catch bugs, improve security, and get clear, actionable suggestions — right in your workflow.
                        An AI-powered review assistant that actually understands your code.
                    </p>

                    <div className="crb-cta-group">
                        <button className="crb-btn-primary crb-btn-lg" onClick={onGetStarted}>
                            Get started for free
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>
                        <a
                            href="https://github.com/NeethishS/Code-Review_Bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="crb-btn-secondary crb-btn-lg"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            View on GitHub
                        </a>
                    </div>

                    <div className="crb-trust-bullets">
                        <span>No credit card required</span>
                        <span className="crb-bullet-sep">•</span>
                        <span>Works with your stack</span>
                        <span className="crb-bullet-sep">•</span>
                        <span>Open source friendly</span>
                    </div>

                    {/* CLI interactive preview */}
                    <div className="crb-cli-box">
                        <div className="crb-cli-dot"></div>
                        <div className="crb-cli-content">
                            <div className="crb-cli-cmd">
                                <span className="crb-cli-prompt">&gt;</span> npx code-review-bot
                            </div>
                            <div className="crb-cli-sub">Scanning your code...</div>
                            <div className="crb-cli-results">
                                Found 3 issues (<span className="crb-critical-text">2 critical</span>, <span className="crb-medium-text">1 medium</span>)
                            </div>
                        </div>
                    </div>
                </div>

                {/* HERO RIGHT: Interactive IDE PR Mockup */}
                <div className="crb-hero-right">
                    <div className="crb-ide-window">
                        {/* IDE Window Bar */}
                        <div className="crb-ide-topbar">
                            <div className="crb-ide-nav-left">
                                <div className="crb-ide-bot-icon">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="10" rx="2" />
                                        <circle cx="12" cy="5" r="2" />
                                        <path d="M12 7v4" />
                                    </svg>
                                </div>
                                <span className="crb-ide-repo">acme / <strong>web-app</strong></span>
                                <span className="crb-ide-branch">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="6" y1="3" x2="6" y2="15" />
                                        <circle cx="18" cy="6" r="3" />
                                        <circle cx="6" cy="18" r="3" />
                                        <path d="M18 9a9 9 0 0 1-9 9" />
                                    </svg>
                                    feature/auth
                                </span>
                                <span className="crb-ide-dots">···</span>
                            </div>
                            <div className="crb-ide-nav-right">
                                <button className="crb-ide-review-btn" onClick={() => setHeroFixed(!heroFixed)}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                                    </svg>
                                    Review
                                </button>
                            </div>
                        </div>

                        {/* IDE Body */}
                        <div className="crb-ide-body">
                            {/* Left File Tree */}
                            <div className="crb-ide-sidebar">
                                <div className="crb-filetree-header">
                                    <span>Files</span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>
                                <div className="crb-file-item active">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    processData.ts
                                </div>
                                <div className="crb-file-item">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    auth.ts
                                </div>
                                <div className="crb-file-item">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    utils.ts
                                </div>
                                <div className="crb-file-item">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    routes.ts
                                </div>
                                <div className="crb-file-item dimmed">
                                    + 12 more files
                                </div>
                            </div>

                            {/* Right Editor Pane */}
                            <div className="crb-ide-editor">
                                <div className="crb-editor-tab">processData.ts</div>

                                <div className="crb-code-view">
                                    <div className="crb-code-line">
                                        <span className="crb-ln">1</span>
                                        <span className="crb-code-content">
                                            <span className="crb-kw">async function</span> <span className="crb-fn">processData</span>(input: <span className="crb-type">string</span>) &#123;
                                        </span>
                                    </div>
                                    {!heroFixed ? (
                                        <>
                                            <div className="crb-code-line crb-line-highlight">
                                                <span className="crb-ln">2</span>
                                                <span className="crb-code-content">
                                                    &nbsp;&nbsp;<span className="crb-kw">const</span> result = <span className="crb-kw">await</span> db.query(<span className="crb-str">"SELECT * FROM users</span>
                                                </span>
                                            </div>
                                            <div className="crb-code-line crb-line-highlight">
                                                <span className="crb-ln">3</span>
                                                <span className="crb-code-content">
                                                    &nbsp;&nbsp;<span className="crb-str">WHERE id = '"</span> + input + <span className="crb-str">"'"</span>);
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="crb-code-line crb-line-fixed">
                                            <span className="crb-ln">2</span>
                                            <span className="crb-code-content">
                                                &nbsp;&nbsp;<span className="crb-kw">const</span> result = <span className="crb-kw">await</span> db.query(<span className="crb-str">"SELECT * FROM users WHERE id = ?"</span>, [input]);
                                            </span>
                                        </div>
                                    )}
                                    <div className="crb-code-line">
                                        <span className="crb-ln">{heroFixed ? '3' : '4'}</span>
                                        <span className="crb-code-content">&nbsp;&nbsp;<span className="crb-kw">return</span> result;</span>
                                    </div>
                                    <div className="crb-code-line">
                                        <span className="crb-ln">{heroFixed ? '4' : '5'}</span>
                                        <span className="crb-code-content">&#125;</span>
                                    </div>
                                </div>

                                {/* Floating / Docked Review Card */}
                                <div className="crb-review-card">
                                    <div className="crb-review-tabs">
                                        <button
                                            className={`crb-rtab ${heroTab === 'issues' ? 'active' : ''}`}
                                            onClick={() => setHeroTab('issues')}
                                        >
                                            Issues <span className="crb-pill-count red">3</span>
                                        </button>
                                        <button
                                            className={`crb-rtab ${heroTab === 'suggestions' ? 'active' : ''}`}
                                            onClick={() => setHeroTab('suggestions')}
                                        >
                                            Suggestions <span className="crb-pill-count green">2</span>
                                        </button>
                                        <button
                                            className={`crb-rtab ${heroTab === 'explanation' ? 'active' : ''}`}
                                            onClick={() => setHeroTab('explanation')}
                                        >
                                            Explanation
                                        </button>
                                        <button
                                            className={`crb-rtab ${heroTab === 'security' ? 'active' : ''}`}
                                            onClick={() => setHeroTab('security')}
                                        >
                                            Security <span className="crb-pill-count red">1</span>
                                        </button>
                                    </div>

                                    <div className="crb-issue-body">
                                        <div className="crb-issue-header">
                                            <div className="crb-issue-title-row">
                                                <div className="crb-issue-icon red">
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" y1="8" x2="12" y2="12" />
                                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                                    </svg>
                                                </div>
                                                <span className="crb-issue-title">SQL Injection Vulnerability</span>
                                                <span className="crb-badge-critical">Critical</span>
                                            </div>
                                            <span className="crb-issue-loc">Line 2</span>
                                        </div>

                                        <p className="crb-issue-desc">
                                            User input is directly concatenated into the SQL query. This can allow attackers to execute arbitrary SQL commands.
                                        </p>

                                        <div className="crb-fix-box">
                                            <div className="crb-fix-label">Suggested fix:</div>
                                            <pre className="crb-fix-code">
                                                <code>
                                                    <span className="crb-kw">const</span> result = <span className="crb-kw">await</span> db.query({'\n'}
                                                    &nbsp;&nbsp;<span className="crb-str">"SELECT * FROM users WHERE id = ?"</span>, [input]{'\n'}
                                                    );
                                                </code>
                                            </pre>
                                        </div>

                                        <div className="crb-issue-actions">
                                            <div className="crb-actions-left">
                                                <button
                                                    className={`crb-btn-apply ${heroFixed ? 'applied' : ''}`}
                                                    onClick={() => setHeroFixed(!heroFixed)}
                                                >
                                                    {heroFixed ? '✓ Fix applied' : 'Apply fix'}
                                                </button>
                                                <button className="crb-btn-copy" onClick={handleCopy}>
                                                    {heroCopied ? '✓ Copied' : 'Copy'}
                                                </button>
                                            </div>
                                            <a href="#how-it-works" className="crb-learn-more">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="16" x2="12" y2="12" />
                                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                                </svg>
                                                Learn more
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 2: MORE SIGNAL. LESS NOISE. */}
            <section id="features" className="crb-features-section">
                <div className="crb-container">
                    <div className="crb-eyebrow">FOCUS ON WHAT MATTERS</div>
                    <h2 className="crb-section-heading">More signal. Less noise.</h2>

                    <div className="crb-features-grid">
                        {/* Card 1 */}
                        <div className="crb-feature-card">
                            <div className="crb-ficon-frame">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                                    <circle cx="18" cy="6" r="2" />
                                    <circle cx="6" cy="18" r="2" />
                                </svg>
                            </div>
                            <h3 className="crb-fcard-title">AI-Powered Analysis</h3>
                            <p className="crb-fcard-desc">
                                Detect bugs, security risks, and anti-patterns using a combination of static analysis and LLM reasoning.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="crb-feature-card">
                            <div className="crb-ficon-frame">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="4" width="16" height="16" rx="2" />
                                    <line x1="9" y1="9" x2="15" y2="9" />
                                    <line x1="9" y1="13" x2="15" y2="13" />
                                    <line x1="9" y1="17" x2="13" y2="17" />
                                </svg>
                            </div>
                            <h3 className="crb-fcard-title">Clear Explanations</h3>
                            <p className="crb-fcard-desc">
                                Get concise, practical explanations with suggested fixes — not just vague warnings.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="crb-feature-card">
                            <div className="crb-ficon-frame">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                            </div>
                            <h3 className="crb-fcard-title">Works in Your Workflow</h3>
                            <p className="crb-fcard-desc">
                                Paste code, upload files, or connect your GitHub repo. No setup friction.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3: INTERACTIVE DIFF SHOWCASE */}
            <section id="how-it-works" className="crb-showcase-section">
                <div className="crb-container">
                    <div className="crb-showcase-split">
                        {/* Left Side: Code Diff */}
                        <div className="crb-diff-box">
                            <div className="crb-diff-topbar">
                                <div className="crb-diff-tabs">
                                    <button
                                        className={`crb-dtab ${diffTab === 'review' ? 'active' : ''}`}
                                        onClick={() => setDiffTab('review')}
                                    >
                                        Review <span className="crb-pill-count red">3</span>
                                    </button>
                                    <button
                                        className={`crb-dtab ${diffTab === 'diff' ? 'active' : ''}`}
                                        onClick={() => setDiffTab('diff')}
                                    >
                                        Diff
                                    </button>
                                    <button
                                        className={`crb-dtab ${diffTab === 'files' ? 'active' : ''}`}
                                        onClick={() => setDiffTab('files')}
                                    >
                                        Files <span className="crb-pill-count gray">1</span>
                                    </button>
                                </div>
                            </div>

                            <div className="crb-diff-editor">
                                <div className="crb-diff-line">
                                    <span className="crb-dln">1</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;<span className="crb-kw">function</span> <span className="crb-fn">calculateTotal</span>(items) &#123;</span>
                                </div>
                                <div className="crb-diff-line">
                                    <span className="crb-dln">2</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;&nbsp;&nbsp;<span className="crb-kw">let</span> total = 0;</span>
                                </div>
                                {!diffFixed ? (
                                    <div className="crb-diff-line crb-dline-remove">
                                        <span className="crb-dln">3</span>
                                        <span className="crb-dsign">-</span>
                                        <span className="crb-dcode">&nbsp;&nbsp;<span className="crb-kw">for</span> (<span className="crb-kw">let</span> i = 0; i &lt;= items.length; i++) &#123;</span>
                                    </div>
                                ) : null}
                                <div className="crb-diff-line crb-dline-add">
                                    <span className="crb-dln">{diffFixed ? '3' : '4'}</span>
                                    <span className="crb-dsign">+</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;<span className="crb-kw">for</span> (<span className="crb-kw">let</span> i = 0; i &lt; items.length; i++) &#123;</span>
                                </div>
                                <div className="crb-diff-line">
                                    <span className="crb-dln">{diffFixed ? '4' : '5'}</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;total += items[i].price;</span>
                                </div>
                                <div className="crb-diff-line">
                                    <span className="crb-dln">{diffFixed ? '5' : '6'}</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;&nbsp;&nbsp;&#125;</span>
                                </div>
                                <div className="crb-diff-line">
                                    <span className="crb-dln">{diffFixed ? '6' : '7'}</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;&nbsp;&nbsp;<span className="crb-kw">return</span> total;</span>
                                </div>
                                <div className="crb-diff-line">
                                    <span className="crb-dln">{diffFixed ? '7' : '8'}</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;&#125;</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Issue Review Box */}
                        <div className="crb-issue-panel">
                            <div className="crb-panel-card">
                                <div className="crb-panel-header">
                                    <div className="crb-panel-title-row">
                                        <div className="crb-issue-icon yellow">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                                <line x1="12" y1="9" x2="12" y2="13" />
                                                <line x1="12" y1="17" x2="12.01" y2="17" />
                                            </svg>
                                        </div>
                                        <span className="crb-panel-title">Potential runtime error</span>
                                        <span className="crb-badge-medium">Medium</span>
                                    </div>
                                    <span className="crb-issue-loc">Line 3</span>
                                </div>

                                <p className="crb-panel-desc">
                                    The loop uses &lt;= which can access items[items.length] (undefined).
                                </p>

                                <div className="crb-panel-actions">
                                    <button
                                        className={`crb-btn-apply ${diffFixed ? 'applied' : ''}`}
                                        onClick={() => setDiffFixed(!diffFixed)}
                                    >
                                        {diffFixed ? '✓ Fix applied' : 'Apply fix'}
                                    </button>
                                    <button className="crb-btn-dismiss" onClick={() => setDiffFixed(false)}>
                                        Dismiss
                                    </button>
                                </div>

                                {/* Collapsible Similar Issues */}
                                <div className="crb-accordion-wrapper">
                                    <button
                                        className="crb-accordion-btn"
                                        onClick={() => setAccordionOpen(!accordionOpen)}
                                    >
                                        <div className="crb-accordion-left">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="7" width="20" height="14" rx="2" />
                                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                            </svg>
                                            <span>2 similar issues in this repository</span>
                                        </div>
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className={`crb-chevron ${accordionOpen ? 'open' : ''}`}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                    {accordionOpen && (
                                        <div className="crb-accordion-content">
                                            <div className="crb-sub-issue">
                                                <span>• <code>src/utils/order.ts:42</code> Off-by-one boundary in <code>for</code> loop</span>
                                            </div>
                                            <div className="crb-sub-issue">
                                                <span>• <code>src/analytics/counter.ts:18</code> Array index out-of-bounds with <code>&lt;=</code></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4: SOCIAL PROOF / TESTIMONIALS */}
            <section className="crb-social-proof">
                <div className="crb-container">
                    <div className="crb-eyebrow">TRUSTED BY DEVELOPERS</div>

                    <div className="crb-testimonials-split">
                        <div className="crb-quote-hero">
                            <blockquote className="crb-big-quote">
                                “It feels like having a senior engineer review your PR, <span className="crb-quote-accent">without</span> the wait.”
                            </blockquote>
                            <div className="crb-quote-author">
                                <div className="crb-author-line"></div>
                                <span>Final year CSE student</span>
                            </div>
                        </div>

                        <div className="crb-quote-stack">
                            <div className="crb-stack-item">
                                <span className="crb-stack-bar">|</span>
                                “Actually helpful suggestions, not generic advice.”
                            </div>
                            <div className="crb-stack-item">
                                <span className="crb-stack-bar">|</span>
                                “Caught a security issue I completely missed.”
                            </div>
                            <div className="crb-stack-item">
                                <span className="crb-stack-bar">|</span>
                                “Super easy to use and works well with my stack.”
                            </div>
                            <div className="crb-stack-item">
                                <span className="crb-stack-bar">|</span>
                                “Feels like it understands my code.”
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 5: FINAL CTA BANNER */}
            <section id="pricing" className="crb-cta-section">
                <div className="crb-container">
                    <div className="crb-cta-banner">
                        <div className="crb-cta-left">
                            <h2 className="crb-cta-heading">Start shipping better code today.</h2>
                            <p className="crb-cta-sub">
                                Join developers who use Code Review Bot to write cleaner, safer, and more maintainable code.
                            </p>
                        </div>
                        <div className="crb-cta-right">
                            <button className="crb-btn-primary crb-btn-lg" onClick={onGetStarted}>
                                Get started for free
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="crb-footer">
                <div className="crb-container crb-footer-inner">
                    <div className="crb-footer-brand">
                        <div className="crb-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="crb-logo-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="10" rx="2" />
                                    <circle cx="12" cy="5" r="2" />
                                    <path d="M12 7v4" />
                                </svg>
                            </div>
                            <span className="crb-logo-text">Code Review Bot</span>
                        </div>
                        <p className="crb-footer-tagline">Built for developers, by developers.</p>
                    </div>

                    <div className="crb-footer-nav">
                        <a href="#demo" onClick={(e) => { e.preventDefault(); onGetStarted(); }}>Docs</a>
                        <a href="#pricing">Pricing</a>
                        <a href="#privacy" onClick={(e) => { e.preventDefault(); onGetStarted(); }}>Privacy</a>
                        <a href="mailto:support@codereviewbot.dev">Contact</a>
                        <a
                            href="https://github.com/NeethishS/Code-Review_Bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub"
                            className="crb-footer-icon"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                        </a>
                        <a
                            href="https://twitter.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="X / Twitter"
                            className="crb-footer-icon"
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
