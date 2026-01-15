/**
 * Vector Operations Test Script
 * Tests Qdrant and OpenAI embeddings integration
 */

import 'dotenv/config';
import { randomUUID } from 'crypto';
import { embed } from '../src/lib/server/vector/embeddings.js';
import {
	initCollection,
	upsertEntry,
	search,
	deleteEntry,
	getCollectionInfo
} from '../src/lib/server/vector/qdrant.js';

async function runTests() {
	console.log('\n🧪 Testing Vector Operations\n');

	try {
		// Test 1: Initialize collection
		console.log('Test 1: Initializing Qdrant collection...');
		await initCollection();
		console.log('✓ Collection initialized\n');

		// Test 2: Generate embedding
		console.log('Test 2: Generating embedding...');
		const testText = 'Kelas yoga untuk pemula dengan instruktur berpengalaman';
		const embedding = await embed(testText);
		console.log(`✓ Embedding generated (${embedding.length} dimensions)\n`);

		if (embedding.length !== 1536) {
			throw new Error(`Expected 1536 dimensions, got ${embedding.length}`);
		}

		// Test 3: Upsert entry
		console.log('Test 3: Upserting test entry...');
		const testTenant1 = randomUUID();
		const testTenant2 = randomUUID();
		const testEntry1 = {
			id: randomUUID(),
			tenant_id: testTenant1,
			title: 'Test Entry - Beginner Class',
			content: testText,
			category: 'classes',
			keywords: 'beginner,pemula,hatha'
		};

		await upsertEntry(testEntry1, embedding);
		console.log('✓ Entry upserted\n');

		// Test 4: Search for the entry
		console.log('Test 4: Searching for similar entries...');
		const queryText = 'yoga pemula';
		const queryEmbedding = await embed(queryText);
		const results = await search(queryEmbedding, testTenant1);

		if (results.length === 0) {
			throw new Error('Expected to find at least 1 result');
		}

		console.log(`✓ Found ${results.length} result(s)`);
		console.log(`  - Top result: "${results[0].payload.title}" (score: ${results[0].score})\n`);

		// Test 5: Tenant isolation
		console.log('Test 5: Testing tenant isolation...');
		const otherTenantResults = await search(queryEmbedding, testTenant2);

		if (otherTenantResults.length > 0) {
			throw new Error('Tenant isolation failed! Found results for different tenant');
		}

		console.log('✓ Tenant filtering works (no cross-tenant results)\n');

		// Test 6: Category filtering
		console.log('Test 6: Testing category filtering...');
		const categoryResults = await search(queryEmbedding, testTenant1, 'classes');

		if (categoryResults.length === 0) {
			throw new Error('Expected to find results in "classes" category');
		}

		console.log(`✓ Category filtering works (${categoryResults.length} results in "classes")\n`);

		// Test 7: Delete entry
		console.log('Test 7: Deleting test entry...');
		await deleteEntry(testEntry1.id);

		const afterDeleteResults = await search(queryEmbedding, testTenant1);
		if (afterDeleteResults.length > 0) {
			throw new Error('Entry was not deleted properly');
		}

		console.log('✓ Entry deleted successfully\n');

		// Collection info
		console.log('Collection Info:');
		const info = await getCollectionInfo();
		console.log(`  - Points count: ${info.points_count}`);
		console.log(`  - Vectors count: ${info.vectors_count}\n`);

		console.log('✅ All tests passed!\n');
	} catch (error) {
		console.error('\n❌ Test failed:', error.message);
		console.error(error);
		process.exit(1);
	}

	process.exit(0);
}

runTests();
