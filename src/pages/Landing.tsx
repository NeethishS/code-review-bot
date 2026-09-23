import { useState, useEffect } from 'react';
import './Landing.css';

interface LandingProps {
    onGetStarted: () => void;
}

type FileKey = 'processData.ts' | 'auth.ts' | 'utils.ts' | 'routes.ts';

interface FileDemo {
    name: string;
    lang: string;
    codeVulnerable: string[];
    codeFixed: string[];
    issueTitle: string;
    issueSeverity: 'Critical' | 'Medium' | 'High';
    issueLine: number;
    issueDesc: string;
    suggestedFix: string;
}

const DEMO_FILES: Record<FileKey, FileDemo> = {
    'processData.ts': {
        name: 'processData.ts',
        lang: 'typescript',
        codeVulnerable: [
            'async function processData(input: string) {',
            '  const result = await db.query("SELECT * FROM users',
            '  WHERE id = \'" + input + "\'");',
            '  return result;',
            '}'
        ],
        codeFixed: [
            'async function processData(input: string) {',
            '  const result = await db.query(',
            '    "SELECT * FROM users WHERE id = ?", [input]',
            '  );',
            '  return result;',
            '}'
        ],
        issueTitle: 'SQL Injection Vulnerability',
        issueSeverity: 'Critical',
        issueLine: 2,
        issueDesc: 'User input is directly concatenated into the SQL query string. Attackers can inject arbitrary SQL payloads.',
        suggestedFix: 'const result = await db.query(\n  "SELECT * FROM users WHERE id = ?", [input]\n);'
    },
    'auth.ts': {
        name: 'auth.ts',
        lang: 'typescript',
        codeVulnerable: [
            'export function verifyToken(token: string) {',
            '  // Missing algorithm verification',
            '  return jwt.decode(token);',
            '}'
        ],
        codeFixed: [
            'export function verifyToken(token: string) {',
            '  return jwt.verify(token, process.env.JWT_SECRET!, {',
            '    algorithms: ["HS256"]',
            '  });',
            '}'
        ],
        issueTitle: 'Insecure JWT Decoding',
        issueSeverity: 'High',
        issueLine: 3,
        issueDesc: 'jwt.decode() does not verify signature. An attacker can forge arbitrary payloads without detection.',
        suggestedFix: 'return jwt.verify(token, process.env.JWT_SECRET!, {\n  algorithms: ["HS256"]\n});'
    },
    'utils.ts': {
        name: 'utils.ts',
        lang: 'typescript',
        codeVulnerable: [
            'export function calculateTax(subtotal: number) {',
            '  const rate = 0.18;',
            '  return eval(subtotal + " * " + rate);',
            '}'
        ],
        codeFixed: [
            'export function calculateTax(subtotal: number) {',
            '  const rate = 0.18;',
            '  return Number(subtotal) * rate;',
            '}'
        ],
        issueTitle: 'Dangerous eval() Execution',
        issueSeverity: 'Critical',
        issueLine: 3,
        issueDesc: 'Dynamic eval() allows arbitrary JavaScript code execution if subtotal is tainted.',
        suggestedFix: 'return Number(subtotal) * rate;'
    },
    'routes.ts': {
        name: 'routes.ts',
        lang: 'typescript',
        codeVulnerable: [
            'app.post("/api/user", (req, res) => {',
            '  const { password } = req.body;',
            '  console.log("Password received:", password);',
            '  res.json({ ok: true });',
            '});'
        ],
        codeFixed: [
            'app.post("/api/user", (req, res) => {',
            '  const { password } = req.body;',
            '  logger.info("Password received: [REDACTED]");',
            '  res.json({ ok: true });',
            '});'
        ],
        issueTitle: 'Plaintext Secret in Logs',
        issueSeverity: 'High',
        issueLine: 3,
        issueDesc: 'Logging raw sensitive credentials in stdout violates compliance standards like GDPR & PCI-DSS.',
        suggestedFix: 'logger.info("Password received: [REDACTED]");'
    }
};

export default function Landing({ onGetStarted }: LandingProps) {
    // Theme state (dark / light)
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const saved = localStorage.getItem('crb_landing_theme');
        return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    });

    useEffect(() => {
        localStorage.setItem('crb_landing_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Hero IDE Demo State
    const [activeFile, setActiveFile] = useState<FileKey>('processData.ts');
    const [heroTab, setHeroTab] = useState<'issues' | 'suggestions' | 'explanation' | 'security'>('issues');
    const [isHeroFixed, setIsHeroFixed] = useState(false);
    const [isFixingAnim, setIsFixingAnim] = useState(false);
    const [copiedFix, setCopiedFix] = useState(false);
    const [showFixBanner, setShowFixBanner] = useState(false);

    // CLI box state
    const [cliScanning, setCliScanning] = useState(false);
    const [cliScanCount, setCliScanCount] = useState(0);

    // Diff Showcase state
    const [diffTab, setDiffTab] = useState<'review' | 'diff' | 'files'>('review');
    const [isDiffFixed, setIsDiffFixed] = useState(false);
    const [diffAnim, setDiffAnim] = useState(false);
    const [accordionOpen, setAccordionOpen] = useState(false);

    const currentDemo = DEMO_FILES[activeFile];

    // Trigger Fix Animation in Hero IDE
    const handleApplyHeroFix = () => {
        if (isHeroFixed) {
            // Revert to vulnerable for demo replay
            setIsHeroFixed(false);
            setShowFixBanner(false);
            return;
        }

        setIsFixingAnim(true);
        setTimeout(() => {
            setIsFixingAnim(false);
            setIsHeroFixed(true);
            setShowFixBanner(true);
            setTimeout(() => setShowFixBanner(false), 3500);
        }, 550);
    };

    const handleCopyFix = () => {
        navigator.clipboard?.writeText(currentDemo.suggestedFix);
        setCopiedFix(true);
        setTimeout(() => setCopiedFix(false), 2000);
    };

    // Trigger Diff Showcase Fix
    const handleApplyDiffFix = () => {
        if (isDiffFixed) {
            setIsDiffFixed(false);
            return;
        }
        setDiffAnim(true);
        setTimeout(() => {
            setDiffAnim(false);
            setIsDiffFixed(true);
        }, 400);
    };

    // Trigger CLI terminal rescan
    const handleCliRescan = () => {
        if (cliScanning) return;
        setCliScanning(true);
        setTimeout(() => {
            setCliScanning(false);
            setCliScanCount(c => c + 1);
        }, 800);
    };

    return (
        <div className={`crb-landing crb-theme-${theme}`}>
            {/* Ambient Animated Glow Blobs */}
            <div className="crb-ambient-blob crb-blob-1"></div>
            <div className="crb-ambient-blob crb-blob-2"></div>

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
                        <a href="#showcase">Diff Review</a>
                        <a href="#testimonials">Testimonials</a>
                    </nav>

                    <div className="crb-nav-right">
                        <button className="crb-btn-ghost" onClick={onGetStarted}>
                            Sign in
                        </button>
                        <button className="crb-btn-primary crb-btn-sm" onClick={onGetStarted}>
                            Get started
                        </button>

                        {/* Interactive Dark / Light Toggle */}
                        <button
                            className="crb-theme-btn"
                            onClick={toggleTheme}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            title={`Click to switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? (
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
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="crb-hero">
                <div className="crb-hero-left">
                    <div className="crb-eyebrow">
                        <span className="crb-badge-pulse"></span>
                        FOR DEVELOPERS, BY DEVELOPERS
                    </div>
                    <h1 className="crb-hero-title">
                        Stronger code reviews. Less context switching.
                    </h1>
                    <p className="crb-hero-desc">
                        Catch bugs, improve security, and get clear, actionable suggestions — right in your workflow.
                        An AI-powered review assistant that actually understands your code.
                    </p>

                    <div className="crb-cta-group">
                        <button className="crb-btn-primary crb-btn-lg crb-cta-glow" onClick={onGetStarted}>
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

                    {/* Interactive CLI Box */}
                    <div className="crb-cli-box" onClick={handleCliRescan} title="Click to re-run CLI simulation">
                        <div className={`crb-cli-dot ${cliScanning ? 'scanning' : ''}`}></div>
                        <div className="crb-cli-content">
                            <div className="crb-cli-cmd">
                                <span className="crb-cli-prompt">&gt;</span> npx code-review-bot
                                <span className="crb-cursor"></span>
                            </div>
                            {cliScanning ? (
                                <div className="crb-cli-scanning-text">
                                    <span className="crb-spinner"></span> Scanning AST &amp; LLM reasoning engine...
                                </div>
                            ) : (
                                <>
                                    <div className="crb-cli-sub">
                                        Scanning your code... {cliScanCount > 0 ? `(Scan #${cliScanCount + 1})` : ''}
                                    </div>
                                    <div className="crb-cli-results">
                                        Found 3 issues (<span className="crb-critical-text">2 critical</span>, <span className="crb-medium-text">1 medium</span>)
                                    </div>
                                </>
                            )}
                        </div>
                        <button className="crb-cli-replay-btn" aria-label="Replay scan">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* HERO RIGHT: Interactive IDE PR Mockup with Live Fix Animation */}
                <div className="crb-hero-right">
                    <div className="crb-ide-window">
                        {/* Notification toast when fix applied */}
                        {showFixBanner && (
                            <div className="crb-fix-toast animate-slide-down">
                                <span className="crb-toast-sparkle">✨</span>
                                <strong>Vulnerability Patched:</strong> Parameterized query applied to Line 2!
                            </div>
                        )}

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
                                <button
                                    className={`crb-ide-review-btn ${isHeroFixed ? 'fixed' : ''}`}
                                    onClick={handleApplyHeroFix}
                                    title="Click to trigger animated AI Auto-Fix"
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                                    </svg>
                                    {isHeroFixed ? 'Revert Code' : 'Auto-Fix PR'}
                                </button>
                            </div>
                        </div>

                        {/* IDE Body */}
                        <div className="crb-ide-body">
                            {/* Left File Tree - CLICKABLE */}
                            <div className="crb-ide-sidebar">
                                <div className="crb-filetree-header">
                                    <span>Files</span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>
                                {(['processData.ts', 'auth.ts', 'utils.ts', 'routes.ts'] as FileKey[]).map(file => (
                                    <div
                                        key={file}
                                        className={`crb-file-item ${activeFile === file ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveFile(file);
                                            setIsHeroFixed(false);
                                        }}
                                        title={`View demo review for ${file}`}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={activeFile === file ? '#60a5fa' : '#94a3b8'} strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        {file}
                                    </div>
                                ))}
                                <div className="crb-file-item dimmed">
                                    + 12 more files
                                </div>
                            </div>

                            {/* Right Editor Pane */}
                            <div className="crb-ide-editor">
                                <div className="crb-editor-tab">
                                    <span>{currentDemo.name}</span>
                                    {isHeroFixed && <span className="crb-tab-fixed-tag">✓ Fixed</span>}
                                </div>

                                {/* Code Lines Display with animated scanning laser */}
                                <div className="crb-code-view">
                                    {isFixingAnim && <div className="crb-laser-scanner"></div>}

                                    {(!isHeroFixed ? currentDemo.codeVulnerable : currentDemo.codeFixed).map((line, idx) => {
                                        const lineNum = idx + 1;
                                        const isHighlight = !isHeroFixed && (lineNum === currentDemo.issueLine || lineNum === currentDemo.issueLine + 1);
                                        const isFixedLine = isHeroFixed && (lineNum === currentDemo.issueLine || lineNum === currentDemo.issueLine + 1);

                                        return (
                                            <div
                                                key={`${activeFile}-${lineNum}-${isHeroFixed}`}
                                                className={`crb-code-line ${isHighlight ? 'crb-line-highlight' : ''} ${isFixedLine ? 'crb-line-fixed' : ''} ${isFixingAnim ? 'crb-line-fixing' : ''}`}
                                            >
                                                <span className="crb-ln">{lineNum}</span>
                                                <span className="crb-code-content">{line}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Floating / Docked Review Card */}
                                <div className="crb-review-card">
                                    <div className="crb-review-tabs">
                                        <button
                                            className={`crb-rtab ${heroTab === 'issues' ? 'active' : ''}`}
                                            onClick={() => setHeroTab('issues')}
                                        >
                                            Issues <span className="crb-pill-count red">{isHeroFixed ? '2' : '3'}</span>
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
                                            Security <span className="crb-pill-count red">{isHeroFixed ? '0' : '1'}</span>
                                        </button>
                                    </div>

                                    {/* Tab 1: Issues */}
                                    {heroTab === 'issues' && (
                                        <div className="crb-issue-body animate-fade-in">
                                            <div className="crb-issue-header">
                                                <div className="crb-issue-title-row">
                                                    <div className={`crb-issue-icon ${isHeroFixed ? 'green' : 'red'}`}>
                                                        {isHeroFixed ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="crb-issue-title">{currentDemo.issueTitle}</span>
                                                    <span className={`crb-badge-${currentDemo.issueSeverity.toLowerCase()}`}>
                                                        {isHeroFixed ? 'Resolved' : currentDemo.issueSeverity}
                                                    </span>
                                                </div>
                                                <span className="crb-issue-loc">Line {currentDemo.issueLine}</span>
                                            </div>

                                            <p className="crb-issue-desc">{currentDemo.issueDesc}</p>

                                            <div className="crb-fix-box">
                                                <div className="crb-fix-label">
                                                    {isHeroFixed ? '✓ Code updated in editor:' : 'Suggested fix:'}
                                                </div>
                                                <pre className="crb-fix-code">
                                                    <code>{currentDemo.suggestedFix}</code>
                                                </pre>
                                            </div>

                                            <div className="crb-issue-actions">
                                                <div className="crb-actions-left">
                                                    <button
                                                        className={`crb-btn-apply ${isHeroFixed ? 'applied' : ''}`}
                                                        onClick={handleApplyHeroFix}
                                                    >
                                                        {isFixingAnim ? 'Applying fix...' : isHeroFixed ? '✓ Fixed (Click to Revert)' : '⚡ Apply fix'}
                                                    </button>
                                                    <button className="crb-btn-copy" onClick={handleCopyFix}>
                                                        {copiedFix ? '✓ Copied' : 'Copy'}
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
                                    )}

                                    {/* Tab 2: Suggestions */}
                                    {heroTab === 'suggestions' && (
                                        <div className="crb-issue-body animate-fade-in">
                                            <div className="crb-suggestion-card">
                                                <h4>💡 Add Strict TypeScript Parameter Validation</h4>
                                                <p>Sanitize and validate input against an explicit UUID or regex schema before touching the database layer.</p>
                                                <pre className="crb-fix-code"><code>if (!/^[a-zA-Z0-9_-]+$/.test(input)) throw new Error("Invalid format");</code></pre>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 3: Explanation */}
                                    {heroTab === 'explanation' && (
                                        <div className="crb-issue-body animate-fade-in">
                                            <div className="crb-explanation-card">
                                                <h4>📖 Code Breakdown for {activeFile}</h4>
                                                <p>This module queries user records from PostgreSQL. Direct string concatenation bypasses compiler safety checks and introduces OWASP Top 10 vulnerabilities.</p>
                                                <div className="crb-metric-row">
                                                    <span>Complexity: <strong>Low</strong></span>
                                                    <span>Risk: <strong style={{ color: '#ef4444' }}>High (CWE-89)</strong></span>
                                                    <span>Fix Confidence: <strong style={{ color: '#10b981' }}>99%</strong></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 4: Security */}
                                    {heroTab === 'security' && (
                                        <div className="crb-issue-body animate-fade-in">
                                            <div className="crb-security-card">
                                                <div className="crb-sec-header">
                                                    <span className="crb-sec-score">CVSS 9.8</span>
                                                    <span>CWE-89: Improper Neutralization of Special Elements</span>
                                                </div>
                                                <p>Attack vectors: Remote unauthenticated user injection. Recommended remediation: Parameterized prepared statements.</p>
                                            </div>
                                        </div>
                                    )}
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
            <section id="showcase" className="crb-showcase-section">
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
                                        Review <span className="crb-pill-count red">{isDiffFixed ? '2' : '3'}</span>
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

                            <div className={`crb-diff-editor ${diffAnim ? 'crb-diff-animating' : ''}`}>
                                <div className="crb-diff-line">
                                    <span className="crb-dln">1</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;<span className="crb-kw">function</span> <span className="crb-fn">calculateTotal</span>(items) &#123;</span>
                                </div>
                                <div className="crb-diff-line">
                                    <span className="crb-dln">2</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;&nbsp;&nbsp;<span className="crb-kw">let</span> total = 0;</span>
                                </div>
                                {!isDiffFixed ? (
                                    <div className="crb-diff-line crb-dline-remove">
                                        <span className="crb-dln">3</span>
                                        <span className="crb-dsign">-</span>
                                        <span className="crb-dcode">&nbsp;&nbsp;<span className="crb-kw">for</span> (<span className="crb-kw">let</span> i = 0; i &lt;= items.length; i++) &#123;</span>
                                    </div>
                                ) : null}
                                <div className="crb-diff-line crb-dline-add">
                                    <span className="crb-dln">{isDiffFixed ? '3' : '4'}</span>
                                    <span className="crb-dsign">+</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;<span className="crb-kw">for</span> (<span className="crb-kw">let</span> i = 0; i &lt; items.length; i++) &#123;</span>
                                </div>
                                <div className="crb-diff-line">
                                    <span className="crb-dln">{isDiffFixed ? '4' : '5'}</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;total += items[i].price;</span>
                                </div>
                                <div className="crb-diff-line">
                                    <span className="crb-dln">{isDiffFixed ? '5' : '6'}</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;&nbsp;&nbsp;&#125;</span>
                                </div>
                                <div className="crb-diff-line">
                                    <span className="crb-dln">{isDiffFixed ? '6' : '7'}</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;&nbsp;&nbsp;<span className="crb-kw">return</span> total;</span>
                                </div>
                                <div className="crb-diff-line">
                                    <span className="crb-dln">{isDiffFixed ? '7' : '8'}</span>
                                    <span className="crb-dcode">&nbsp;&nbsp;&#125;</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Issue Review Box */}
                        <div className="crb-issue-panel">
                            <div className="crb-panel-card">
                                <div className="crb-panel-header">
                                    <div className="crb-panel-title-row">
                                        <div className={`crb-issue-icon ${isDiffFixed ? 'green' : 'yellow'}`}>
                                            {isDiffFixed ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : (
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                                    <line x1="12" y1="9" x2="12" y2="13" />
                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="crb-panel-title">
                                            {isDiffFixed ? 'Boundary Off-By-One Fixed' : 'Potential runtime error'}
                                        </span>
                                        <span className={`crb-badge-${isDiffFixed ? 'resolved' : 'medium'}`}>
                                            {isDiffFixed ? 'Fixed' : 'Medium'}
                                        </span>
                                    </div>
                                    <span className="crb-issue-loc">Line 3</span>
                                </div>

                                <p className="crb-panel-desc">
                                    {isDiffFixed
                                        ? 'Loop boundary correctly changed from <= to <, preventing out-of-bounds access.'
                                        : 'The loop uses <= which accesses items[items.length] (undefined), causing a runtime TypeError.'}
                                </p>

                                <div className="crb-panel-actions">
                                    <button
                                        className={`crb-btn-apply ${isDiffFixed ? 'applied' : ''}`}
                                        onClick={handleApplyDiffFix}
                                    >
                                        {isDiffFixed ? '✓ Fix applied (Revert)' : '⚡ Apply fix'}
                                    </button>
                                    <button className="crb-btn-dismiss" onClick={() => setIsDiffFixed(false)}>
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
                                        <div className="crb-accordion-content animate-slide-down">
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
            <section id="testimonials" className="crb-social-proof">
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
            <section className="crb-cta-section">
                <div className="crb-container">
                    <div className="crb-cta-banner">
                        <div className="crb-cta-left">
                            <h2 className="crb-cta-heading">Start shipping better code today.</h2>
                            <p className="crb-cta-sub">
                                Join developers who use Code Review Bot to write cleaner, safer, and more maintainable code.
                            </p>
                        </div>
                        <div className="crb-cta-right">
                            <button className="crb-btn-primary crb-btn-lg crb-cta-glow" onClick={onGetStarted}>
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
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How it works</a>
                        <a href="#showcase">Diff Review</a>
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
