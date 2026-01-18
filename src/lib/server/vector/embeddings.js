/**
 * OpenAI Embeddings Service
 * Generates vector embeddings using text-embedding-3-small model
 */

import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

let openaiClient;

/**
 * Get or create OpenAI client (lazy initialization)
 * @returns {OpenAI} - OpenAI client instance
 */
function getOpenAI() {
	if (!openaiClient) {
		openaiClient = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY
		});
	}
	return openaiClient;
}

/**
 * Generate embedding for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 1536-dimensional embedding vector
 */
export async function embed(text) {
	try {
		const openai = getOpenAI();
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
		const openai = getOpenAI();
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
