/**
 * Batch Knowledge Creation API
 * Efficiently creates multiple knowledge entries at once with batch embedding
 */

import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { getDatabase } from '$lib/server/db/index.js';
import { embedBatch } from '$lib/server/vector/embeddings.js';
import { getQdrantClient } from '$lib/server/vector/qdrant.js';

const COLLECTION_NAME = 'yoga_knowledge';

/**
 * Batch create knowledge entries
 * POST /api/knowledge/batch
 * Body: {
 *   tenant_id: string,
 *   category: string,
 *   chunks: [{ title, content, keywords, metadata }]
 * }
 */
export async function POST({ request }) {
	try {
		const { tenant_id, category, chunks } = await request.json();

		// Validate input
		if (!tenant_id || !category || !Array.isArray(chunks) || chunks.length === 0) {
			return json(
				{
					success: false,
					error: 'Invalid input: tenant_id, category, and chunks array required'
				},
				{ status: 400 }
			);
		}

		if (chunks.length > 100) {
			return json(
				{
					success: false,
					error: 'Too many chunks: maximum 100 chunks per batch'
				},
				{ status: 400 }
			);
		}

		console.log(`[Batch] Creating ${chunks.length} knowledge entries for tenant ${tenant_id}`);

		const db = getDatabase();
		const qdrant = getQdrantClient();
		const now = new Date().toISOString();

		// Prepare entries with IDs
		const entries = chunks.map((chunk) => ({
			id: randomUUID(),
			tenant_id,
			category,
			title: chunk.title,
			content: chunk.content,
			keywords: chunk.keywords || '',
			metadata: typeof chunk.metadata === 'object' ? JSON.stringify(chunk.metadata) : chunk.metadata || '{}',
			status: 'active',
			created_at: now,
			updated_at: now
		}));

		// Step 1: Insert all entries into SQLite
		const insertStmt = db.prepare(`
			INSERT INTO knowledge_entries
			(id, tenant_id, title, category, content, keywords, metadata, status, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		const insertTransaction = db.transaction((entries) => {
			for (const entry of entries) {
				insertStmt.run(
					entry.id,
					entry.tenant_id,
					entry.title,
					entry.category,
					entry.content,
					entry.keywords,
					entry.metadata,
					entry.status,
					entry.created_at,
					entry.updated_at
				);
			}
		});

		try {
			insertTransaction(entries);
			console.log(`[Batch] Inserted ${entries.length} entries to database`);
		} catch (dbError) {
			console.error('[Batch] Database insertion error:', dbError);
			return json(
				{
					success: false,
					error: 'Database insertion failed',
					details: dbError.message
				},
				{ status: 500 }
			);
		}

		// Step 2: Generate embeddings in batch (much faster than individual calls)
		let embeddings;
		try {
			console.log(`[Batch] Generating ${entries.length} embeddings...`);
			const contents = entries.map((e) => e.content);
			embeddings = await embedBatch(contents);
			console.log(`[Batch] Generated ${embeddings.length} embeddings successfully`);
		} catch (embedError) {
			// Rollback: delete all inserted entries
			const deleteStmt = db.prepare('DELETE FROM knowledge_entries WHERE id = ?');
			const deleteTransaction = db.transaction((entries) => {
				for (const entry of entries) {
					deleteStmt.run(entry.id);
				}
			});
			deleteTransaction(entries);

			console.error('[Batch] Embedding generation error:', embedError);
			return json(
				{
					success: false,
					error: 'Embedding generation failed',
					details: embedError.message
				},
				{ status: 500 }
			);
		}

		// Step 3: Batch upsert to Qdrant
		const points = entries.map((entry, i) => ({
			id: entry.id,
			vector: embeddings[i],
			payload: {
				tenant_id: entry.tenant_id,
				title: entry.title,
				content: entry.content,
				category: entry.category,
				keywords: entry.keywords ? entry.keywords.split(',').map((k) => k.trim()) : [],
				entry_id: entry.id,
				metadata: JSON.parse(entry.metadata)
			}
		}));

		try {
			await qdrant.upsert(COLLECTION_NAME, {
				wait: true,
				points
			});
			console.log(`[Batch] Upserted ${points.length} points to Qdrant`);
		} catch (qdrantError) {
			// Rollback: delete all inserted entries
			const deleteStmt = db.prepare('DELETE FROM knowledge_entries WHERE id = ?');
			const deleteTransaction = db.transaction((entries) => {
				for (const entry of entries) {
					deleteStmt.run(entry.id);
				}
			});
			deleteTransaction(entries);

			console.error('[Batch] Qdrant upsert error:', qdrantError);
			return json(
				{
					success: false,
					error: 'Vector database upsert failed',
					details: qdrantError.message
				},
				{ status: 500 }
			);
		}

		// Step 4: Update vector_id in database
		const updateStmt = db.prepare('UPDATE knowledge_entries SET vector_id = ? WHERE id = ?');
		const updateTransaction = db.transaction((entries) => {
			for (const entry of entries) {
				updateStmt.run(entry.id, entry.id);
			}
		});

		try {
			updateTransaction(entries);
		} catch (updateError) {
			console.error('[Batch] Warning: Failed to update vector_id:', updateError);
			// Don't rollback for this - entries are already created
		}

		console.log(`[Batch] Successfully created ${entries.length} knowledge entries`);

		return json({
			success: true,
			count: entries.length,
			entries: entries.map((e) => ({
				id: e.id,
				title: e.title
			}))
		});
	} catch (error) {
		console.error('[Batch] Unexpected error:', error);
		return json(
			{
				success: false,
				error: 'Internal server error',
				details: error.message
			},
			{ status: 500 }
		);
	}
}
