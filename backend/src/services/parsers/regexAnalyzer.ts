import { StaticPatternMatch, DuplicateBlock } from './baseParser';

export class RegexAnalyzer {
    static analyzePatterns(code: string, language: string): StaticPatternMatch[] {
        const matches: StaticPatternMatch[] = [];
        const lines = code.split('\n');

        lines.forEach((lineText, idx) => {
            const lineNum = idx + 1;
            const trimmed = lineText.trim();

            // 1. Console / debugging logs left behind
            if (/(console\.(log|debug|warn|error|trace|info)|print\(|System\.out\.println)/.test(trimmed)) {
                matches.push({
                    type: 'debugging-log',
                    line: lineNum,
                    snippet: trimmed.slice(0, 100),
                    severity: 'low',
                    message: 'Debugging or print statement detected; verify whether this belongs in production code.',
                });
            }

            // 2. Sensitive / hardcoded secrets pattern
            if (/(password|secret|api[_-]?key|auth[_-]?token|private[_-]?key)\s*[:=]\s*["'][^"']{6,}["']/i.test(trimmed)) {
                matches.push({
                    type: 'potential-hardcoded-secret',
                    line: lineNum,
                    snippet: trimmed.slice(0, 100),
                    severity: 'critical',
                    message: 'Potential secret, API key, or credential found hardcoded in string literal.',
                });
            }

            // 3. Dangerous eval / unsafe functions
            if (/\b(eval\s*\(|new\s+Function\s*\(|dangerouslySetInnerHTML|innerHTML\s*=)/.test(trimmed)) {
                matches.push({
                    type: 'unsafe-execution',
                    line: lineNum,
                    snippet: trimmed.slice(0, 100),
                    severity: 'high',
                    message: 'Potential security vulnerability: dynamic code evaluation or direct HTML injection pattern.',
                });
            }

            // 4. TODO / FIXME markers
            if (/\/\/\s*(TODO|FIXME|HACK|XXX)|\b#\s*(TODO|FIXME|HACK|XXX)/i.test(trimmed)) {
                matches.push({
                    type: 'todo-marker',
                    line: lineNum,
                    snippet: trimmed.slice(0, 100),
                    severity: 'low',
                    message: 'Unresolved technical debt marker (TODO/FIXME) present.',
                });
            }

            // 5. TypeScript loose types
            if (language.toLowerCase().includes('typescript') || language.toLowerCase() === 'ts') {
                if (/:\s*any\b/.test(trimmed)) {
                    matches.push({
                        type: 'loose-typing',
                        line: lineNum,
                        snippet: trimmed.slice(0, 100),
                        severity: 'medium',
                        message: 'Explicit `any` type used; consider defining a precise interface or generic constraint.',
                    });
                }
            }
        });

        return matches;
    }

    static findDuplicates(code: string, minBlockLines: number = 4): DuplicateBlock[] {
        const rawLines = code.split('\n');
        const normalized = rawLines.map(l => l.trim().replace(/\s+/g, ' '));
        const duplicates: DuplicateBlock[] = [];

        // Simple rolling window string fingerprinting
        const blocks: Map<string, number[]> = new Map();

        for (let i = 0; i <= normalized.length - minBlockLines; i++) {
            const slice = normalized.slice(i, i + minBlockLines).filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('*'));
            if (slice.length < minBlockLines) continue;

            const fingerprint = slice.join('\n');
            if (fingerprint.length < 25) continue; // Skip trivial blocks like braces

            const existing = blocks.get(fingerprint) || [];
            existing.push(i + 1);
            blocks.set(fingerprint, existing);
        }

        for (const [, startLines] of blocks.entries()) {
            if (startLines.length > 1) {
                // Pick the first two distinct instances
                const startA = startLines[0];
                const startB = startLines[1];
                if (Math.abs(startA - startB) >= minBlockLines) {
                    duplicates.push({
                        blockA: { startLine: startA, endLine: startA + minBlockLines - 1 },
                        blockB: { startLine: startB, endLine: startB + minBlockLines - 1 },
                        similarity: 1.0,
                    });
                }
            }
        }

        return duplicates.slice(0, 5); // Return top matches
    }
}
