export interface StaticDeclaration {
    name: string;
    type: 'function' | 'variable' | 'class';
    line: number;
    isExported: boolean;
    localReferencesCount: number;
}

export interface StaticPatternMatch {
    type: string;
    line: number;
    snippet: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
}

export interface DuplicateBlock {
    blockA: { startLine: number; endLine: number };
    blockB: { startLine: number; endLine: number };
    similarity: number;
}

export interface FunctionMetric {
    name: string;
    line: number;
    length: number;
    parameterCount: number;
    cyclomaticComplexity: number;
    isExported: boolean;
    localCallsCount: number;
}

export interface StaticAnalysisResult {
    language: string;
    metrics: {
        totalLines: number;
        codeLines: number;
        commentLines: number;
        blankLines: number;
        functionCount: number;
        maxNestingDepth: number;
        cyclomaticComplexity: number;
    };
    // Note: Cautiously phrased - non-referenced locally does not guarantee it's dead code
    potentiallyUnusedDeclarations: Array<{
        name: string;
        type: 'function' | 'variable' | 'class';
        line: number;
        isExported: boolean;
        observation: string;
    }>;
    unreachableCode: Array<{
        line: number;
        reason: string;
    }>;
    patterns: StaticPatternMatch[];
    duplicateBlocks: DuplicateBlock[];
    functions: FunctionMetric[];
}

export interface BaseParser {
    parse(code: string, language: string): StaticAnalysisResult;
}
