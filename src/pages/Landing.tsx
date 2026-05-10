import './Landing.css';

interface LandingProps {
    onGetStarted: () => void;
}

function Landing({ onGetStarted }: LandingProps) {
    return (
        <div className="landing-page">
            {/* Nav */}
            <nav className="landing-nav">
                <div className="landing-logo">
                    <span className="logo-icon">🤖</span>
                    <span className="logo-text">Code Review Bot</span>
                </div>
                <div className="nav-actions">
                    <button className="btn-text btn-nav-large" onClick={onGetStarted}>Sign In</button>
                    <button className="btn btn-primary btn-nav-large" onClick={onGetStarted}>Get Started</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge animate-float">
                        <span className="sparkle">✨</span> Powered by Groq Llama 3
                    </div>
                    <h1 className="hero-title">
                        Ship <span className="highlight">Perfect</span> Code, <br />
                        Every Single PR.
                    </h1>
                    <p className="hero-subtitle">
                        The AI-first code review companion that helps you find bugs, 
                        improve security, and automate PR comments in seconds.
                    </p>
                    <div className="hero-cta">
                        <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
                            Get Started for Free
                        </button>
                        <a href="#how-it-works" className="btn btn-ghost btn-lg">
                            Explore Features
                        </a>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <div className="stat-value">10x</div>
                            <div className="stat-label">Faster Reviews</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">90%</div>
                            <div className="stat-label">Issue Detection</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">5+</div>
                            <div className="stat-label">Analysis Modes</div>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="glass-card demo-card animate-slide-up">
                        <div className="demo-header">
                            <div className="dot red"></div>
                            <div className="dot yellow"></div>
                            <div className="dot green"></div>
                            <span className="demo-title">Pull Request Review #42</span>
                        </div>
                        <div className="demo-content">
                            <div className="demo-code-line">
                                <span className="line-num">1</span>
                                <span className="code-text"><span className="keyword">async function</span> <span className="function">processData</span>(input) {'{'}</span>
                            </div>
                            <div className="demo-code-line">
                                <span className="line-num">2</span>
                                <span className="code-text">  <span className="keyword">const</span> result = <span className="keyword">await</span> db.query(<span className="string">"SELECT * FROM users"</span>);</span>
                            </div>
                            <div className="demo-ai-comment animate-pop-in">
                                <div className="ai-badge">🤖 AI Review</div>
                                <p>🔴 <b>Security Risk:</b> Possible SQL Injection if <code>input</code> is concatenated. Use parameterized queries instead.</p>
                                <div className="ai-actions">
                                    <button className="btn-ai-sm">Apply Fix</button>
                                    <button className="btn-ai-sm secondary">Dismiss</button>
                                </div>
                            </div>
                            <div className="demo-code-line">
                                <span className="line-num">3</span>
                                <span className="code-text">  <span className="keyword">return</span> result;</span>
                            </div>
                            <div className="demo-code-line">
                                <span className="line-num">4</span>
                                <span className="code-text">{'}'}<span className="blinking-cursor">|</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-it-works">
                <div className="section-header">
                    <h2>Simplify your code quality</h2>
                    <p>Three steps to a more reliable codebase.</p>
                </div>
                <div className="steps-container">
                    <div className="step-card">
                        <div className="step-num">01</div>
                        <h4>Connect GitHub</h4>
                        <p>Install our webhook on your repository in one click.</p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step-card">
                        <div className="step-num">02</div>
                        <h4>AI Analyzes PRs</h4>
                        <p>Our agent reviews every diff for bugs and security risks.</p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step-card">
                        <div className="step-num">03</div>
                        <h4>Get Fix Suggestions</h4>
                        <p>Review AI comments and apply auto-fixes directly on GitHub.</p>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Everything you need for clean code</h2>
                    <p>Powerful AI tools designed for modern engineering teams.</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🐙</div>
                        <h3>GitHub Automation</h3>
                        <p>Automatic PR analysis and comments. Proactive reviews before you even look at the code.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🛡️</div>
                        <h3>Security Audits</h3>
                        <p>Deep scan for vulnerabilities, hardcoded secrets, and unsafe patterns in real-time.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔧</div>
                        <h3>Smart Auto-Fix</h3>
                        <p>Don't just find bugs—fix them. One-click suggestions to refactor and optimize your code.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💬</div>
                        <h3>Code Explanation</h3>
                        <p>Confused by a complex function? Get a plain-English breakdown of how it works.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="glass-card cta-card">
                    <h2>Ready to level up your workflow?</h2>
                    <p>Join developers who are shipping code faster with AI.</p>
                    <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
                        Join the Beta Now
                    </button>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-spacing-top"></div>
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="landing-logo">
                            <span className="logo-icon">🤖</span>
                            <span className="logo-text">Code Review Bot</span>
                        </div>
                        <p>Deploying the future of automated code quality. Built for developers who care about perfect code.</p>
                        <div className="social-links">
                            <span>🐦</span>
                            <span>🐙</span>
                            <span>💼</span>
                        </div>
                    </div>
                    <div className="footer-links">
                        <div className="link-col">
                            <h4>Product</h4>
                            <a href="#features">Features</a>
                            <a href="#how-it-works">How it works</a>
                            <button className="btn-link" onClick={onGetStarted}>Pricing</button>
                        </div>
                        <div className="link-col">
                            <h4>Resources</h4>
                            <a href="https://github.com/NeethishS/code-review-bot" target="_blank" rel="noreferrer">GitHub OSS</a>
                            <a href="#">Docs</a>
                            <a href="#">API</a>
                        </div>
                        <div className="link-col">
                            <h4>Legal</h4>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 Code Review Bot. All rights reserved.</p>
                    <p className="footer-built-with">Built with ❤️ & Groq AI</p>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
