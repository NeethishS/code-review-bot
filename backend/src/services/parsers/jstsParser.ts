import * as acorn from 'acorn';
// @ts-ignore
import * as walk from 'acorn-walk';
import { BaseParser, StaticAnalysisResult, FunctionMetric } from './baseParser';
import { RegexAnalyzer } from './regexAnalyzer';

export class JsTsParser implements BaseParser {
    parse(code: string, language: string): StaticAnalysisResult {
        const lines = code.split('\n');
        const totalLines = lines.length;
        let codeLines = 0;
        let commentLines = 0;
        let blankLines = 0;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) {
                blankLines++;
            } else if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                commentLines++;
            } else {
                codeLines++;
            }
        });

        const declaredFunctions = new Map<string, { line: number; paramCount: number; isExported: boolean; node: any }>();
        const identifierReferences = new Map<string, number>();
        const unreachableCode: Array<{ line: number; reason: string }> = [];
        let cyclomaticComplexity = 1;
        let maxNesting = 0;
        const functionMetrics: FunctionMetric[] = [];

        try {
            // Parse JavaScript / modern syntax using Acorn (tolerant options)
            const ast = acorn.parse(code, {
                ecmaVersion: 'latest',
                sourceType: 'module',
                locations: true,
                allowHashBang: true,
                allowReturnOutsideFunction: true,
                allowImportExportEverywhere: true,
                allowAwaitOutsideFunction: true,
            }) as any;

            // First pass: collect declarations and branch metrics
            walk.ancestor(ast, {
                FunctionDeclaration(node: any, ancestors: any[]) {
                    const name = node.id ? node.id.name : 'anonymous';
                    const line = node.loc ? node.loc.start.line : 1;
                    const paramCount = node.params ? node.params.length : 0;
                    const parent = ancestors[ancestors.length - 2];
                    const isExported = parent && (parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportDefaultDeclaration');

                    declaredFunctions.set(name, { line, paramCount, isExported, node });
                },
                FunctionExpression(node: any) {
                    if (node.id) {
                        const name = node.id.name;
                        const line = node.loc ? node.loc.start.line : 1;
                        declaredFunctions.set(name, { line, paramCount: node.params?.length || 0, isExported: false, node });
                    }
                },
                ArrowFunctionExpression(node: any, ancestors: any[]) {
                    const parent = ancestors[ancestors.length - 2];
                    if (parent && parent.type === 'VariableDeclarator' && parent.id?.name) {
                        const name = parent.id.name;
                        const line = node.loc ? node.loc.start.line : 1;
                        const grandParent = ancestors[ancestors.length - 3];
                        const greatGrandParent = ancestors[ancestors.length - 4];
                        const isExported = (grandParent && grandParent.type === 'ExportNamedDeclaration') ||
                                          (greatGrandParent && greatGrandParent.type === 'ExportNamedDeclaration');
                        declaredFunctions.set(name, { line, paramCount: node.params?.length || 0, isExported: !!isExported, node });
                    }
                },
                Identifier(node: any, ancestors: any[]) {
                    const name = node.name;
                    const parent = ancestors[ancestors.length - 2];

                    // Don't count identifier when it's declaring the function itself
                    if (parent && (parent.type === 'FunctionDeclaration' && parent.id === node)) {
                        return;
                    }
                    if (parent && parent.type === 'VariableDeclarator' && parent.id === node) {
                        return;
                    }

                    identifierReferences.set(name, (identifierReferences.get(name) || 0) + 1);
                },
                IfStatement(node: any, ancestors: any[]) {
                    cyclomaticComplexity++;
                    maxNesting = Math.max(maxNesting, ancestors.length);
                },
                ForStatement(node: any, ancestors: any[]) {
                    cyclomaticComplexity++;
                    maxNesting = Math.max(maxNesting, ancestors.length);
                },
                ForInStatement(node: any, ancestors: any[]) {
                    cyclomaticComplexity++;
                    maxNesting = Math.max(maxNesting, ancestors.length);
                },
                ForOfStatement(node: any, ancestors: any[]) {
                    cyclomaticComplexity++;
                    maxNesting = Math.max(maxNesting, ancestors.length);
                },
                WhileStatement(node: any, ancestors: any[]) {
                    cyclomaticComplexity++;
                    maxNesting = Math.max(maxNesting, ancestors.length);
                },
                DoWhileStatement(node: any, ancestors: any[]) {
                    cyclomaticComplexity++;
                    maxNesting = Math.max(maxNesting, ancestors.length);
                },
                CatchClause() {
                    cyclomaticComplexity++;
                },
                ConditionalExpression() {
                    cyclomaticComplexity++;
                },
                LogicalExpression() {
                    cyclomaticComplexity++;
                },
                BlockStatement(node: any) {
                    // Check for unreachable code after return/throw/break/continue
                    const body = node.body || [];
                    let hasTerminated = false;
                    for (const stmt of body) {
                        if (hasTerminated) {
                            const line = stmt.loc?.start?.line || 1;
                            unreachableCode.push({
                                line,
                                reason: 'Unreachable code detected directly following a return, throw, break, or continue statement.',
                            });
                            break;
                        }
                        if (
                            stmt.type === 'ReturnStatement' ||
                            stmt.type === 'ThrowStatement' ||
                            stmt.type === 'BreakStatement' ||
                            stmt.type === 'ContinueStatement'
                        ) {
                            hasTerminated = true;
                        }
                    }
                },
            });

        } catch (err: any) {
            // In case of syntax variance (e.g. raw JSX or untranspiled TS decorators), fallback gracefully to regex heuristics
            this.fallbackRegexHeuristics(code, declaredFunctions, identifierReferences, unreachableCode);
        }

        // Build cautious observations for potentially unused declarations
        const potentiallyUnusedDeclarations: Array<{
            name: string;
            type: 'function' | 'variable' | 'class';
            line: number;
            isExported: boolean;
            observation: string;
        }> = [];

        declaredFunctions.forEach((meta, name) => {
            const refCount = identifierReferences.get(name) || 0;
            const length = meta.node?.loc ? (meta.node.loc.end.line - meta.node.loc.start.line + 1) : 1;

            functionMetrics.push({
                name,
                line: meta.line,
                length,
                parameterCount: meta.paramCount,
                cyclomaticComplexity: 1, // baseline
                isExported: meta.isExported,
                localCallsCount: refCount,
            });

            if (refCount === 0) {
                potentiallyUnusedDeclarations.push({
                    name,
                    type: 'function',
                    line: meta.line,
                    isExported: meta.isExported,
                    observation: meta.isExported
                        ? `Exported function '${name}' has no direct local invocations within this file (expected for public library/API utilities).`
                        : `Function '${name}' is declared but not referenced within this analyzed snippet. Verify if it is invoked dynamically, exported, or called by an external module/test before removing.`,
                });
            }
        });

        const patterns = RegexAnalyzer.analyzePatterns(code, language);
        const duplicateBlocks = RegexAnalyzer.findDuplicates(code);

        return {
            language,
            metrics: {
                totalLines,
                codeLines,
                commentLines,
                blankLines,
                functionCount: declaredFunctions.size,
                maxNestingDepth: Math.max(1, Math.floor(maxNesting / 3)),
                cyclomaticComplexity,
            },
            potentiallyUnusedDeclarations,
            unreachableCode,
            patterns,
            duplicateBlocks,
            functions: functionMetrics,
        };
    }

    private fallbackRegexHeuristics(
        code: string,
        declaredFunctions: Map<string, { line: number; paramCount: number; isExported: boolean; node: any }>,
        identifierReferences: Map<string, number>,
        unreachableCode: Array<{ line: number; reason: string }>
    ) {
        const lines = code.split('\n');

        lines.forEach((line, idx) => {
            const lineNum = idx + 1;
            const funcMatch = line.match(/(?:function\s+([a-zA-Z0-9_$]+)|const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>)/);
            if (funcMatch) {
                const name = funcMatch[1] || funcMatch[2];
                const isExported = line.includes('export');
                declaredFunctions.set(name, { line: lineNum, paramCount: 0, isExported, node: null });
            }

            // Unreachable code heuristic
            if (/^\s*(return|throw)\b/.test(line)) {
                const nextLine = lines[idx + 1]?.trim();
                if (nextLine && !nextLine.startsWith('}') && !nextLine.startsWith('//')) {
                    unreachableCode.push({
                        line: lineNum + 1,
                        reason: 'Statement immediately follows a return/throw keyword.',
                    });
                }
            }
        });

        // Identifier count check
        declaredFunctions.forEach((_, name) => {
            const regex = new RegExp(`\\b${name}\\b`, 'g');
            const matches = code.match(regex) || [];
            // If it appears only once, it's just the declaration
            if (matches.length > 1) {
                identifierReferences.set(name, matches.length - 1);
            }
        });
    }
}
