const assert = require('assert');
const { JsTsParser } = require('./dist/services/parsers/jstsParser');
const { RegexAnalyzer } = require('./dist/services/parsers/regexAnalyzer');
const { staticAnalyzer } = require('./dist/services/staticAnalyzer');

const parser = new JsTsParser();

console.log('====================================================');
console.log('🧪 STATIC ANALYSIS SUITE: UNUSED VARIABLES & OS CALLS');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ [PASS] ${testName}`);
        passedTests++;
    } catch (err) {
        console.error(`❌ [FAIL] ${testName}: ${err.message}`);
        failedTests++;
    }
}

// ==================================================
// PART 1: UNUSED VARIABLES (Tests A - F & Extensions)
// ==================================================
console.log('--- Unused Variables Detection Tests ---');

// Test A: const unused = 10; => should be detected
runTest('Test A: const unused = 10; should be detected as unused', () => {
    const code = `const unused = 10;`;
    const result = parser.parse(code, 'javascript');
    const unusedVars = result.potentiallyUnusedDeclarations.filter(d => d.type === 'variable');
    assert.strictEqual(unusedVars.length, 1, 'Expected 1 unused variable');
    assert.strictEqual(unusedVars[0].name, 'unused');
    assert.strictEqual(unusedVars[0].type, 'variable');
});

// Test B: const used = 10; console.log(used); => should NOT be detected as unused
runTest('Test B: const used = 10; console.log(used); should NOT be detected', () => {
    const code = `
const used = 10;
console.log(used);
`;
    const result = parser.parse(code, 'javascript');
    const unused = result.potentiallyUnusedDeclarations.find(d => d.name === 'used');
    assert.strictEqual(unused, undefined, 'Variable "used" should not be flagged as unused');
});

// Test C: const x = obj.x; => property name x should NOT accidentally be treated as a variable reference
runTest('Test C: const x = obj.x; member property should not prevent x from being flagged', () => {
    const code = `const x = obj.x;`;
    const result = parser.parse(code, 'javascript');
    const unused = result.potentiallyUnusedDeclarations.find(d => d.name === 'x' && d.type === 'variable');
    assert.ok(unused, 'Variable "x" should be flagged as unused (obj.x property access is not a variable reference)');
});

// Test D: const x = 10; const y = x; => x is used, y may be unused
runTest('Test D: const x = 10; const y = x; => x is used, y is unused', () => {
    const code = `
const x = 10;
const y = x;
`;
    const result = parser.parse(code, 'javascript');
    const xUnused = result.potentiallyUnusedDeclarations.find(d => d.name === 'x');
    const yUnused = result.potentiallyUnusedDeclarations.find(d => d.name === 'y');
    assert.strictEqual(xUnused, undefined, 'Variable "x" should not be flagged as unused');
    assert.ok(yUnused, 'Variable "y" should be flagged as unused');
    assert.strictEqual(yUnused.type, 'variable');
});

// Test E: for (let i = 0; i < 10; i++) {} => i should not be incorrectly reported if loop uses it
runTest('Test E: for (let i = 0; i < 10; i++) {} => loop index should not be flagged as unused', () => {
    const code = `for (let i = 0; i < 10; i++) {}`;
    const result = parser.parse(code, 'javascript');
    const iUnused = result.potentiallyUnusedDeclarations.find(d => d.name === 'i');
    assert.strictEqual(iUnused, undefined, 'Loop variable "i" should not be flagged as unused');
});

// Test F: let x; x = 10; => verify behavior matches chosen read/write semantics (pure write != read)
runTest('Test F: let x; x = 10; => assignment-only variable should be detected as unused', () => {
    const code = `
let x;
x = 10;
`;
    const result = parser.parse(code, 'javascript');
    const xUnused = result.potentiallyUnusedDeclarations.find(d => d.name === 'x' && d.type === 'variable');
    assert.ok(xUnused, 'Variable "x" with only write assignment should be flagged as unused');
});

// Extra Unused Variable Tests:
runTest('Extra: Destructuring { a, b } with only a used => b detected as unused', () => {
    const code = `
const { a, b } = obj;
console.log(a);
`;
    const result = parser.parse(code, 'javascript');
    const aUnused = result.potentiallyUnusedDeclarations.find(d => d.name === 'a');
    const bUnused = result.potentiallyUnusedDeclarations.find(d => d.name === 'b');
    assert.strictEqual(aUnused, undefined, '"a" should be marked as used');
    assert.ok(bUnused, '"b" should be marked as unused');
    assert.strictEqual(bUnused.type, 'variable');
});

runTest('Extra: Computed property access obj[k] => k counts as used', () => {
    const code = `
const k = "prop";
const val = obj[k];
console.log(val);
`;
    const result = parser.parse(code, 'javascript');
    const kUnused = result.potentiallyUnusedDeclarations.find(d => d.name === 'k');
    assert.strictEqual(kUnused, undefined, '"k" should be marked as used via computed access');
});

runTest('Extra: Update expression count++ => count counts as used', () => {
    const code = `
let count = 0;
count++;
`;
    const result = parser.parse(code, 'javascript');
    const countUnused = result.potentiallyUnusedDeclarations.find(d => d.name === 'count');
    assert.strictEqual(countUnused, undefined, '"count" should be marked as used via update expression');
});

runTest('Extra: Arrow functions assigned to const remain functions, not plain variables', () => {
    const code = `const myFunc = (x) => x * 2;`;
    const result = parser.parse(code, 'javascript');
    const funcDecl = result.potentiallyUnusedDeclarations.find(d => d.name === 'myFunc');
    assert.ok(funcDecl, 'Unused arrow function should still be flagged');
    assert.strictEqual(funcDecl.type, 'function', 'Should be categorized as function, not variable');
});

// ==================================================
// PART 2: DANGEROUS OS CALLS (Tests G - L)
// ==================================================
console.log('\n--- Dangerous OS / Process Calls Tests ---');

// Test G: exec(command); => detected
runTest('Test G: exec(command); detected as unsafe-os-call', () => {
    const matches = RegexAnalyzer.analyzePatterns('exec(command);', 'javascript');
    const osCall = matches.find(m => m.type === 'unsafe-os-call');
    assert.ok(osCall, 'Expected unsafe-os-call pattern match for exec()');
    assert.strictEqual(osCall.severity, 'high');
});

// Test H: spawn("node", args); => detected
runTest('Test H: spawn("node", args); detected as unsafe-os-call', () => {
    const matches = RegexAnalyzer.analyzePatterns('spawn("node", args);', 'javascript');
    const osCall = matches.find(m => m.type === 'unsafe-os-call');
    assert.ok(osCall, 'Expected unsafe-os-call pattern match for spawn()');
    assert.strictEqual(osCall.severity, 'high');
});

// Test I: execSync(command); => detected
runTest('Test I: execSync(command); detected as unsafe-os-call', () => {
    const matches = RegexAnalyzer.analyzePatterns('execSync(command);', 'javascript');
    const osCall = matches.find(m => m.type === 'unsafe-os-call');
    assert.ok(osCall, 'Expected unsafe-os-call pattern match for execSync()');
    assert.strictEqual(osCall.severity, 'high');
});

// Test J: spawnSync(command); => detected
runTest('Test J: spawnSync(command); detected as unsafe-os-call', () => {
    const matches = RegexAnalyzer.analyzePatterns('spawnSync(command);', 'javascript');
    const osCall = matches.find(m => m.type === 'unsafe-os-call');
    assert.ok(osCall, 'Expected unsafe-os-call pattern match for spawnSync()');
    assert.strictEqual(osCall.severity, 'high');
});

// Test K: os.system(command); => detected
runTest('Test K: os.system(command); detected as unsafe-os-call', () => {
    const matches = RegexAnalyzer.analyzePatterns('os.system(command);', 'python');
    const osCall = matches.find(m => m.type === 'unsafe-os-call');
    assert.ok(osCall, 'Expected unsafe-os-call pattern match for os.system()');
    assert.strictEqual(osCall.severity, 'high');
});

// Test L: calculateTotal(); => normal unrelated function NOT detected
runTest('Test L: calculateTotal(); normal function call NOT detected as unsafe-os-call', () => {
    const matches = RegexAnalyzer.analyzePatterns('calculateTotal();', 'javascript');
    const osCall = matches.find(m => m.type === 'unsafe-os-call');
    assert.strictEqual(osCall, undefined, 'Normal function call must not be flagged as unsafe-os-call');
});

// Integration with staticAnalyzer.formatForPrompt
runTest('Integration: formatForPrompt includes both unused variables and unsafe OS call', () => {
    const code = `
const unusedKey = "abc";
exec(unusedKey);
`;
    const res = staticAnalyzer.analyze(code, 'javascript');
    const promptText = staticAnalyzer.formatForPrompt(res);
    assert.ok(promptText.includes('unsafe-os-call') || promptText.includes('Potential process or OS command execution'), 'Prompt context should include OS execution alert');
});

console.log('\n====================================================');
console.log(`Summary: ${passedTests}/${totalTests} tests passed, ${failedTests} failed.`);
console.log('====================================================');

if (failedTests > 0) {
    process.exit(1);
}
