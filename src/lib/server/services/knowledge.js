/**
 * Knowledge Base Service
 * Business logic for managing knowledge entries with vector synchronization
 */

import { randomUUID } from 'crypto';
import { getDatabase } from '../db/index.js';
import { embed } from '../vector/embeddings.js';
import { upsertEntry, deleteEntry as deleteVectorEntry } from '../vector/qdrant.js';

/**
 * List knowledge entries with optional filters
 * @param {Object} filters - Filter options
 * @param {string} [filters.tenantId] - Filter by tenant
 * @param {string} [filters.category] - Filter by category
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.search] - Search in title/keywords
 * @returns {Array} - Array of knowledge entries
 */
export function listEntries(filters = {}) {
	const db = getDatabase();
	let query = 'SELECT * FROM knowledge_entries WHERE 1=1';
	const params = [];

	if (filters.tenantId) {
		query += ' AND tenant_id = ?';
		params.push(filters.tenantId);
	}

	if (filters.category) {
		query += ' AND category = ?';
		params.push(filters.category);
	}

	if (filters.status) {
		query += ' AND status = ?';
		params.push(filters.status);
	}

	if (filters.search) {
		query += ' AND (title LIKE ? OR keywords LIKE ?)';
		const searchPattern = `%${filters.search}%`;
		params.push(searchPattern, searchPattern);
	}

	query += ' ORDER BY updated_at DESC';

	return db.prepare(query).all(...params);
}

/**
 * Get a single knowledge entry by ID
 * @param {string} id - Entry ID
 * @returns {Object|null} - Knowledge entry or null
 */
export function getEntry(id) {
	const db = getDatabase();
	return db.prepare('SELECT * FROM knowledge_entries WHERE id = ?').get(id);
}

/**
 * Create a new knowledge entry
 * @param {Object} data - Entry data
 * @param {string} data.tenant_id - Tenant ID
 * @param {string} data.title - Entry title
 * @param {string} data.category - Category
 * @param {string} data.content - Content (markdown)
 * @param {string} [data.keywords] - Comma-separated keywords
 * @param {string} [data.status] - Status (active/draft/archived)
 * @returns {Promise<Object>} - Created entry with ID
 */
export async function createEntry(data) {
	const db = getDatabase();
	const id = randomUUID();
	const now = new Date().toISOString();

	try {
		// 1. Insert to SQLite
		db.prepare(
			`INSERT INTO knowledge_entries
			(id, tenant_id, title, category, content, keywords, status, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			id,
			data.tenant_id,
			data.title,
			data.category,
			data.content,
			data.keywords || '',
			data.status || 'active',
			now,
			now
		);

		// 2. Generate embedding
		console.log(`[Knowledge] Generating embedding for: ${data.title}`);
		const embedding = await embed(data.content);

		// 3. Upsert to Qdrant
		const entry = {
			id,
			tenant_id: data.tenant_id,
			title: data.title,
			content: data.content,
			category: data.category,
			keywords: data.keywords || ''
		};
		await upsertEntry(entry, embedding);

		// 4. Update vector_id in database
		db.prepare('UPDATE knowledge_entries SET vector_id = ? WHERE id = ?').run(id, id);

		console.log(`[Knowledge] Created entry: ${data.title} (ID: ${id})`);

		return getEntry(id);
	} catch (error) {
		// Rollback: delete from database if vector operation failed
		db.prepare('DELETE FROM knowledge_entries WHERE id = ?').run(id);
		console.error('[Knowledge] Error creating entry:', error);
		throw error;
	}
}

/**
 * Update an existing knowledge entry
 * @param {string} id - Entry ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>} - Updated entry
 */
export async function updateEntry(id, data) {
	const db = getDatabase();
	const existing = getEntry(id);

	if (!existing) {
		throw new Error(`Entry not found: ${id}`);
	}

	const now = new Date().toISOString();

	try {
		// 1. Update SQLite
		const updates = [];
		const params = [];

		if (data.title !== undefined) {
			updates.push('title = ?');
			params.push(data.title);
		}
		if (data.category !== undefined) {
			updates.push('category = ?');
			params.push(data.category);
		}
		if (data.content !== undefined) {
			updates.push('content = ?');
			params.push(data.content);
		}
		if (data.keywords !== undefined) {
			updates.push('keywords = ?');
			params.push(data.keywords);
		}
		if (data.status !== undefined) {
			updates.push('status = ?');
			params.push(data.status);
		}

		updates.push('updated_at = ?');
		params.push(now);
		params.push(id);

		db.prepare(`UPDATE knowledge_entries SET ${updates.join(', ')} WHERE id = ?`).run(...params);

		// 2. If content changed, regenerate embedding and update Qdrant
		if (data.content !== undefined && data.content !== existing.content) {
			console.log(`[Knowledge] Content changed, regenerating embedding for: ${existing.title}`);

			const updatedEntry = getEntry(id);
			const embedding = await embed(updatedEntry.content);

			const entry = {
				id: updatedEntry.id,
				tenant_id: updatedEntry.tenant_id,
				title: updatedEntry.title,
				content: updatedEntry.content,
				category: updatedEntry.category,
				keywords: updatedEntry.keywords
			};

			await upsertEntry(entry, embedding);
		}

		console.log(`[Knowledge] Updated entry: ${id}`);

		return getEntry(id);
	} catch (error) {
		console.error('[Knowledge] Error updating entry:', error);
		throw error;
	}
}

/**
 * Delete a knowledge entry
 * @param {string} id - Entry ID
 * @returns {Promise<void>}
 */
export async function deleteEntryById(id) {
	const db = getDatabase();
	const entry = getEntry(id);

	if (!entry) {
		throw new Error(`Entry not found: ${id}`);
	}

	try {
		// 1. Delete from Qdrant if vector exists
		if (entry.vector_id) {
			await deleteVectorEntry(entry.vector_id);
		}

		// 2. Delete from SQLite
		db.prepare('DELETE FROM knowledge_entries WHERE id = ?').run(id);

		console.log(`[Knowledge] Deleted entry: ${entry.title} (ID: ${id})`);
	} catch (error) {
		console.error('[Knowledge] Error deleting entry:', error);
		throw error;
	}
}

/**
 * Get all tenants for dropdown
 * @returns {Array} - Array of {id, name}
 */
export function getTenants() {
	const db = getDatabase();
	return db.prepare('SELECT id, name FROM tenants WHERE active = 1 ORDER BY name').all();
}
