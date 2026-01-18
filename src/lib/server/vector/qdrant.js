/**
 * Qdrant Vector Database Client
 * Handles vector storage and semantic search operations
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { getEmbeddingDimensions } from './embeddings.js';

const COLLECTION_NAME = 'yoga_knowledge';
const VECTOR_SIZE = getEmbeddingDimensions();

let client = null;

/**
 * Get or create Qdrant client instance
 * @returns {QdrantClient}
 */
export function getQdrantClient() {
	if (!client) {
		const url = process.env.QDRANT_URL || 'http://localhost:6333';
		client = new QdrantClient({
			url,
			checkCompatibility: false // Skip version check for flexibility
		});
		console.log(`[Qdrant] Connected to ${url}`);
	}
	return client;
}

/**
 * Initialize Qdrant collection if it doesn't exist
 * @returns {Promise<void>}
 */
export async function initCollection() {
	const qdrant = getQdrantClient();

	try {
		// Check if collection exists
		const collections = await qdrant.getCollections();
		const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

		if (exists) {
			console.log(`[Qdrant] Collection "${COLLECTION_NAME}" already exists`);
			return;
		}

		// Create collection with cosine distance metric
		await qdrant.createCollection(COLLECTION_NAME, {
			vectors: {
				size: VECTOR_SIZE,
				distance: 'Cosine'
			}
		});

		console.log(`[Qdrant] Created collection "${COLLECTION_NAME}" (${VECTOR_SIZE} dimensions)`);
	} catch (error) {
		console.error('[Qdrant] Error initializing collection:', error);
		throw error;
	}
}

/**
 * Upsert a knowledge entry into Qdrant
 * @param {Object} entry - Knowledge entry object
 * @param {string} entry.id - Entry ID (will be used as point ID)
 * @param {string} entry.tenant_id - Tenant ID for filtering
 * @param {string} entry.title - Entry title
 * @param {string} entry.content - Entry content
 * @param {string} entry.category - Entry category
 * @param {string} entry.keywords - Comma-separated keywords
 * @param {Object} [entry.metadata] - Custom metadata key-value pairs
 * @param {number[]} embedding - 1536-dimensional embedding vector
 * @returns {Promise<void>}
 */
export async function upsertEntry(entry, embedding) {
	const qdrant = getQdrantClient();

	try {
		const payload = {
			tenant_id: entry.tenant_id,
			title: entry.title,
			content: entry.content,
			category: entry.category,
			keywords: entry.keywords?.split(',').map((k) => k.trim()) || [],
			entry_id: entry.id
		};

		// Add metadata if provided
		if (entry.metadata && typeof entry.metadata === 'object') {
			payload.metadata = entry.metadata;
		}

		await qdrant.upsert(COLLECTION_NAME, {
			wait: true,
			points: [
				{
					id: entry.id,
					vector: embedding,
					payload
				}
			]
		});

		console.log(`[Qdrant] Upserted entry: ${entry.title} (ID: ${entry.id})`);
	} catch (error) {
		console.error('[Qdrant] Error upserting entry:', error);
		throw error;
	}
}

/**
 * Delete a knowledge entry from Qdrant
 * @param {string} entryId - Entry ID to delete
 * @returns {Promise<void>}
 */
export async function deleteEntry(entryId) {
	const qdrant = getQdrantClient();

	try {
		await qdrant.delete(COLLECTION_NAME, {
			wait: true,
			points: [entryId]
		});

		console.log(`[Qdrant] Deleted entry: ${entryId}`);
	} catch (error) {
		console.error('[Qdrant] Error deleting entry:', error);
		throw error;
	}
}

/**
 * Search for similar knowledge entries
 * @param {number[]} queryEmbedding - Query embedding vector
 * @param {string} tenantId - Tenant ID to filter results
 * @param {string} [category] - Optional category filter
 * @param {number} [limit=3] - Maximum number of results
 * @returns {Promise<Array>} - Array of search results with payload and score
 */
export async function search(queryEmbedding, tenantId, category = null, limit = 3) {
	const qdrant = getQdrantClient();

	try {
		// Build filter
		const filter = {
			must: [
				{
					key: 'tenant_id',
					match: { value: tenantId }
				}
			]
		};

		// Add category filter if provided
		if (category) {
			filter.must.push({
				key: 'category',
				match: { value: category }
			});
		}

		const searchResult = await qdrant.search(COLLECTION_NAME, {
			vector: queryEmbedding,
			filter: filter,
			limit: limit,
			with_payload: true
		});

		console.log(
			`[Qdrant] Search found ${searchResult.length} results for tenant ${tenantId}${category ? ` in category ${category}` : ''}`
		);

		return searchResult;
	} catch (error) {
		console.error('[Qdrant] Error searching:', error);
		throw error;
	}
}

/**
 * Get collection info (for debugging)
 * @returns {Promise<Object>}
 */
export async function getCollectionInfo() {
	const qdrant = getQdrantClient();
	try {
		return await qdrant.getCollection(COLLECTION_NAME);
	} catch (error) {
		console.error('[Qdrant] Error getting collection info:', error);
		throw error;
	}
}
