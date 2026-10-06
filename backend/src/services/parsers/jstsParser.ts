import * as acorn from 'acorn';
// @ts-ignore
import * as walk from 'acorn-walk';
import { BaseParser, StaticAnalysisResult, FunctionMetric } from './baseParser';
import { RegexAnalyzer } from './regexAnalyzer';

function extractBindings(pattern: any): Array<{ name: string; line: number }> {
    const bindings: Array<{ name: string; line: number }> = [];
    if (!pattern) return bindings;

    function walkPattern(p: any) {
        if (!p) return;
        if (p.type === 'Identifier') {
            bindings.push({
                name: p.name,
                line: p.loc ? p.loc.start.line : 1,
            });
        } else if (p.type === 'AssignmentPattern') {
            walkPattern(p.left);
        } else if (p.type === 'RestElement') {
            walkPattern(p.argument);
        } else if (p.type === 'ObjectPattern') {
            for (const prop of p.properties || []) {
                if (prop.type === 'Property') {
                    walkPattern(prop.value);
                } else if (prop.type === 'RestElement') {
                    walkPattern(prop.argument);
                }
            }
        } else if (p.type === 'ArrayPattern') {
            for (const elem of p.elements || []) {
                if (elem) walkPattern(elem);
            }
        }
    }

    walkPattern(pattern);
    return bindings;
}

function isReadInsidePattern(ancestors: any[], startIdx: number): boolean {
    for (let i = startIdx; i < ancestors.length - 1; i++) {
        const curr = ancestors[i];
        const next = ancestors[i + 1];
        if (curr.type === 'AssignmentPattern' && curr.right === next) {
            return true;
        }
        if (curr.type === 'Property' && curr.computed && curr.key === next) {
            return true;
        }
    }
    return false;
}

function isReadInsideLHS(ancestors: any[], startIdx: number): boolean {
    for (let i = startIdx; i < ancestors.length - 1; i++) {
        const curr = ancestors[i];
        const next = ancestors[i + 1];
        if (curr.type === 'MemberExpression') {
            if (curr.computed && curr.property === next) {
                return true;
            }
            if (curr.object === next) {
                return true;
            }
        }
        if (curr.type === 'Property' && curr.computed && curr.key === next) {
            return true;
        }
        if (curr.type === 'AssignmentPattern' && curr.right === next) {
            return true;
        }
    }
    return false;
}

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
        const declaredVariables = new Map<string, { line: number; isExported: boolean }>();
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
                VariableDeclarator(node: any, ancestors: any[]) {
                    // Arrow functions and function expressions are tracked as functions
                    if (node.init && (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')) {
                        return;
                    }

                    const varDeclParent = ancestors[ancestors.length - 3];
                    const isExported = !!(varDeclParent && (
                        varDeclParent.type === 'ExportNamedDeclaration' ||
                        varDeclParent.type === 'ExportDefaultDeclaration'
                    ));

                    const bindings = extractBindings(node.id);
                    for (const binding of bindings) {
                        if (!declaredVariables.has(binding.name)) {
                            declaredVariables.set(binding.name, {
                                line: binding.line,
                                isExported,
                            });
                        }
                    }
                },
                Identifier(node: any, ancestors: any[]) {
                    const name = node.name;
                    const parent = ancestors[ancestors.length - 2];

                    // 1. Skip function/class declarations/expressions names
                    if (parent && (
                        (parent.type === 'FunctionDeclaration' && parent.id === node) ||
                        (parent.type === 'FunctionExpression' && parent.id === node) ||
                        (parent.type === 'ClassDeclaration' && parent.id === node) ||
                        (parent.type === 'ClassExpression' && parent.id === node)
                    )) {
                        return;
                    }

                    // 2. Skip non-computed member expression property: obj.x
                    if (parent && parent.type === 'MemberExpression' && parent.property === node && !parent.computed) {
                        return;
                    }

                    // 3. Skip non-computed, non-shorthand object literal key: { x: 1 }
                    if (parent && parent.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand) {
                        return;
                    }

                    // 4. Skip class method / property definition keys
                    if (parent && (parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') && parent.key === node && !parent.computed) {
                        return;
                    }

                    // 5. Skip import specifiers
                    if (parent && (parent.type === 'ImportSpecifier' || parent.type === 'ImportDefaultSpecifier' || parent.type === 'ImportNamespaceSpecifier')) {
                        return;
                    }

                    // 6. Skip label identifiers
                    if (parent && (parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') && parent.label === node) {
                        return;
                    }

                    // 7. Skip catch clause parameter
                    if (parent && parent.type === 'CatchClause' && parent.param === node) {
                        return;
                    }

                    // 8. Check if identifier is inside a VariableDeclarator pattern (id) or function params
                    let isDeclarationBinding = false;
                    for (let i = ancestors.length - 2; i >= 0; i--) {
                        const anc = ancestors[i];
                        const next = ancestors[i + 1];

                        if (anc.type === 'VariableDeclarator') {
                            if (anc.id === next) {
                                if (!isReadInsidePattern(ancestors, i + 1)) {
                                    isDeclarationBinding = true;
                                }
                            }
                            break;
                        }

                        if (anc.type === 'FunctionDeclaration' || anc.type === 'FunctionExpression' || anc.type === 'ArrowFunctionExpression') {
                            if (Array.isArray(anc.params) && anc.params.includes(next)) {
                                if (!isReadInsidePattern(ancestors, i + 1)) {
                                    isDeclarationBinding = true;
                                }
                            }
                            break;
                        }
                    }
                    if (isDeclarationBinding) {
                        return;
                    }

                    // 9. Skip pure assignment target (LHS of simple assignment =)
                    let isPureAssignmentWrite = false;
                    for (let i = ancestors.length - 2; i >= 0; i--) {
                        const anc = ancestors[i];
                        const next = ancestors[i + 1];

                        if (anc.type === 'AssignmentExpression' && anc.operator === '=') {
                            if (anc.left === next) {
                                if (!isReadInsideLHS(ancestors, i + 1)) {
                                    isPureAssignmentWrite = true;
                                }
                            }
                            break;
                        }
                    }
                    if (isPureAssignmentWrite) {
                        return;
                    }

                    // Count as valid reference / read
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
            this.fallbackRegexHeuristics(code, declaredFunctions, declaredVariables, identifierReferences, unreachableCode);
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

        declaredVariables.forEach((meta, name) => {
            if (declaredFunctions.has(name)) {
                return;
            }
            const refCount = identifierReferences.get(name) || 0;
            if (refCount === 0) {
                potentiallyUnusedDeclarations.push({
                    name,
                    type: 'variable',
                    line: meta.line,
                    isExported: meta.isExported,
                    observation: meta.isExported
                        ? `Exported variable '${name}' has no direct local references within this file (expected for public library/API utilities).`
                        : `Variable '${name}' is declared but not referenced within this analyzed snippet. Verify whether it is read dynamically, exported, or used externally before removing.`,
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
        declaredVariables: Map<string, { line: number; isExported: boolean }>,
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
            } else {
                const varMatch = line.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\b/);
                if (varMatch) {
                    const name = varMatch[1];
                    const isExported = line.includes('export');
                    if (!declaredVariables.has(name)) {
                        declaredVariables.set(name, { line: lineNum, isExported });
                    }
                }
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

        declaredVariables.forEach((_, name) => {
            const regex = new RegExp(`\\b${name}\\b`, 'g');
            const matches = code.match(regex) || [];
            if (matches.length > 1) {
                identifierReferences.set(name, matches.length - 1);
            }
        });
    }
}
