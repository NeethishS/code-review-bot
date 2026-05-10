import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import apiService, { type AnalysisResponse } from '../services/apiService';
import learningService from '../services/learningService';
import './AIDemo.css';

interface PreloadedCode {
    code: string;
    language: string;
    filename: string;
}

interface AIDemoProps {
    preloadedCode?: PreloadedCode | null;
    onPreloadConsumed?: () => void;
}

// Hello World code samples for each language
const CODE_SAMPLES: Record<string, string> = {
    javascript: `// Hello World in JavaScript
function greet(name) {
    console.log("Hello, " + name + "!");
}

greet("World");`,
    
    python: `# Hello World in Python
def greet(name):
    print(f"Hello, {name}!")

if __name__ == "__main__":
    greet("World")`,
    
    java: `// Hello World in Java
public class HelloWorld {
    public static void main(String[] args) {
        greet("World");
    }
    
    public static void greet(String name) {
        System.out.println("Hello, " + name + "!");
    }
}`,
    
    cpp: `// Hello World in C++
#include <iostream>
#include <string>

void greet(std::string name) {
    std::cout << "Hello, " << name << "!" << std::endl;
}

int main() {
    greet("World");
    return 0;
}`,
    
    c: `// Hello World in C
#include <stdio.h>

void greet(char* name) {
    printf("Hello, %s!\\n", name);
}

int main() {
    greet("World");
    return 0;
}`,
};

interface ErrorInfo {
    type: 'validation' | 'network' | 'api' | 'rate-limit' | 'parsing' | 'unknown';
    title: string;
    message: string;
    suggestions: string[];
    icon: string;
}

function AIDemo({ preloadedCode, onPreloadConsumed }: AIDemoProps) {
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(CODE_SAMPLES.javascript);
    const [analysisType, setAnalysisType] = useState<string>('code-smell');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResponse | null>(null);
    const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
    const [preloadBanner, setPreloadBanner] = useState<string | null>(null);
    // Tracks whether we just loaded preloaded code — prevents language useEffect from overwriting it
    const justPreloaded = useRef(false);

    // Load preloaded code from GitHub Browser
    useEffect(() => {
        if (preloadedCode) {
            justPreloaded.current = true; // signal: do NOT reset code on next language change
            setCode(preloadedCode.code);
            // Map language to one of our supported options, fallback to javascript
            const supported = ['javascript', 'python', 'java', 'cpp', 'c'];
            const lang = supported.includes(preloadedCode.language) ? preloadedCode.language : 'javascript';
            setLanguage(lang);
            setResult(null);
            setErrorInfo(null);
            setPreloadBanner(`📂 Loaded from GitHub: ${preloadedCode.filename}`);
            onPreloadConsumed?.();
        }
    }, [preloadedCode]);

    // Update code when language changes — but skip if we just loaded preloaded code
    useEffect(() => {
        if (justPreloaded.current) {
            justPreloaded.current = false; // consume the flag
            return;
        }
        setCode(CODE_SAMPLES[language] || CODE_SAMPLES.javascript);
        setResult(null);
        setErrorInfo(null);
    }, [language]);

    // Render human-readable results
    const renderHumanReadableResult = (data: any, type: string) => {
        if (!data) {
            return <p className="no-data">No analysis data available</p>;
        }

        // If the AI returned raw text (not JSON), display it nicely
        if (data._raw) {
            return (
                <div className="analysis-output">
                    <div className="summary-box">
                        <h4>🤖 AI Analysis</h4>
                        <div className="raw-response">{data._raw}</div>
                    </div>
                </div>
            );
        }

        try {
            switch (type) {
                case 'code-smell':
                    return renderCodeSmells(data);
                case 'security':
                    return renderSecurity(data);
                case 'performance':
                    return renderPerformance(data);
                case 'complexity':
                    return renderComplexity(data);
                case 'duplicates':
                    return renderDuplicates(data);
                case 'test-generation':
                    return renderTests(data);
                case 'full-review':
                    return renderFullReview(data);
                case 'pattern-analysis':
                    return renderPatterns(data);
                case 'edge-cases':
                    return renderEdgeCases(data);
                case 'before-after':
                    return renderBeforeAfter(data);
                default:
                    return <pre>{JSON.stringify(data, null, 2)}</pre>;
            }
        } catch (error) {
            return (
                <div className="parse-error">
                    <p>⚠️ Could not parse the AI response in a readable format.</p>
                    <p>The AI returned: {typeof data === 'string' ? data : JSON.stringify(data)}</p>
                </div>
            );
        }
    };

    const renderCodeSmells = (data: any) => {
        const smells = data.smells || [];
        const summary = data.summary || 'No summary available';

        return (
            <div className="analysis-output">
                <div className="summary-box">
                    <h4>📝 Summary</h4>
                    <p>{summary}</p>
                </div>

                {smells.length > 0 ? (
                    <div className="issues-list">
                        <h4>🔍 Code Smells Found ({smells.length})</h4>
                        {smells.map((smell: any, index: number) => (
                            <div key={index} className={`issue-card severity-${smell.severity}`}>
                                <div className="issue-header">
                                    <span className={`severity-badge ${smell.severity}`}>
                                        {smell.severity?.toUpperCase()}
                                    </span>
                                    {smell.line && <span className="line-number">Line {smell.line}</span>}
                                </div>
                                <h5>{smell.type || 'Code Smell'}</h5>
                                <p className="issue-description">{smell.description}</p>
                                {smell.suggestion && (
                                    <div className="suggestion">
                                        <strong>💡 Suggestion:</strong> {smell.suggestion}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-issues">
                        <span className="success-icon">✅</span>
                        <p>No code smells detected! Your code looks clean.</p>
                    </div>
                )}
            </div>
        );
    };

    const renderSecurity = (data: any) => {
        const vulnerabilities = data.vulnerabilities || [];
        const summary = data.summary || 'No summary available';
        const riskScore = data.riskScore || 0;

        return (
            <div className="analysis-output">
                <div className="summary-box">
                    <h4>🔒 Security Analysis</h4>
                    <p>{summary}</p>
                    <div className="risk-score">
                        <span>Risk Score: </span>
                        <span className={`score ${riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low'}`}>
                            {riskScore}/100
                        </span>
                    </div>
                </div>

                {vulnerabilities.length > 0 ? (
                    <div className="issues-list">
                        <h4>⚠️ Vulnerabilities Found ({vulnerabilities.length})</h4>
                        {vulnerabilities.map((vuln: any, index: number) => (
                            <div key={index} className={`issue-card severity-${vuln.severity}`}>
                                <div className="issue-header">
                                    <span className={`severity-badge ${vuln.severity}`}>
                                        {vuln.severity?.toUpperCase()}
                                    </span>
                                    {vuln.line && <span className="line-number">Line {vuln.line}</span>}
                                </div>
                                <h5>{vuln.type || 'Security Issue'}</h5>
                                <p className="issue-description">{vuln.description}</p>
                                {vuln.fix && (
                                    <div className="suggestion">
                                        <strong>🔧 Fix:</strong> {vuln.fix}
                                    </div>
                                )}
                                {vuln.cwe && (
                                    <div className="cwe-tag">CWE: {vuln.cwe}</div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-issues">
                        <span className="success-icon">🛡️</span>
                        <p>No security vulnerabilities detected!</p>
                    </div>
                )}
            </div>
        );
    };

    const renderPerformance = (data: any) => {
        const issues = data.issues || [];
        const summary = data.summary || 'No summary available';

        return (
            <div className="analysis-output">
                <div className="summary-box">
                    <h4>⚡ Performance Analysis</h4>
                    <p>{summary}</p>
                </div>

                {issues.length > 0 ? (
                    <div className="issues-list">
                        <h4>🚀 Optimization Opportunities ({issues.length})</h4>
                        {issues.map((issue: any, index: number) => (
                            <div key={index} className={`issue-card severity-${issue.severity}`}>
                                <div className="issue-header">
                                    <span className={`severity-badge ${issue.severity}`}>
                                        {issue.severity?.toUpperCase()}
                                    </span>
                                    {issue.line && <span className="line-number">Line {issue.line}</span>}
                                </div>
                                <h5>{issue.type || 'Performance Issue'}</h5>
                                <p className="issue-description">{issue.description}</p>
                                {issue.optimization && (
                                    <div className="suggestion">
                                        <strong>💡 Optimization:</strong> {issue.optimization}
                                    </div>
                                )}
                                {issue.estimatedImprovement && (
                                    <div className="improvement-tag">
                                        Expected improvement: {issue.estimatedImprovement}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-issues">
                        <span className="success-icon">⚡</span>
                        <p>No performance issues found! Code is well optimized.</p>
                    </div>
                )}
            </div>
        );
    };

    const renderComplexity = (data: any) => {
        const metrics = data.metrics || {};
        const complexFunctions = data.complexFunctions || [];
        const summary = data.summary || 'No summary available';
        const grade = data.grade || 'N/A';

        return (
            <div className="analysis-output">
                <div className="summary-box">
                    <h4>📊 Complexity Analysis</h4>
                    <p>{summary}</p>
                    <div className="grade-display">
                        <span>Overall Grade: </span>
                        <span className={`grade grade-${grade}`}>{grade}</span>
                    </div>
                </div>

                <div className="metrics-grid">
                    <div className="metric-card">
                        <span className="metric-label">Cyclomatic Complexity</span>
                        <span className="metric-value">{metrics.cyclomaticComplexity || 'N/A'}</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">Cognitive Complexity</span>
                        <span className="metric-value">{metrics.cognitiveComplexity || 'N/A'}</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">Max Nesting Depth</span>
                        <span className="metric-value">{metrics.maxNestingDepth || 'N/A'}</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-label">Function Count</span>
                        <span className="metric-value">{metrics.functionCount || 'N/A'}</span>
                    </div>
                </div>

                {complexFunctions.length > 0 && (
                    <div className="issues-list">
                        <h4>⚠️ Complex Functions ({complexFunctions.length})</h4>
                        {complexFunctions.map((func: any, index: number) => (
                            <div key={index} className="issue-card">
                                <div className="issue-header">
                                    <span className="function-name">{func.name}</span>
                                    {func.line && <span className="line-number">Line {func.line}</span>}
                                </div>
                                <p className="complexity-score">Complexity: {func.complexity}</p>
                                {func.suggestion && (
                                    <div className="suggestion">
                                        <strong>💡 Suggestion:</strong> {func.suggestion}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderDuplicates = (data: any) => {
        const duplicates = data.duplicates || [];
        const summary = data.summary || 'No summary available';
        const percentage = data.duplicationPercentage || 0;

        return (
            <div className="analysis-output">
                <div className="summary-box">
                    <h4>🔄 Duplicate Code Analysis</h4>
                    <p>{summary}</p>
                    <div className="duplication-percentage">
                        <span>Duplication: </span>
                        <span className={`percentage ${percentage > 20 ? 'high' : percentage > 10 ? 'medium' : 'low'}`}>
                            {percentage}%
                        </span>
                    </div>
                </div>

                {duplicates.length > 0 ? (
                    <div className="issues-list">
                        <h4>📋 Duplicates Found ({duplicates.length})</h4>
                        {duplicates.map((dup: any, index: number) => (
                            <div key={index} className="issue-card">
                                <div className="issue-header">
                                    <span className={`type-badge ${dup.type}`}>
                                        {dup.type?.toUpperCase()}
                                    </span>
                                </div>
                                <p className="issue-description">{dup.description}</p>
                                {dup.locations && (
                                    <div className="locations">
                                        <strong>Locations:</strong>
                                        {dup.locations.map((loc: any, i: number) => (
                                            <span key={i} className="location-tag">
                                                Lines {loc.startLine}-{loc.endLine}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {dup.refactoringStrategy && (
                                    <div className="suggestion">
                                        <strong>♻️ Refactoring:</strong> {dup.refactoringStrategy}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-issues">
                        <span className="success-icon">✨</span>
                        <p>No duplicate code found! Following DRY principles.</p>
                    </div>
                )}
            </div>
        );
    };

    const renderTests = (data: any) => {
        const tests = data.tests || [];
        const summary = data.summary || 'No summary available';
        const framework = data.framework || 'Unknown';
        const coverage = data.estimatedCoverage || 0;

        return (
            <div className="analysis-output">
                <div className="summary-box">
                    <h4>🧪 Generated Tests</h4>
                    <p>{summary}</p>
                    <div className="test-info">
                        <span>Framework: <strong>{framework}</strong></span>
                        <span>Estimated Coverage: <strong>{coverage}%</strong></span>
                    </div>
                </div>

                {tests.length > 0 ? (
                    <div className="tests-list">
                        <h4>📝 Test Cases ({tests.length})</h4>
                        {tests.map((test: any, index: number) => (
                            <div key={index} className="test-card">
                                <h5>{test.name}</h5>
                                <p className="test-description">{test.description}</p>
                                <div className="test-code">
                                    <pre><code>{test.code}</code></pre>
                                </div>
                                {test.coverage && (
                                    <div className="coverage-tag">Covers: {test.coverage}</div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-issues">
                        <p>No tests generated</p>
                    </div>
                )}
            </div>
        );
    };

    // ── Score breakdown widget ──────────────────────────────────
    const renderScoreBreakdown = (breakdown: any, overall: number) => {
        if (!breakdown) return null;
        const bars = [
            { label: 'Readability', value: breakdown.readability, color: '#6366f1' },
            { label: 'Efficiency', value: breakdown.efficiency, color: '#10b981' },
            { label: 'Security', value: breakdown.security, color: '#f59e0b' },
            { label: 'Best Practices', value: breakdown.bestPractices, color: '#8b5cf6' },
        ];
        return (
            <div className="score-breakdown">
                <div className="overall-score-big">
                    <span className={`score-circle ${overall >= 80 ? 'high' : overall >= 60 ? 'medium' : 'low'}`}>
                        {overall}<small>/100</small>
                    </span>
                    <span className="score-label">Overall Score</span>
                </div>
                <div className="score-bars">
                    {bars.map((b, i) => b.value !== undefined && (
                        <div key={i} className="score-bar-row">
                            <span className="score-bar-label">{b.label}</span>
                            <div className="score-bar-track">
                                <div className="score-bar-fill" style={{ width: `${b.value}%`, background: b.color }} />
                            </div>
                            <span className="score-bar-val">{b.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ── Issue card with WHY + fixedCode ─────────────────────────
    const renderIssueCard = (issue: any, index: number) => (
        <div key={index} className={`issue-card severity-${issue.severity}`}>
            <div className="issue-header">
                {issue.type && <span className={`type-badge ${issue.type}`}>{issue.type?.toUpperCase()}</span>}
                <span className={`severity-badge ${issue.severity}`}>{issue.severity?.toUpperCase()}</span>
                {issue.line && <span className="line-number">📍 Line {issue.line}</span>}
                {issue.currentComplexity && (
                    <span className="complexity-tag">{issue.currentComplexity} → {issue.optimalComplexity}</span>
                )}
            </div>
            <p className="issue-description">❌ {issue.description}</p>
            {issue.why && <div className="issue-why">🧠 <strong>Why it matters:</strong> {issue.why}</div>}
            {(issue.suggestion || issue.fix || issue.optimization) && (
                <div className="suggestion">✅ <strong>Fix:</strong> {issue.suggestion || issue.fix || issue.optimization}</div>
            )}
            {(issue.fixedCode) && (
                <details className="fixed-code-details">
                    <summary>View fixed code</summary>
                    <pre className="fixed-code"><code>{issue.fixedCode}</code></pre>
                </details>
            )}
        </div>
    );

    const renderFullReview = (data: any) => {
        const issues = data.issues || [];
        const strengths = data.strengths || [];
        const summary = data.summary || 'No summary available';
        const score = data.overallScore || 0;

        return (
            <div className="analysis-output">
                <div className="summary-box">
                    <h4>📋 Full Code Review</h4>
                    <p>{summary}</p>
                </div>
                {renderScoreBreakdown(data.scoreBreakdown, score)}
                {strengths.length > 0 && (
                    <div className="strengths-box">
                        <h4>✨ Strengths</h4>
                        <ul>{strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                    </div>
                )}
                {issues.length > 0 && (
                    <div className="issues-list">
                        <h4>⚠️ Issues Found ({issues.length})</h4>
                        {issues.map(renderIssueCard)}
                    </div>
                )}
                {data.improvedCode && (
                    <details className="raw-json-details">
                        <summary>✅ View Improved Code</summary>
                        <pre className="fixed-code"><code>{data.improvedCode}</code></pre>
                    </details>
                )}
            </div>
        );
    };

    const renderPatterns = (data: any) => {
        const detected = data.detectedPatterns || [];
        const suggested = data.suggestedPatterns || [];
        return (
            <div className="analysis-output">
                <div className="summary-box">
                    <h4>🎯 Pattern Recognition</h4>
                    <p>{data.summary || 'No summary'}</p>
                </div>
                {detected.length > 0 && (
                    <div className="issues-list">
                        <h4>🔍 Detected Patterns ({detected.length})</h4>
                        {detected.map((p: any, i: number) => (
                            <div key={i} className={`issue-card ${p.correct ? 'severity-low' : 'severity-high'}`}>
                                <div className="issue-header">
                                    <span className="type-badge best-practice">{p.pattern}</span>
                                    <span className={`severity-badge ${p.correct ? 'low' : 'high'}`}>{p.correct ? '✓ Correct' : '✗ Suboptimal'}</span>
                                    {p.line && <span className="line-number">📍 Line {p.line}</span>}
                                </div>
                                <p className="issue-description">{p.description}</p>
                                {p.why && <div className="issue-why">🧠 {p.why}</div>}
                                {p.betterApproach && <div className="suggestion">✅ <strong>Better approach:</strong> {p.betterApproach}</div>}
                                {p.exampleCode && (
                                    <details className="fixed-code-details"><summary>View example</summary>
                                        <pre className="fixed-code"><code>{p.exampleCode}</code></pre>
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {suggested.length > 0 && (
                    <div className="issues-list">
                        <h4>💡 Suggested Patterns ({suggested.length})</h4>
                        {suggested.map((p: any, i: number) => (
                            <div key={i} className="issue-card severity-medium">
                                <div className="issue-header">
                                    <span className="type-badge performance">{p.pattern}</span>
                                </div>
                                <p className="issue-description">{p.reason}</p>
                                {p.benefit && <div className="issue-why">⚡ <strong>Benefit:</strong> {p.benefit}</div>}
                                {p.exampleCode && (
                                    <details className="fixed-code-details"><summary>View example</summary>
                                        <pre className="fixed-code"><code>{p.exampleCode}</code></pre>
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderEdgeCases = (data: any) => {
        const cases = data.edgeCases || [];
        return (
            <div className="analysis-output">
                <div className="summary-box">
                    <h4>🧪 Edge Case Generator</h4>
                    <p>{data.summary || 'No summary'}</p>
                    {data.criticalCount > 0 && (
                        <div className="risk-score">
                            <span>Critical cases: </span>
                            <span className="score high">{data.criticalCount}</span>
                        </div>
                    )}
                </div>
                {cases.length > 0 && (
                    <div className="issues-list">
                        <h4>⚠️ Edge Cases ({cases.length})</h4>
                        {cases.map((c: any, i: number) => (
                            <div key={i} className={`issue-card severity-${c.severity}`}>
                                <div className="issue-header">
                                    <span className="type-badge bug">{c.category}</span>
                                    <span className={`severity-badge ${c.severity}`}>{c.severity?.toUpperCase()}</span>
                                </div>
                                <p className="issue-description">📥 <strong>Input:</strong> <code>{c.input}</code></p>
                                <p className="issue-description">✅ <strong>Expected:</strong> {c.expectedBehavior}</p>
                                {c.likelyFailure && <div className="issue-why">❌ <strong>Likely failure:</strong> {c.likelyFailure}</div>}
                                {c.testCode && (
                                    <details className="fixed-code-details"><summary>View test code</summary>
                                        <pre className="fixed-code"><code>{c.testCode}</code></pre>
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderBeforeAfter = (data: any) => {
        const issues = data.issues || [];
        const changes = data.changes || [];
        const score = data.overallScore || 0;
        return (
            <div className="analysis-output">
                <div className="summary-box">
                    <h4>🔀 Before vs After</h4>
                    <p>{data.summary || 'No summary'}</p>
                </div>
                {renderScoreBreakdown(data.scoreBreakdown, score)}
                {issues.length > 0 && (
                    <div className="issues-list">
                        <h4>⚠️ Issues Fixed ({issues.length})</h4>
                        {issues.map(renderIssueCard)}
                    </div>
                )}
                {changes.length > 0 && (
                    <div className="issues-list">
                        <h4>📝 Changes Made ({changes.length})</h4>
                        {changes.map((c: any, i: number) => (
                            <div key={i} className="issue-card severity-low">
                                {c.line && <div className="issue-header"><span className="line-number">📍 Line {c.line}</span></div>}
                                <div className="before-after-row">
                                    <div className="before-code"><span className="ba-label">Before</span><code>{c.original}</code></div>
                                    <div className="after-code"><span className="ba-label">After</span><code>{c.improved}</code></div>
                                </div>
                                {c.reason && <div className="issue-why">🧠 {c.reason}</div>}
                            </div>
                        ))}
                    </div>
                )}
                {data.improvedCode && (
                    <details className="raw-json-details">
                        <summary>✅ View Full Improved Code</summary>
                        <pre className="fixed-code"><code>{data.improvedCode}</code></pre>
                    </details>
                )}
            </div>
        );
    };

    // Client-side validation
    const validateCode = (): ErrorInfo | null => {
        // Check if code is empty
        if (!code.trim()) {
            return {
                type: 'validation',
                title: 'Empty Code',
                message: 'Please enter some code to analyze',
                suggestions: [
                    'Paste your code in the textarea above',
                    'Or click the Reset button to load a Hello World example',
                    'Code must contain at least one character'
                ],
                icon: '📝'
            };
        }

        // Check if code is too large (>50KB)
        if (code.length > 50000) {
            return {
                type: 'validation',
                title: 'Code Too Large',
                message: `Your code is ${Math.round(code.length / 1000)}KB. Maximum size is 50KB.`,
                suggestions: [
                    'Try analyzing smaller code snippets',
                    'Break your code into multiple analyses',
                    'Focus on specific functions or classes'
                ],
                icon: '📦'
            };
        }

        // Check if code is too small (likely incomplete)
        if (code.trim().length < 10) {
            return {
                type: 'validation',
                title: 'Code Too Short',
                message: 'Your code seems too short for meaningful analysis',
                suggestions: [
                    'Add more code to get better analysis results',
                    'Minimum recommended: 10 characters',
                    'Try the Hello World examples as a starting point'
                ],
                icon: '⚠️'
            };
        }

        return null;
    };

    // Parse and categorize errors
    const categorizeError = (error: string): ErrorInfo => {
        const errorLower = error.toLowerCase();

        // Network errors
        if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('econnrefused')) {
            return {
                type: 'network',
                title: 'Connection Error',
                message: 'Unable to connect to the backend server',
                suggestions: [
                    'Check if the backend server is running on port 3001',
                    'Run: cd backend && npm run dev',
                    'Verify your internet connection',
                    'Check if localhost:3001 is accessible'
                ],
                icon: '🌐'
            };
        }

        // Rate limit errors
        if (errorLower.includes('rate limit')) {
            return {
                type: 'rate-limit',
                title: 'Rate Limit Exceeded',
                message: 'You\'ve made too many requests. Please wait a moment.',
                suggestions: [
                    'Current limit: 5 requests per minute',
                    'Wait 60 seconds before trying again',
                    'Consider analyzing code in batches',
                    'Check backend/.env to adjust MAX_REQUESTS_PER_MINUTE'
                ],
                icon: '⏱️'
            };
        }

        // API key errors
        if (errorLower.includes('api key') || errorLower.includes('unauthorized') || errorLower.includes('401')) {
            return {
                type: 'api',
                title: 'API Key Error',
                message: 'Invalid or missing Groq API key',
                suggestions: [
                    'Check backend/.env file has GROQ_API_KEY set',
                    'Get a free API key from https://console.groq.com',
                    'Restart the backend server after updating .env',
                    'Verify the API key is valid and not expired'
                ],
                icon: '🔑'
            };
        }

        // Parsing errors
        if (errorLower.includes('parse') || errorLower.includes('json') || errorLower.includes('syntax')) {
            return {
                type: 'parsing',
                title: 'Analysis Parsing Error',
                message: 'The AI response couldn\'t be parsed correctly',
                suggestions: [
                    'Try running the analysis again',
                    'The AI might have returned an unexpected format',
                    'Try a different analysis type',
                    'Check if your code has unusual characters'
                ],
                icon: '🔧'
            };
        }

        // Timeout errors
        if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
            return {
                type: 'api',
                title: 'Request Timeout',
                message: 'The analysis took too long to complete',
                suggestions: [
                    'Try analyzing smaller code snippets',
                    'The server might be overloaded',
                    'Check your internet connection speed',
                    'Try again in a few moments'
                ],
                icon: '⏰'
            };
        }

        // Generic error
        return {
            type: 'unknown',
            title: 'Analysis Failed',
            message: error,
            suggestions: [
                'Try running the analysis again',
                'Check the browser console for more details',
                'Verify the backend server is running',
                'Try a different code sample or analysis type'
            ],
            icon: '❌'
        };
    };

    const handleAnalyze = async () => {
        // Clear previous results
        setResult(null);
        setErrorInfo(null);

        // Validate code first
        const validationError = validateCode();
        if (validationError) {
            setErrorInfo(validationError);
            return;
        }

        setLoading(true);

        try {
            let response: AnalysisResponse;

            switch (analysisType) {
                case 'code-smell':
                    response = await apiService.analyzeCodeSmells(code, language);
                    break;
                case 'security':
                    response = await apiService.scanSecurity(code, language);
                    break;
                case 'performance':
                    response = await apiService.analyzePerformance(code, language);
                    break;
                case 'complexity':
                    response = await apiService.analyzeComplexity(code, language);
                    break;
                case 'duplicates':
                    response = await apiService.detectDuplicates(code, language);
                    break;
                case 'test-generation':
                    response = await apiService.generateTests(code, language, 'jest');
                    break;
                case 'full-review':
                    response = await apiService.fullReview(code, language);
                    break;
                case 'pattern-analysis':
                    response = await apiService.analyzePatterns(code, language);
                    break;
                case 'edge-cases':
                    response = await apiService.generateEdgeCases(code, language);
                    break;
                case 'before-after':
                    response = await apiService.beforeAfterReview(code, language);
                    break;
                default:
                    response = { success: false, error: 'Unknown analysis type' };
            }

            if (response.success) {
                setResult(response);

                
                // Track for learning/memory feature
                learningService.analyzeResult(analysisType, response);
                
                // The backend already saves the review automatically.
            } else {
                const error = categorizeError(response.error || 'Unknown error occurred');
                setErrorInfo(error);

                // The backend already saves the failed review automatically.
            }
        } catch (error: any) {
            const errorMsg = error.message || 'An unexpected error occurred';
            const categorizedError = categorizeError(errorMsg);
            setErrorInfo(categorizedError);
            console.error('❌ Exception during analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (newLanguage: string) => {
        setLanguage(newLanguage);
    };

    const resetToDefault = () => {
        setCode(CODE_SAMPLES[language]);
        setResult(null);
        setErrorInfo(null);
    };

    return (
        <div className="ai-demo animate-fade-in">
            <div className="page-header">
                <div>
                    <h2>🤖 AI Code Analyser</h2>
                    <p className="text-muted">Analyze your code with advanced AI-powered insights</p>
                </div>
            </div>

            {preloadBanner && (
                <div className="gh-preload-banner">
                    {preloadBanner}
                    <button onClick={() => setPreloadBanner(null)}>✕</button>
                </div>
            )}

            <div className="demo-container">
                {/* Left Column - Code Editor + Output */}
                <div className="left-column">
                    {/* Code Editor */}
                    <div className="glass-card input-section">
                        <div className="section-header">
                            <h3>📝 Code Editor</h3>
                            <button 
                                className="btn btn-ghost btn-sm"
                                onClick={resetToDefault}
                                title="Reset to Hello World example"
                            >
                                🔄 Reset
                            </button>
                        </div>

                        <div className="input-controls">
                            <div className="control-group">
                                <label>Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    className="input"
                                >
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="cpp">C++</option>
                                    <option value="c">C</option>
                                </select>
                            </div>

                            <div className="control-group">
                                <label>Analysis Type</label>
                                <select
                                    value={analysisType}
                                    onChange={(e) => setAnalysisType(e.target.value)}
                                    className="input"
                                >
                                    <option value="code-smell">🔍 Code Smells</option>
                                    <option value="security">🔒 Security Scan</option>
                                    <option value="performance">⚡ Performance + Big-O</option>
                                    <option value="complexity">📊 Complexity</option>
                                    <option value="duplicates">🔄 Duplicates</option>
                                    <option value="pattern-analysis">🎯 Pattern Recognition</option>
                                    <option value="edge-cases">🧪 Edge Case Generator</option>
                                    <option value="before-after">🔀 Before vs After</option>
                                    <option value="test-generation">🧪 Generate Tests</option>
                                    <option value="full-review">📋 Full Review</option>
                                </select>
                            </div>
                        </div>

                        <div className="code-info">
                            <span className="code-stats">
                                {code.length} characters | {code.split('\n').length} lines
                            </span>
                        </div>

                        <div className="monaco-editor-wrapper">
                            <Editor
                                height="450px"
                                language={language === 'javascript' ? 'javascript' : language === 'python' ? 'python' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : 'javascript'}
                                value={code}
                                onChange={(value) => setCode(value || '')}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: true },
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    roundedSelection: true,
                                    scrollBeyondLastLine: false,
                                    readOnly: false,
                                    automaticLayout: true,
                                    padding: { top: 16, bottom: 16 },
                                    folding: true,
                                    renderWhitespace: 'selection',
                                    bracketPairColorization: { enabled: true },
                                    guides: {
                                        bracketPairs: true,
                                        indentation: true,
                                    },
                                    suggestOnTriggerCharacters: true,
                                    formatOnPaste: true,
                                    formatOnType: true,
                                }}
                            />
                        </div>

                        <div className="button-group">
                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !code.trim()}
                                className="btn btn-primary btn-analyze"
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner">⏳</span>
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🚀</span>
                                        <span>Analyze Code</span>
                                    </>
                                )}
                            </button>
                            
                            {(result || errorInfo) ? (
                                <button
                                    onClick={() => {
                                        setResult(null);
                                        setErrorInfo(null);
                                    }}
                                    className="btn btn-ghost"
                                >
                                    Clear Results
                                </button>
                            ) : (
                                <div className="btn-clear-placeholder"></div>
                            )}
                        </div>
                    </div>

                    {/* Output Section - Below Editor */}
                    {errorInfo && (
                        <div className="glass-card output-section error-section">
                            <h3>❌ Error Output</h3>
                            <div className="error-header">
                                <span className="error-icon">{errorInfo.icon}</span>
                                <div>
                                    <h4>{errorInfo.title}</h4>
                                    <span className={`badge badge-${errorInfo.type === 'validation' ? 'warning' : 'error'}`}>
                                        {errorInfo.type}
                                    </span>
                                </div>
                            </div>

                            <div className="error-message">
                                <p>{errorInfo.message}</p>
                            </div>

                            <div className="error-suggestions">
                                <h4>💡 How to Fix:</h4>
                                <ul>
                                    {errorInfo.suggestions.map((suggestion, index) => (
                                        <li key={index}>{suggestion}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="error-actions">
                                <button 
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setErrorInfo(null)}
                                >
                                    Dismiss
                                </button>
                                {errorInfo.type === 'validation' && (
                                    <button 
                                        className="btn btn-accent btn-sm"
                                        onClick={resetToDefault}
                                    >
                                        Load Example Code
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="glass-card output-section loading-state">
                            <h3>⏳ Processing...</h3>
                            <div className="loading-content">
                                <span className="loading-spinner">⏳</span>
                                <p>Analyzing your code with AI...</p>
                                <div className="loading-bar">
                                    <div className="loading-progress"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {result && result.success && (
                        <div className="glass-card output-section success-state">
                            <h3>✅ Analysis Complete</h3>
                            <div className="success-content">
                                <div className="success-meta">
                                    <span className="badge badge-success">Success</span>
                                    {result.tokensUsed && (
                                        <span className="meta-item">
                                            🎫 {result.tokensUsed} tokens
                                        </span>
                                    )}
                                    {result.cost && (
                                        <span className="meta-item">
                                            💰 ${result.cost.toFixed(6)}
                                        </span>
                                    )}
                                </div>
                                <p>✨ Analysis completed successfully! Check the detailed review on the right →</p>
                            </div>
                        </div>
                    )}

                    {result && !result.success && (
                        <div className="glass-card output-section error-state">
                            <h3>❌ Analysis Failed</h3>
                            <div className="error-content">
                                <p>{result.error || 'Unknown error occurred'}</p>
                            </div>
                        </div>
                    )}

                    {!result && !errorInfo && !loading && (
                        <div className="glass-card output-section empty-state">
                            <h3>📤 Output</h3>
                            <div className="empty-content">
                                <span className="empty-icon">💬</span>
                                <p>Analysis output will appear here after you click "Analyze Code"</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Analysis Review */}
                <div className="right-column">
                    {result && result.success && (
                        <div className="glass-card results-section">
                            <h3>📊 Code Review</h3>

                            <div className="result-meta">
                                <span className="badge badge-success">✓ Success</span>
                                {result.tokensUsed && (
                                    <span className="meta-item">
                                        🎫 {result.tokensUsed} tokens
                                    </span>
                                )}
                                {result.cost && (
                                    <span className="meta-item">
                                        💰 ${result.cost.toFixed(6)}
                                    </span>
                                )}
                            </div>

                            {/* Human-readable output */}
                            <div className="result-human">
                                {renderHumanReadableResult(result.data, analysisType)}
                            </div>

                            {/* Raw JSON (collapsible) */}
                            <details className="raw-json-details">
                                <summary>View Raw JSON Response</summary>
                                <div className="result-data">
                                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                                </div>
                            </details>
                        </div>
                    )}

                    {result && !result.success && (
                        <div className="glass-card error-section">
                            <h3>❌ Analysis Failed</h3>
                            <div className="error-message">
                                <p>{result.error || 'Unknown error occurred'}</p>
                            </div>
                        </div>
                    )}

                    {!result && !loading && (
                        <div className="glass-card empty-review">
                            <div className="empty-content">
                                <span className="empty-icon">🤖</span>
                                <h3>AI Code Analyser</h3>
                                <p>Detailed analysis and suggestions will appear here</p>
                                <div className="empty-features">
                                    <div className="feature-item">
                                        <span>🔍</span>
                                        <span>Code Quality</span>
                                    </div>
                                    <div className="feature-item">
                                        <span>🔒</span>
                                        <span>Security</span>
                                    </div>
                                    <div className="feature-item">
                                        <span>⚡</span>
                                        <span>Performance</span>
                                    </div>
                                    <div className="feature-item">
                                        <span>🧪</span>
                                        <span>Tests</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="glass-card results-section skeleton-loading">
                            <div className="loading-state-overlay">
                                <div className="skeleton skeleton-title"></div>
                                <div className="skeleton skeleton-box"></div>
                                <div className="skeleton skeleton-text"></div>
                                <div className="skeleton skeleton-text"></div>
                                <div className="skeleton skeleton-card"></div>
                                <div className="skeleton skeleton-card"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AIDemo;
