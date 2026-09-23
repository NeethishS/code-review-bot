import { BaseParser, StaticAnalysisResult } from './parsers/baseParser';
import { JsTsParser } from './parsers/jstsParser';
import { RegexAnalyzer } from './parsers/regexAnalyzer';

class StaticAnalyzer {
    private jsTsParser: JsTsParser;

    constructor() {
        this.jsTsParser = new JsTsParser();
    }

    /**
     * Analyze code statically and extract structural facts
     */
    analyze(code: string, language: string): StaticAnalysisResult {
        const langLower = (language || 'javascript').toLowerCase();

        if (
            langLower.includes('javascript') ||
            langLower.includes('typescript') ||
            langLower === 'js' ||
            langLower === 'ts' ||
            langLower === 'jsx' ||
            langLower === 'tsx'
        ) {
            return this.jsTsParser.parse(code, language);
        }

        // Fallback generic parser for other languages (Python, Java, Go, C++, etc.)
        return this.genericFallbackParse(code, language);
    }

    /**
     * Format static analysis results into an objective, factual prompt context for Groq
     */
    formatForPrompt(results: StaticAnalysisResult): string {
        const lines: string[] = [];
        lines.push('--- VERIFIED STATIC CODE OBSERVATIONS (Pre-Analysis) ---');

        // Metrics
        lines.push(`- Complexity & Sizing: ${results.metrics.totalLines} lines (${results.metrics.codeLines} code, ${results.metrics.commentLines} comments), Cyclomatic Complexity: ~${results.metrics.cyclomaticComplexity}, Function count: ${results.metrics.functionCount}`);

        // Potentially unused declarations (with balanced, cautious wording)
        if (results.potentiallyUnusedDeclarations.length > 0) {
            lines.push('- Potentially Unused Declarations (Within analyzed snippet):');
            results.potentiallyUnusedDeclarations.forEach(item => {
                lines.push(`  * Line ${item.line}: ${item.type} '${item.name}' -> ${item.observation}`);
            });
            lines.push('  (Note for Reviewer: Assess whether any flagged functions are intended public APIs, exported helpers, or framework entrypoints before suggesting removal.)');
        }

        // Unreachable code
        if (results.unreachableCode.length > 0) {
            lines.push('- Dead / Unreachable Code:');
            results.unreachableCode.forEach(item => {
                lines.push(`  * Line ${item.line}: ${item.reason}`);
            });
        }

        // Static Patterns
        if (results.patterns.length > 0) {
            lines.push('- Detected Code Hygiene & Security Flags:');
            results.patterns.forEach(item => {
                lines.push(`  * Line ${item.line} [${item.severity.toUpperCase()}]: ${item.message} ("${item.snippet}")`);
            });
        }

        // Duplicates
        if (results.duplicateBlocks.length > 0) {
            lines.push('- Duplicate / Repetitive Blocks:');
            results.duplicateBlocks.forEach(dup => {
                lines.push(`  * Block lines ${dup.blockA.startLine}-${dup.blockA.endLine} appears identical to lines ${dup.blockB.startLine}-${dup.blockB.endLine}`);
            });
        }

        lines.push('-------------------------------------------------------');
        return lines.join('\n');
    }

    private genericFallbackParse(code: string, language: string): StaticAnalysisResult {
        const lines = code.split('\n');
        const patterns = RegexAnalyzer.analyzePatterns(code, language);
        const duplicateBlocks = RegexAnalyzer.findDuplicates(code);

        let codeLines = 0;
        let commentLines = 0;
        let blankLines = 0;

        lines.forEach(l => {
            const t = l.trim();
            if (!t) blankLines++;
            else if (t.startsWith('#') || t.startsWith('//') || t.startsWith('/*')) commentLines++;
            else codeLines++;
        });

        return {
            language,
            metrics: {
                totalLines: lines.length,
                codeLines,
                commentLines,
                blankLines,
                functionCount: (code.match(/\b(def|func|fn|function|class)\s+[a-zA-Z0-9_]+/g) || []).length,
                maxNestingDepth: 1,
                cyclomaticComplexity: (code.match(/\b(if|elif|else|for|while|switch|case|catch)\b/g) || []).length + 1,
            },
            potentiallyUnusedDeclarations: [],
            unreachableCode: [],
            patterns,
            duplicateBlocks,
            functions: [],
        };
    }
}

export { StaticAnalysisResult } from './parsers/baseParser';
export const staticAnalyzer = new StaticAnalyzer();
export default staticAnalyzer;
