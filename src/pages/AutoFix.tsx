import { useState } from 'react';
import apiService from '../services/apiService';
import './AutoFix.css';

interface DiffLine {
    type: 'add' | 'remove' | 'context';
    content: string;
    lineNum?: number;
}

interface AutoFixResult {
    originalCode: string;
    fixedCode: string;
    issues: string[];
    fixes: string[];
    explanation: string;
}

const LANGUAGE_OPTIONS = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
];

function generateDiff(original: string, fixed: string): DiffLine[] {
    const origLines = original.split('\n');
    const fixedLines = fixed.split('\n');
    const diff: DiffLine[] = [];

    const maxLen = Math.max(origLines.length, fixedLines.length);

    for (let i = 0; i < maxLen; i++) {
        const origLine = origLines[i] || '';
        const fixedLine = fixedLines[i] || '';

        if (origLine === fixedLine) {
            diff.push({ type: 'context', content: origLine, lineNum: i + 1 });
        } else {
            if (origLine) {
                diff.push({ type: 'remove', content: origLine, lineNum: i + 1 });
            }
            if (fixedLine) {
                diff.push({ type: 'add', content: fixedLine, lineNum: i + 1 });
            }
        }
    }

    return diff;
}

export default function AutoFix() {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AutoFixResult | null>(null);
    const [diff, setDiff] = useState<DiffLine[]>([]);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'diff' | 'side-by-side' | 'fixed'>('diff');

    const handleAnalyze = async () => {
        if (!code.trim()) {
            setError('Please enter some code');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);
        setDiff([]);

        try {
            const response = await apiService.post('/ai/auto-fix', {
                code,
                language,
            });

            if (response.success) {
                const data = response.data as AutoFixResult;
                setResult(data);
                setDiff(generateDiff(data.originalCode, data.fixedCode));
            } else {
                setError(response.error || 'Failed to auto-fix code');
            }
        } catch (err: any) {
            setError(err.message || 'Error analyzing code');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="autofix-container">
            <div className="autofix-header">
                <h2>🔧 AI Auto-Fix</h2>
                <p>Paste buggy code, get fixed code with visual diff</p>
            </div>

            <div className="autofix-layout">
                {/* Left panel - Input */}
                <div className="autofix-input-panel">
                    <div className="autofix-controls">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="autofix-select"
                        >
                            {LANGUAGE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleAnalyze}
                            disabled={loading || !code.trim()}
                            className="autofix-btn-analyze"
                        >
                            {loading ? '⏳ Fixing...' : '🔧 Auto-Fix'}
                        </button>
                    </div>

                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste your buggy code here..."
                        className="autofix-textarea"
                        disabled={loading}
                    />

                    {error && <div className="autofix-error">⚠️ {error}</div>}
                </div>

                {/* Right panel - Output */}
                <div className="autofix-output-panel">
                    {!result ? (
                        <div className="autofix-empty">
                            <span>🔍</span>
                            <p>Paste code on the left and click "Auto-Fix" to see the magic</p>
                        </div>
                    ) : (
                        <>
                            {/* View mode tabs */}
                            <div className="autofix-tabs">
                                <button
                                    className={`autofix-tab ${viewMode === 'diff' ? 'active' : ''}`}
                                    onClick={() => setViewMode('diff')}
                                >
                                    📊 Diff View
                                </button>
                                <button
                                    className={`autofix-tab ${viewMode === 'side-by-side' ? 'active' : ''}`}
                                    onClick={() => setViewMode('side-by-side')}
                                >
                                    ↔️ Side-by-Side
                                </button>
                                <button
                                    className={`autofix-tab ${viewMode === 'fixed' ? 'active' : ''}`}
                                    onClick={() => setViewMode('fixed')}
                                >
                                    ✅ Fixed Code
                                </button>
                            </div>

                            {/* Diff View */}
                            {viewMode === 'diff' && (
                                <div className="autofix-diff-view">
                                    <div className="autofix-diff-header">
                                        <span>📝 Changes</span>
                                        <button
                                            className="autofix-copy-btn"
                                            onClick={() => copyToClipboard(result.fixedCode)}
                                        >
                                            📋 Copy Fixed
                                        </button>
                                    </div>
                                    <div className="autofix-diff">
                                        {diff.map((line, idx) => (
                                            <div
                                                key={idx}
                                                className={`autofix-diff-line autofix-diff-${line.type}`}
                                            >
                                                <span className="autofix-diff-marker">
                                                    {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                                                </span>
                                                <span className="autofix-diff-content">{line.content}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Side-by-Side View */}
                            {viewMode === 'side-by-side' && (
                                <div className="autofix-side-by-side">
                                    <div className="autofix-side">
                                        <div className="autofix-side-header">❌ Original</div>
                                        <pre className="autofix-code">{result.originalCode}</pre>
                                    </div>
                                    <div className="autofix-side">
                                        <div className="autofix-side-header">✅ Fixed</div>
                                        <pre className="autofix-code">{result.fixedCode}</pre>
                                    </div>
                                </div>
                            )}

                            {/* Fixed Code View */}
                            {viewMode === 'fixed' && (
                                <div className="autofix-fixed-view">
                                    <div className="autofix-fixed-header">
                                        <span>✅ Fixed Code</span>
                                        <button
                                            className="autofix-copy-btn"
                                            onClick={() => copyToClipboard(result.fixedCode)}
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                    <pre className="autofix-code">{result.fixedCode}</pre>
                                </div>
                            )}

                            {/* Issues & Fixes */}
                            <div className="autofix-summary">
                                <div className="autofix-summary-section">
                                    <h4>🐛 Issues Found ({result.issues.length})</h4>
                                    <ul>
                                        {result.issues.map((issue, idx) => (
                                            <li key={idx}>{issue}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="autofix-summary-section">
                                    <h4>✨ Fixes Applied ({result.fixes.length})</h4>
                                    <ul>
                                        {result.fixes.map((fix, idx) => (
                                            <li key={idx}>{fix}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="autofix-summary-section">
                                    <h4>📝 Explanation</h4>
                                    <p>{result.explanation}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
