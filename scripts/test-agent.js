/**
 * AI Agent Test Script
 * Tests Claude agent without WhatsApp integration
 */

import 'dotenv/config';
import { processMessage } from '../src/lib/server/agent/claude-agent.js';
import { getDatabase } from '../src/lib/server/db/index.js';
import { initCollection, upsertEntry } from '../src/lib/server/vector/qdrant.js';
import { embed } from '../src/lib/server/vector/embeddings.js';

async function runAgentTests() {
	console.log('\n🤖 Testing AI Agent with Claude\n');

	try {
		// Get the default tenant from seed data
		const db = getDatabase();
		const tenant = db.prepare('SELECT * FROM tenants LIMIT 1').get();

		if (!tenant) {
			throw new Error('No tenant found. Run init-db.js first.');
		}

		console.log(`Testing with tenant: ${tenant.name}\n`);

		// Ensure Qdrant collection exists
		await initCollection();

		// Index knowledge entries if not already done
		console.log('Indexing knowledge base entries...');
		const entries = db.prepare('SELECT * FROM knowledge_entries WHERE tenant_id = ?').all(tenant.id);

		for (const entry of entries) {
			if (!entry.vector_id) {
				// Generate and store embedding
				const embedding = await embed(entry.content);
				await upsertEntry(entry, embedding);

				// Update database with vector_id
				db.prepare('UPDATE knowledge_entries SET vector_id = ? WHERE id = ?').run(
					entry.id,
					entry.id
				);
			}
		}
		console.log(`✓ Indexed ${entries.length} entries\n`);

		// Test scenarios
		const testCases = [
			{
				name: 'Test 1: General question about classes (English)',
				message: 'What classes do you offer?',
				expectedBehavior: 'Should use knowledge_search and respond in English'
			},
			{
				name: 'Test 2: Pricing question (Indonesian)',
				message: 'Berapa harga membership?',
				expectedBehavior: 'Should use knowledge_search and respond in Indonesian'
			},
			{
				name: 'Test 3: Medical concern (escalation)',
				message: 'I have severe back pain, is yoga safe for me?',
				expectedBehavior: 'Should escalate_to_human due to medical concern'
			},
			{
				name: 'Test 4: Follow-up question (context)',
				message: 'What about the facilities?',
				expectedBehavior: 'Should search for facilities info'
			}
		];

		const userPhone = '+62812345678901'; // Test phone number
		let conversationHistory = [];

		for (const testCase of testCases) {
			console.log(`\n${'='.repeat(60)}`);
			console.log(testCase.name);
			console.log(`Expected: ${testCase.expectedBehavior}`);
			console.log(`${'='.repeat(60)}`);
			console.log(`\n👤 User: ${testCase.message}`);

			try {
				const response = await processMessage(
					tenant.id,
					userPhone,
					testCase.message,
					conversationHistory
				);

				console.log(`\n🤖 Agent: ${response}\n`);

				// Update conversation history for next test
				conversationHistory.push(
					{ role: 'user', content: testCase.message },
					{ role: 'assistant', content: response }
				);

				// Keep only last 4 messages (2 exchanges) for context
				if (conversationHistory.length > 4) {
					conversationHistory = conversationHistory.slice(-4);
				}

				// Wait a bit between tests to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 2000));
			} catch (error) {
				console.error(`\n❌ Test failed:`, error.message);
				if (error.status === 429) {
					console.log('\n⚠️  Rate limit exceeded. Please wait and try again.');
					break;
				}
			}
		}

		console.log(`\n${'='.repeat(60)}`);
		console.log('✅ Agent testing complete!');
		console.log(`${'='.repeat(60)}\n`);
	} catch (error) {
		console.error('\n❌ Test setup failed:', error);
		process.exit(1);
	}

	process.exit(0);
}

runAgentTests();
