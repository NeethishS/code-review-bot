import { useState, useRef, useEffect } from 'react';
import apiService from '../services/apiService';
import './CodeExplainer.css';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    relevantFile?: string;
    relevantLines?: { start: number; end: number };
    codeChunk?: string;
    source?: string;
    timestamp: Date;
}

interface IndexedFile {
    name: string;
    language: string;
    size: number;
}

const LANG_MAP: Record<string, string> = {
    js: 'javascript', ts: 'typescript', py: 'python',
    java: 'java', cpp: 'cpp', c: 'c', cs: 'csharp',
    go: 'go', rs: 'rust', rb: 'ruby', php: 'php',
    html: 'html', css: 'css', json: 'json', md: 'markdown',
};

function generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function CodeExplainer() {
    const [sessionId] = useState(generateSessionId);
    const [indexedFiles, setIndexedFiles] = useState<IndexedFile[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [query, setQuery] = useState('');
    const [isIndexing, setIsIndexing] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [expandedChunk, setExpandedChunk] = useState<number | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const detectLanguage = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        return LANG_MAP[ext] || 'plaintext';
    };

    const processFiles = async (fileList: FileList) => {
        const files: Array<{ name: string; language: string; content: string }> = [];
        const fileInfos: IndexedFile[] = [];

        for (const file of Array.from(fileList)) {
            if (file.size > 200 * 1024) continue; // skip >200KB
            const content = await file.text();
            const language = detectLanguage(file.name);
            files.push({ name: file.name, language, content });
            fileInfos.push({ name: file.name, language, size: file.size });
        }

        if (files.length === 0) return;

        setIsIndexing(true);
        try {
            const result = await apiService.explainIndexFiles(sessionId, files);
            if (result.success) {
                setIndexedFiles(prev => {
                    const existing = new Set(prev.map(f => f.name));
                    const newFiles = fileInfos.filter(f => !existing.has(f.name));
                    return [...prev, ...newFiles];
                });
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Indexed ${files.length} file${files.length > 1 ? 's' : ''} (${result.totalChunks} chunks). Ask me anything about the code!`,
                    timestamp: new Date(),
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Failed to index files: ${result.error}`,
                    timestamp: new Date(),
                }]);
            }
        } finally {
            setIsIndexing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
        e.target.value = '';
    };

    const handleSend = async () => {
        const trimmed = query.trim();
        if (!trimmed || isQuerying) return;

        if (indexedFiles.length === 0) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Please upload some code files first before asking questions.',
                timestamp: new Date(),
            }]);
            return;
        }

        const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setIsQuerying(true);

        try {
            const result = await apiService.explainQuery(sessionId, trimmed);
            const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: result.success ? result.explanation : `Error: ${result.error}`,
                relevantFile: result.relevantFile,
                relevantLines: result.relevantLines,
                codeChunk: result.codeChunk,
                source: result.source,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Request failed: ${err.message}`,
                timestamp: new Date(),
            }]);
        } finally {
            setIsQuerying(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearSession = async () => {
        await apiService.explainClearSession(sessionId);
        setIndexedFiles([]);
        setMessages([]);
    };

    const formatTime = (d: Date) =>
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="explainer-layout">
            {/* Left panel — file upload */}
            <aside className="explainer-sidebar">
                <div className="explainer-sidebar-header">
                    <h2>💬 Code Explainer</h2>
                    <p>Upload files, then ask questions about the code.</p>
                </div>

                <div
                    className={`explainer-dropzone ${isDragging ? 'dragging' : ''} ${isIndexing ? 'indexing' : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileInput}
                    />
                    {isIndexing ? (
                        <><span className="explainer-spin">⚙️</span><p>Indexing files...</p></>
                    ) : (
                        <><span>📁</span><p>Drop files here or click to browse</p><small>Max 200KB per file</small></>
                    )}
                </div>

                {indexedFiles.length > 0 && (
                    <div className="explainer-file-list">
                        <div className="explainer-file-list-header">
                            <span>Indexed Files ({indexedFiles.length})</span>
                            <button className="explainer-clear-btn" onClick={handleClearSession}>Clear All</button>
                        </div>
                        {indexedFiles.map((f, i) => (
                            <div key={i} className="explainer-file-item">
                                <span className="explainer-file-icon">📄</span>
                                <div className="explainer-file-info">
                                    <span className="explainer-file-name">{f.name}</span>
                                    <span className="explainer-file-meta">{f.language} · {(f.size / 1024).toFixed(1)}KB</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {indexedFiles.length === 0 && (
                    <div className="explainer-tips">
                        <p>💡 Tips:</p>
                        <ul>
                            <li>Upload any code files (.js, .py, .java, .cpp, etc.)</li>
                            <li>Ask "What does this function do?"</li>
                            <li>Ask "Explain the main logic"</li>
                            <li>Ask "Are there any bugs here?"</li>
                        </ul>
                    </div>
                )}
            </aside>

            {/* Right panel — chat */}
            <div className="explainer-chat">
                <div className="explainer-chat-messages">
                    {messages.length === 0 && (
                        <div className="explainer-empty">
                            <span>💬</span>
                            <p>Upload code files on the left, then ask questions here.</p>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`explainer-message ${msg.role}`}>
                            <div className="explainer-message-bubble">
                                <p>{msg.content}</p>

                                {msg.relevantFile && (
                                    <div className="explainer-source-tag">
                                        📄 {msg.relevantFile}
                                        {msg.relevantLines && ` · lines ${msg.relevantLines.start}–${msg.relevantLines.end}`}
                                        {msg.source === 'rapidapi-fallback' && <span className="explainer-fallback-badge">fallback</span>}
                                    </div>
                                )}

                                {msg.codeChunk && (
                                    <div className="explainer-chunk-toggle">
                                        <button onClick={() => setExpandedChunk(expandedChunk === i ? null : i)}>
                                            {expandedChunk === i ? '▲ Hide code' : '▼ Show relevant code'}
                                        </button>
                                        {expandedChunk === i && (
                                            <pre className="explainer-code-chunk"><code>{msg.codeChunk}</code></pre>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className="explainer-message-time">{formatTime(msg.timestamp)}</span>
                        </div>
                    ))}

                    {isQuerying && (
                        <div className="explainer-message assistant">
                            <div className="explainer-message-bubble explainer-typing">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                <div className="explainer-input-row">
                    <textarea
                        ref={textareaRef}
                        className="explainer-input"
                        placeholder="Ask about the code... (Enter to send, Shift+Enter for newline)"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                        disabled={isQuerying}
                    />
                    <button
                        className="explainer-send-btn"
                        onClick={handleSend}
                        disabled={isQuerying || !query.trim()}
                    >
                        {isQuerying ? '⏳' : '➤'}
                    </button>
                </div>
            </div>
        </div>
    );
}
