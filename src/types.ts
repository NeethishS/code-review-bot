export type Page = 
    | 'dashboard' 
    | 'repositories' 
    | 'review' 
    | 'settings' 
    | 'ai-demo' 
    | 'upload' 
    | 'explainer' 
    | 'github' 
    | 'auto-fix' 
    | 'history' 
    | 'automate-prs' 
    | 'landing' 
    | 'login';

export interface StaticPatternMatch {
    type: string;
    line: number;
    snippet: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
}

export interface PotentiallyUnusedDeclaration {
    name: string;
    type: 'function' | 'variable' | 'class';
    line: number;
    isExported: boolean;
    observation: string;
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
    potentiallyUnusedDeclarations: PotentiallyUnusedDeclaration[];
    unreachableCode: Array<{
        line: number;
        reason: string;
    }>;
    patterns: StaticPatternMatch[];
    duplicateBlocks: Array<{
        blockA: { startLine: number; endLine: number };
        blockB: { startLine: number; endLine: number };
        similarity: number;
    }>;
    functions: Array<{
        name: string;
        line: number;
        length: number;
        parameterCount: number;
        cyclomaticComplexity: number;
        isExported: boolean;
        localCallsCount: number;
    }>;
}
