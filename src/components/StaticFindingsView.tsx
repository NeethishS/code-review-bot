import React from 'react';
import type { StaticAnalysisResult } from '../types';
import './StaticFindingsView.css';

interface StaticFindingsViewProps {
    staticAnalysis?: StaticAnalysisResult;
    compact?: boolean;
    title?: string;
}

export const StaticFindingsView: React.FC<StaticFindingsViewProps> = ({
    staticAnalysis,
    compact = false,
    title = '⚡ Verified Static Observations',
}) => {
    if (!staticAnalysis) return null;

    const {
        potentiallyUnusedDeclarations = [],
        patterns = [],
        unreachableCode = [],
    } = staticAnalysis;

    // Filter out only actionable static findings
    const unusedItems = potentiallyUnusedDeclarations.map(decl => ({
        kind: decl.type === 'variable' ? 'Unused Variable' : decl.type === 'function' ? 'Unused Function' : 'Unused Declaration',
        name: decl.name,
        severity: (decl.isExported ? 'low' : 'medium') as 'low' | 'medium' | 'high' | 'critical',
        line: decl.line,
        message: decl.observation,
        snippet: undefined as string | undefined,
    }));

    const patternItems = patterns.map(p => ({
        kind: p.type === 'unsafe-os-call' 
            ? 'Potentially Unsafe OS / Process Call' 
            : p.type === 'unsafe-execution'
            ? 'Unsafe Eval / Dynamic Execution'
            : p.type === 'potential-hardcoded-secret'
            ? 'Potential Hardcoded Secret'
            : p.type === 'todo-marker'
            ? 'TODO / Technical Debt'
            : p.type === 'loose-typing'
            ? 'Loose Typing (any)'
            : 'Static Pattern',
        name: undefined,
        severity: p.severity,
        line: p.line,
        message: p.message,
        snippet: p.snippet,
    }));

    const unreachableItems = unreachableCode.map(u => ({
        kind: 'Unreachable Code',
        name: undefined,
        severity: 'low' as 'low' | 'medium' | 'high' | 'critical',
        line: u.line,
        message: u.reason,
        snippet: undefined as string | undefined,
    }));

    const allFindings = [...patternItems, ...unusedItems, ...unreachableItems];

    if (allFindings.length === 0) {
        return null;
    }

    if (compact) {
        return (
            <details className="static-findings-compact">
                <summary>
                    <span>⚡ Static Code Facts ({allFindings.length})</span>
                </summary>
                <div className="static-findings-compact-body">
                    {allFindings.map((item, idx) => (
                        <div key={idx} className={`static-finding-item severity-${item.severity}`}>
                            <div className="static-finding-top">
                                <span className={`static-severity-badge ${item.severity}`}>
                                    {item.severity}
                                </span>
                                <span className="static-finding-kind">{item.kind}</span>
                                {item.line && <span className="static-finding-line">Line {item.line}</span>}
                            </div>
                            <p className="static-finding-msg">{item.message}</p>
                            {item.snippet && <div className="static-finding-snippet">{item.snippet}</div>}
                        </div>
                    ))}
                </div>
            </details>
        );
    }

    return (
        <div className="static-findings-container">
            <div className="static-findings-header">
                <h4>
                    <span>⚡</span>
                    <span>{title}</span>
                </h4>
                <span className="static-findings-badge-count">
                    {allFindings.length} observation{allFindings.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="static-findings-list">
                {allFindings.map((item, idx) => (
                    <div key={idx} className={`static-finding-item severity-${item.severity}`}>
                        <div className="static-finding-top">
                            <span className={`static-severity-badge ${item.severity}`}>
                                {item.severity}
                            </span>
                            <span className="static-finding-kind">{item.kind}</span>
                            {item.line && <span className="static-finding-line">📍 Line {item.line}</span>}
                        </div>
                        <p className="static-finding-msg">{item.message}</p>
                        {item.snippet && <div className="static-finding-snippet">{item.snippet}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StaticFindingsView;
