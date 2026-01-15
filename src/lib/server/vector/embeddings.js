/**
 * OpenAI Embeddings Service
 * Generates vector embeddings using text-embedding-3-small model
 */

import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 1536-dimensional embedding vector
 */
export async function embed(text) {
	try {
		const response = await openai.embeddings.create({
			model: EMBEDDING_MODEL,
			input: text,
			encoding_format: 'float'
		});

		return response.data[0].embedding;
	} catch (error) {
		console.error('[Embeddings] Error generating embedding:', error);
		throw error;
	}
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling embed() multiple times
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function embedBatch(texts) {
	try {
		const response = await openai.embeddings.create({
			model: EMBEDDING_MODEL,
			input: texts,
			encoding_format: 'float'
		});

		return response.data.map((item) => item.embedding);
	} catch (error) {
		console.error('[Embeddings] Error generating batch embeddings:', error);
		throw error;
	}
}

/**
 * Get embedding dimensions (for validation)
 * @returns {number} - Dimension size
 */
export function getEmbeddingDimensions() {
	return EMBEDDING_DIMENSIONS;
}
