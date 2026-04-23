import { useState, useRef, useCallback } from 'react';
import apiService from '../services/apiService';
import './UploadAnalyser.css';

const EXT_TO_LANG: Record<string, string> = {
    js: 'javascript', jsx: 'javascript',
    ts: 'javascript', tsx: 'javascript',
    py: 'python',
    java: 'java',
    cpp: 'cpp', cc: 'cpp', cxx: 'cpp',
    c: 'c', h: 'c',
};



type FileStatus = 'pending' | 'analyzing' | 'done' | 'error' | 'skipped';

interface FileEntry {
    id: string;
    name: string;
    path: string;
    language: string;
    size: number;
    status: FileStatus;
    result?: any;
    error?: string;
    tokensUsed?: number;
}

function UploadAnalyser() {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [analysisType, setAnalysisType] = useState('full-review');
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const processFileList = async (rawFiles: FileList) => {
        const entries: FileEntry[] = [];
        for (const file of Array.from(rawFiles)) {
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            const language = EXT_TO_LANG[ext];
            if (!language) continue; // skip unsupported
            if (file.size > 100_000) continue; // skip >100KB
            const content = await file.text();
            entries.push({
                id: `${file.name}-${Date.now()}-${Math.random()}`,
                name: file.name,
                path: (file as any).webkitRelativePath || file.name,
                language,
                size: file.size,
                status: 'pending',
                result: content, // temporarily store content
            });
        }
        return entries;
    };

    const handleFiles = async (rawFiles: FileList) => {
        const entries = await processFileList(rawFiles);
        if (entries.length === 0) return;
        setFiles(prev => [...prev, ...entries]);
        setDone(false);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFiles(e.target.files);
        e.target.value = '';
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    }, []);

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearAll = () => {
        setFiles([]);
        setDone(false);
    };

    const runAnalysis = async () => {
        const pending = files.filter(f => f.status === 'pending');
        if (pending.length === 0) return;
        setRunning(true);
        setDone(false);

        for (const file of pending) {
            const code = file.result as string; // content stored here before analysis

            // Mark as analyzing
            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'analyzing' } : f));

            try {
                let response: any;
                switch (analysisType) {
                    case 'code-smell': response = await apiService.analyzeCodeSmells(code, file.language); break;
                    case 'security': response = await apiService.scanSecurity(code, file.language); break;
                    case 'performance': response = await apiService.analyzePerformance(code, file.language); break;
                    case 'complexity': response = await apiService.analyzeComplexity(code, file.language); break;
                    case 'duplicates': response = await apiService.detectDuplicates(code, file.language); break;
                    case 'test-generation': response = await apiService.generateTests(code, file.language, 'jest'); break;
                    default: response = await apiService.fullReview(code, file.language);
                }

                if (response.success) {
                    // Save to DB
                    apiService.saveReview({
                        language: file.language,
                        analysis_type: analysisType,
                        code_snippet: code.slice(0, 2000),
                        result: response.data,
                        tokens_used: response.tokensUsed,
                        cost: response.cost,
                        success: true,
                    });

                    setFiles(prev => prev.map(f => f.id === file.id ? {
                        ...f,
                        status: 'done',
                        result: response.data,
                        tokensUsed: response.tokensUsed,
                    } : f));
                } else {
                    setFiles(prev => prev.map(f => f.id === file.id ? {
                        ...f,
                        status: 'error',
                        error: response.error || 'Analysis failed',
                        result: null,
                    } : f));
                }
            } catch (err: any) {
                setFiles(prev => prev.map(f => f.id === file.id ? {
                    ...f,
                    status: 'error',
                    error: err.message || 'Unexpected error',
                    result: null,
                } : f));
            }
        }

        setRunning(false);
        setDone(true);
    };

    const pendingCount = files.filter(f => f.status === 'pending').length;
    const doneCount = files.filter(f => f.status === 'done').length;
    const errorCount = files.filter(f => f.status === 'error').length;

    const renderResult = (file: FileEntry) => {
        if (!file.result || typeof file.result === 'string') return null;
        const data = file.result;
        const issues = data.issues || data.smells || data.vulnerabilities || [];
        const summary = data.summary || data._raw || '';

        return (
            <div className="file-result">
                {summary && <p className="result-summary">{typeof summary === 'string' ? summary.slice(0, 300) : ''}{summary.length > 300 ? '...' : ''}</p>}
                {issues.length > 0 && (
                    <div className="result-issues">
                        {issues.slice(0, 5).map((issue: any, i: number) => (
                            <div key={i} className={`result-issue severity-${issue.severity || 'info'}`}>
                                <span className={`severity-badge ${issue.severity || 'info'}`}>
                                    {(issue.severity || 'info').toUpperCase()}
                                </span>
                                <span className="issue-text">{issue.description || issue.message || issue.type}</span>
                            </div>
                        ))}
                        {issues.length > 5 && (
                            <p className="more-issues">+{issues.length - 5} more issues</p>
                        )}
                    </div>
                )}
                {issues.length === 0 && !summary && (
                    <p className="no-issues-text">✅ No issues found</p>
                )}
            </div>
        );
    };

    return (
        <div className="upload-analyser animate-fade-in">
            <div className="page-header">
                <div>
                    <h2>📁 Upload & Analyse</h2>
                    <p className="text-muted">Upload files or an entire folder — AI analyses each file automatically</p>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                className={`drop-zone ${dragging ? 'dragging' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
            >
                <div className="drop-zone-content">
                    <span className="drop-icon">📂</span>
                    <p className="drop-title">Drag & drop files or a folder here</p>
                    <p className="drop-subtitle">Supports: .js .jsx .ts .tsx .py .java .cpp .c .h</p>
                    <div className="drop-buttons">
                        <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                            📄 Select Files
                        </button>
                        <button className="btn btn-ghost" onClick={() => folderInputRef.current?.click()}>
                            📁 Select Folder
                        </button>
                    </div>
                </div>
                <input ref={fileInputRef} type="file" multiple accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.cc,.cxx,.c,.h" onChange={handleFileInput} style={{ display: 'none' }} />
                <input ref={folderInputRef} type="file" multiple onChange={handleFileInput} style={{ display: 'none' }}
                    // @ts-ignore
                    webkitdirectory="" directory="" />
            </div>

            {/* Controls */}
            {files.length > 0 && (
                <div className="upload-controls glass-card">
                    <div className="controls-left">
                        <div className="file-count-badges">
                            <span className="badge badge-neutral">{files.length} files</span>
                            {pendingCount > 0 && <span className="badge badge-warning">{pendingCount} pending</span>}
                            {doneCount > 0 && <span className="badge badge-success">{doneCount} done</span>}
                            {errorCount > 0 && <span className="badge badge-error">{errorCount} failed</span>}
                        </div>
                        <div className="analysis-type-select">
                            <label>Analysis:</label>
                            <select className="input" value={analysisType} onChange={e => setAnalysisType(e.target.value)} disabled={running}>
                                <option value="full-review">📋 Full Review</option>
                                <option value="code-smell">🔍 Code Smells</option>
                                <option value="security">🔒 Security</option>
                                <option value="performance">⚡ Performance</option>
                                <option value="complexity">📊 Complexity</option>
                                <option value="duplicates">🔄 Duplicates</option>
                                <option value="test-generation">🧪 Generate Tests</option>
                            </select>
                        </div>
                    </div>
                    <div className="controls-right">
                        <button className="btn btn-ghost" onClick={clearAll} disabled={running}>Clear All</button>
                        <button className="btn btn-primary" onClick={runAnalysis} disabled={running || pendingCount === 0}>
                            {running ? '⏳ Analysing...' : `🚀 Analyse ${pendingCount} File${pendingCount !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="file-list">
                    {files.map(file => (
                        <div key={file.id} className={`file-card glass-card status-${file.status}`}>
                            <div className="file-card-header" onClick={() => file.status === 'done' && setExpandedId(expandedId === file.id ? null : file.id)}>
                                <div className="file-info">
                                    <span className="file-icon">
                                        {file.status === 'pending' && '📄'}
                                        {file.status === 'analyzing' && '⏳'}
                                        {file.status === 'done' && '✅'}
                                        {file.status === 'error' && '❌'}
                                        {file.status === 'skipped' && '⏭️'}
                                    </span>
                                    <div className="file-details">
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-meta">
                                            {file.path !== file.name && <span className="file-path">{file.path}</span>}
                                            <span className="badge badge-neutral">{file.language}</span>
                                            <span className="file-size">{(file.size / 1024).toFixed(1)}KB</span>
                                            {file.tokensUsed && <span className="file-tokens">🎫 {file.tokensUsed} tokens</span>}
                                        </span>
                                    </div>
                                </div>
                                <div className="file-actions">
                                    {file.status === 'analyzing' && <span className="spinner-text">Analysing...</span>}
                                    {file.status === 'done' && (
                                        <span className="expand-hint">{expandedId === file.id ? '▲ Hide' : '▼ View Results'}</span>
                                    )}
                                    {file.status === 'error' && <span className="error-text">{file.error}</span>}
                                    {!running && (
                                        <button className="btn-icon" onClick={e => { e.stopPropagation(); removeFile(file.id); }}>✕</button>
                                    )}
                                </div>
                            </div>

                            {expandedId === file.id && file.status === 'done' && (
                                <div className="file-card-body">
                                    {renderResult(file)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {done && (
                <div className="done-banner glass-card">
                    <span>🎉</span>
                    <span>{doneCount} file{doneCount !== 1 ? 's' : ''} analysed successfully{errorCount > 0 ? `, ${errorCount} failed` : ''}. Results saved to database.</span>
                </div>
            )}

            {files.length === 0 && (
                <div className="upload-empty">
                    <p>No files selected yet. Drop files above or click "Select Files" / "Select Folder".</p>
                </div>
            )}
        </div>
    );
}

export default UploadAnalyser;
