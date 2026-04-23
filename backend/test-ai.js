// Test script for AI endpoints
const testCode = `
function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        total = total + items[i].price * items[i].quantity;
    }
    return total;
}
`;

const API_BASE = 'http://localhost:3001/api/ai';

async function testEndpoint(endpoint, data) {
    console.log(`\n🧪 Testing ${endpoint}...`);
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ ${endpoint} - SUCCESS`);
            console.log(`   Tokens used: ${result.tokensUsed}`);
            console.log(`   Cost: $${result.cost?.toFixed(6)}`);
            console.log(`   Data:`, JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
        } else {
            console.log(`❌ ${endpoint} - FAILED`);
            console.log(`   Error: ${result.error}`);
        }
    } catch (error) {
        console.log(`❌ ${endpoint} - ERROR`);
        console.log(`   ${error.message}`);
    }
}

async function runTests() {
    console.log('🚀 Starting AI Endpoint Tests...\n');
    console.log('='.repeat(50));

    const testData = {
        code: testCode,
        language: 'javascript',
    };

    // Test all endpoints
    await testEndpoint('code-smell', testData);
    await testEndpoint('security-scan', testData);
    await testEndpoint('performance', testData);
    await testEndpoint('complexity', testData);
    await testEndpoint('duplicates', testData);
    await testEndpoint('generate-tests', { ...testData, framework: 'jest' });
    await testEndpoint('full-review', testData);

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!\n');
}

// Run tests
runTests();
