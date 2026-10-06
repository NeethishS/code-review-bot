const dotenv = require('dotenv');
dotenv.config();

const { groqService } = require('./dist/services/groqService');
const { codeAnalyzer } = require('./dist/services/codeAnalyzer');
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
        return `Backup key verified (${process.env.BACKUP_GROQ_MODELeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee})`;
    });

    console.log('\n====================================================');
    console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
