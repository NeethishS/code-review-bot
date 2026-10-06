const dotenv = require('dotenv');
dotenv.config();

const { groqService } = require('./dist/services/groqService');
const { codeAnalyzer, validateAutoFixSafety } = require('./dist/services/codeAnalyzer');
const { explainService } = require('./dist/services/explainService');
const pool = require('./dist/db/index').default;

const sampleCode = `
function processTransactions(users) {
    var results = [];
    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        if (user.active) {
            var fee = user.amount * 0.02;
            var net = user.amount - fee;
            results.push({ id: user.id, net: net });
        }
    }
    return results;
}
`;

async function runAllTests() {
    console.log('====================================================');
    console.log('🚀 COMPREHENSIVE CODE REVIEW BOT FEATURE TEST SUITE');
    console.log('====================================================\n');

    let passed = 0;
    let failed = 0;

    async function check(name, fn) {
        process.stdout.write(`⏳ Testing ${name}... `);
        const start = Date.now();
        try {
            const res = await fn();
            const duration = Date.now() - start;
            console.log(`✅ PASSED (${duration}ms)`);
            if (res) console.log(`   👉 ${res}`);
            passed++;
            return true;
        } catch (err) {
            const duration = Date.now() - start;
            console.log(`❌ FAILED (${duration}ms): ${err.message}`);
            failed++;
            return false;
        }
    }

    // 1. Health check
    await check('Groq Health Check', async () => {
        const healthy = await groqService.healthCheck();
        if (!healthy) throw new Error('Groq healthCheck returned false');
        return `Model: ${groqService.getConfig().model}`;
    });

    // 2. Database connection
    await check('PostgreSQL Database Connection', async () => {
        const res = await pool.query('SELECT current_database(), now()');
        return `DB: ${res.rows[0].current_database}`;
    });

    // 3. Code Smell Analysis
    await check('Feature: Code Smell Detection', async () => {
        const res = await codeAnalyzer.analyzeCodeSmells(sampleCode, 'javascript');
        if (!res.success) throw new Error(res.error || 'Failed');
        const count = res.data?.smells?.length || 0;
        return `Found ${count} code smells, tokens: ${res.tokensUsed}`;
    });

    // 4. Security Scan
    await check('Feature: Security Vulnerability Scan', async () => {
        const res = await codeAnalyzer.scanSecurity(sampleCode, 'javascript');
        if (!res.success) throw new Error(res.error || 'Failed');
        return `Security check completed, tokens: ${res.tokensUsed}`;
    });

    // 5. Performance Analysis
    await check('Feature: Performance & Big-O Analysis', async () => {
        const res = await codeAnalyzer.analyzePerformance(sampleCode, 'javascript');
        if (!res.success) throw new Error(res.error || 'Failed');
        return `Performance analysis completed, tokens: ${res.tokensUsed}`;
    });

    // 6. Complexity Analysis
    await check('Feature: Code Complexity Analysis', async () => {
        const res = await codeAnalyzer.analyzeComplexity(sampleCode, 'javascript');
        if (!res.success) throw new Error(res.error || 'Failed');
        return `Complexity metrics parsed: ${JSON.stringify(res.data?.metrics || {}).slice(0, 60)}...`;
    });

    // 7. Duplicate Detection
    await check('Feature: Duplicates Detection', async () => {
        const res = await codeAnalyzer.detectDuplicates(sampleCode, 'javascript');
        if (!res.success) throw new Error(res.error || 'Failed');
        return `Duplicate check completed`;
    });

    // 8. Unit Test Generation
    await check('Feature: Unit Test Generation (Jest)', async () => {
        const res = await codeAnalyzer.generateTests(sampleCode, 'javascript', 'jest');
        if (!res.success) throw new Error(res.error || 'Failed');
        return `Tests generated, tokens: ${res.tokensUsed}`;
    });

    // 9. Full Code Review
    await check('Feature: Full Code Review', async () => {
        const res = await codeAnalyzer.fullReview(sampleCode, 'javascript');
        if (!res.success) throw new Error(res.error || 'Failed');
        return `Full review complete, tokens: ${res.tokensUsed}`;
    });

    // 10. Pattern Analysis
    await check('Feature: Pattern Analysis (DSA & Design Patterns)', async () => {
        const res = await codeAnalyzer.analyzePatterns(sampleCode, 'javascript');
        if (!res.success) throw new Error(res.error || 'Failed');
        return `Patterns analyzed`;
    });

    // 11. Edge Cases Generator
    await check('Feature: Edge Cases Generator', async () => {
        const res = await codeAnalyzer.generateEdgeCases(sampleCode, 'javascript');
        if (!res.success) throw new Error(res.error || 'Failed');
        return `Edge cases generated`;
    });

    // 12. Before vs After
    await check('Feature: Before vs After Review', async () => {
        const res = await codeAnalyzer.beforeAfterReview(sampleCode, 'javascript');
        if (!res.success) throw new Error(res.error || 'Failed');
        return `Before/After comparison created`;
    });

    // 13. Auto-Fix
    await check('Feature: Auto-Fix with Diff', async () => {
        const res = await codeAnalyzer.autoFix(sampleCode, 'javascript');
        if (!res.success) throw new Error(res.error || 'Failed');
        return `Auto-fix generated`;
    });

    // 14. Code Explainer / Vector Store
    await check('Feature: Code Explainer (RAG / Vector Index)', async () => {
        const sessionId = 'test-session-' + Date.now();
        explainService.indexFiles(sessionId, [
            { name: 'processTransactions.js', language: 'javascript', content: sampleCode }
        ]);
        const res = await explainService.explain(sessionId, 'What does processTransactions do?');
        if (!res.success) throw new Error(res.error || 'Failed');
        return `Explanation preview: ${res.explanation?.slice(0, 80)}...`;
    });

    // 15. Backup Key Failover Check
    await check('Feature: Groq Backup Key Failover', async () => {
        // Send a test prompt directly using the backup key
        const backupRes = await groqService.sendPrompt(
            'You are a reviewer. Respond ONLY with valid JSON: {"status": "ok"}',
            'Ping',
            { customApiKey: process.env.BACKUP_GROQ_API_KEY, model: process.env.BACKUP_GROQ_MODEL }
        );
        if (!backupRes.success) throw new Error(backupRes.error || 'Backup key failed');
        return `Backup key verified (${process.env.BACKUP_GROQ_MODEL})`;
    });

    // 16. Cross-Feature Shared Static Findings
    await check('Cross-Feature: Shared Static Findings Across All 4 Workflows', async () => {
        const testCode = `const unusedVariable = 42;\nexec(userInput);`;

        // 1. AI Code Analyser
        const aiRes = await codeAnalyzer.scanSecurity(testCode, 'javascript');
        if (!aiRes.success) throw new Error('AI Code Analyser scanSecurity failed');
        const aiUnused = aiRes.staticAnalysis?.potentiallyUnusedDeclarations?.find(d => d.name === 'unusedVariable' && d.type === 'variable');
        const aiOsCall = aiRes.staticAnalysis?.patterns?.find(p => p.type === 'unsafe-os-call');
        if (!aiUnused) throw new Error('AI Code Analyser missing unusedVariable static finding');
        if (!aiOsCall) throw new Error('AI Code Analyser missing unsafe-os-call static finding');

        // 2. Upload & Analyse flow (multi-file analysis)
        const uploadRes = await codeAnalyzer.fullReview(testCode, 'javascript');
        if (!uploadRes.success) throw new Error('Upload & Analyse fullReview failed');
        const uploadUnused = uploadRes.staticAnalysis?.potentiallyUnusedDeclarations?.find(d => d.name === 'unusedVariable' && d.type === 'variable');
        const uploadOsCall = uploadRes.staticAnalysis?.patterns?.find(p => p.type === 'unsafe-os-call');
        if (!uploadUnused || !uploadOsCall) throw new Error('Upload & Analyse missing static findings');

        // 3. Code Explainer
        const explainSession = 'test-explain-static-' + Date.now();
        explainService.indexFiles(explainSession, [
            { name: 'service.js', language: 'javascript', content: testCode }
        ]);
        const explainRes = await explainService.explain(explainSession, 'Explain this code');
        if (!explainRes.success) throw new Error('Code Explainer failed');
        const explainUnused = explainRes.staticAnalysis?.potentiallyUnusedDeclarations?.find(d => d.name === 'unusedVariable' && d.type === 'variable');
        const explainOsCall = explainRes.staticAnalysis?.patterns?.find(p => p.type === 'unsafe-os-call');
        if (!explainUnused || !explainOsCall) throw new Error('Code Explainer missing static findings');

        // 4. Auto-Fix
        const autoFixRes = await codeAnalyzer.autoFix(testCode, 'javascript');
        if (!autoFixRes.success) throw new Error('Auto-Fix failed');
        const autoFixUnused = autoFixRes.staticAnalysis?.potentiallyUnusedDeclarations?.find(d => d.name === 'unusedVariable' && d.type === 'variable');
        const autoFixOsCall = autoFixRes.staticAnalysis?.patterns?.find(p => p.type === 'unsafe-os-call');
        if (!autoFixUnused || !autoFixOsCall) throw new Error('Auto-Fix missing static findings');

        // Verify negative cases
        const usedCode = `const used = 10;\nconsole.log(used);`;
        const usedRes = await codeAnalyzer.fullReview(usedCode, 'javascript');
        const falselyReportedUsed = usedRes.staticAnalysis?.potentiallyUnusedDeclarations?.find(d => d.name === 'used');
        if (falselyReportedUsed) throw new Error('Variable "used" incorrectly flagged as unused');

        const computedCode = `const key = "name";\nconst val = obj[key];`;
        const computedRes = await codeAnalyzer.fullReview(computedCode, 'javascript');
        const falselyReportedKey = computedRes.staticAnalysis?.potentiallyUnusedDeclarations?.find(d => d.name === 'key');
        if (falselyReportedKey) throw new Error('Computed key "key" incorrectly flagged as unused');

        return 'Verified consistent findings across AI Analyser, Upload & Analyse, Code Explainer, and Auto-Fix';
    });

    // 17. Auto-Fix Deterministic Safety Safeguard (Sensitive OS/Process Calls)
    await check('Feature: Auto-Fix Safety Safeguard (OS/Process Calls)', async () => {
        // Test 1: Original contains exec(), generated fix removes exec() => rejected/warned
        const res1 = validateAutoFixSafety('exec(userInput);', '// safe alternative without exec', 'javascript');
        if (res1.safe !== false) throw new Error('Test 1 failed: Expected removal of exec() to be rejected');
        if (!res1.reason || !res1.reason.includes('remove')) throw new Error('Test 1 failed: Expected rejection reason to mention removal');

        // Test 2: Original contains spawn(), generated fix removes spawn() => rejected/warned
        const res2 = validateAutoFixSafety('spawn("node", args);', 'console.log("no spawn");', 'javascript');
        if (res2.safe !== false) throw new Error('Test 2 failed: Expected removal of spawn() to be rejected');
        if (!res2.reason || !res2.reason.includes('remove')) throw new Error('Test 2 failed: Expected rejection reason to mention removal');

        // Test 3: Original contains exec(), generated fix changes to spawn() => rejected/warned
        const res3 = validateAutoFixSafety('exec(userInput);', 'spawn("node", [userInput]);', 'javascript');
        if (res3.safe !== false) throw new Error('Test 3 failed: Expected changing exec to spawn to be rejected');
        if (!res3.reason || !res3.reason.includes('modify')) throw new Error('Test 3 failed: Expected rejection reason to mention modification');

        // Test 4: Original contains exec(), generated fix preserves exec() => allowed
        const res4 = validateAutoFixSafety(
            'exec(userInput);',
            'const sanitized = sanitize(userInput);\nexec(sanitized);',
            'javascript'
        );
        if (res4.safe !== true) throw new Error(`Test 4 failed: Expected preserving exec() to be allowed, got: ${res4.reason}`);

        // Test 5: Original contains exec(), generated fix changes surrounding formatting only => allowed
        const res5 = validateAutoFixSafety(
            'function run() {\n    exec(userInput);\n}',
            'function run() {\n  exec(userInput);\n}',
            'javascript'
        );
        if (res5.safe !== true) throw new Error(`Test 5 failed: Expected formatting-only fix to be allowed, got: ${res5.reason}`);

        // Test 6: Original contains no unsafe-os-call => allowed (normal behavior)
        const res6 = validateAutoFixSafety(
            'const total = price * quantity;',
            'const total = Math.round(price * quantity * 100) / 100;',
            'javascript'
        );
        if (res6.safe !== true) throw new Error(`Test 6 failed: Expected normal code fix to be allowed, got: ${res6.reason}`);

        // Test 7: Original has no unsafe-os-call, fix introduces new exec() => rejected
        const res7 = validateAutoFixSafety('const x = 10;', 'exec("whoami");', 'javascript');
        if (res7.safe !== false) throw new Error('Test 7 failed: Expected introduction of new exec() to be rejected');

        return 'Verified Auto-Fix deterministic safeguard (remove, change, preserve, format, and normal cases)';
    });

    console.log('\n====================================================');
    console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
