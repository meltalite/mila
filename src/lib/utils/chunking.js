import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Split text into chunks using LangChain's RecursiveCharacterTextSplitter
 * @param {string} text - The text to chunk
 * @param {Object} options - Chunking options
 * @param {number} options.chunkSize - Target chunk size in characters (default: 500)
 * @param {number} options.chunkOverlap - Overlap between chunks in characters (default: 100)
 * @returns {Promise<Array>} Array of chunk objects with id, title, content, keywords, metadata
 */
export async function chunkText(text, options = {}) {
	const { chunkSize = 500, chunkOverlap = 100 } = options;

	// Validate input
	if (!text || typeof text !== 'string') {
		throw new Error('Text must be a non-empty string');
	}

	if (text.trim().length === 0) {
		throw new Error('Text cannot be empty');
	}

	// Create the splitter with smart separators
	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize,
		chunkOverlap,
		separators: ['\n\n', '\n', '. ', ' ', '']
	});

	// Split the text into documents
	const chunks = await splitter.createDocuments([text]);

	// Transform into our chunk format
	return chunks.map((chunk, i) => ({
		id: crypto.randomUUID(),
		title: generateTitle(chunk.pageContent, i + 1),
		content: chunk.pageContent,
		keywords: '',
		metadata: {
			chunkIndex: i,
			totalChunks: chunks.length,
			chunkSize: chunk.pageContent.length
		}
	}));
}

/**
 * Generate a title for a chunk based on its content
 * @param {string} content - The chunk content
 * @param {number} index - The chunk index (1-based)
 * @returns {string} Generated title
 */
function generateTitle(content, index) {
	// Try to get the first sentence
	const firstSentence = content.split(/[.!?]/)[0].trim();

	// Take first 8 words
	const words = firstSentence.split(/\s+/);
	const truncated = words.slice(0, 8).join(' ');

	// Add ellipsis if truncated
	const suffix = words.length > 8 ? '...' : '';

	return `Part ${index}: ${truncated}${suffix}`;
}

/**
 * Validate chunk quality
 * @param {Object} chunk - The chunk to validate
 * @returns {Object} Validation result with isValid and warnings
 */
export function validateChunk(chunk) {
	const warnings = [];
	const length = chunk.content.length;

	if (length < 50) {
		warnings.push('Chunk is very short (< 50 characters)');
	}

	if (length > 2000) {
		warnings.push('Chunk is very long (> 2000 characters)');
	}

	if (!chunk.title || chunk.title.trim().length === 0) {
		warnings.push('Chunk has no title');
	}

	// Check for incomplete sentences
	const lastChar = chunk.content.trim().slice(-1);
	if (!['.', '!', '?', '"', "'", ')'].includes(lastChar)) {
		warnings.push('Chunk may end mid-sentence');
	}

	return {
		isValid: warnings.length === 0,
		warnings,
		quality: getChunkQuality(length)
	};
}

/**
 * Get chunk quality rating based on length
 * @param {number} length - Chunk length in characters
 * @returns {string} Quality rating: 'excellent', 'good', 'fair', 'poor'
 */
function getChunkQuality(length) {
	if (length >= 300 && length <= 800) return 'excellent';
	if (length >= 150 && length <= 1200) return 'good';
	if (length >= 50 && length <= 2000) return 'fair';
	return 'poor';
}

/**
 * Merge two or more chunks together
 * @param {Array} chunks - Array of chunks to merge
 * @param {string} newTitle - Optional new title for merged chunk
 * @returns {Object} Merged chunk
 */
export function mergeChunks(chunks, newTitle = null) {
	if (!chunks || chunks.length === 0) {
		throw new Error('No chunks to merge');
	}

	if (chunks.length === 1) {
		return chunks[0];
	}

	const mergedContent = chunks.map(c => c.content).join('\n\n');
	const mergedKeywords = [...new Set(
		chunks.flatMap(c => c.keywords ? c.keywords.split(',').map(k => k.trim()) : [])
	)].join(', ');

	return {
		id: crypto.randomUUID(),
		title: newTitle || `Merged: ${chunks[0].title}`,
		content: mergedContent,
		keywords: mergedKeywords,
		metadata: {
			mergedFrom: chunks.map(c => c.id),
			mergedCount: chunks.length
		}
	};
}

/**
 * Split a chunk into two chunks at a specified position
 * @param {Object} chunk - The chunk to split
 * @param {number} splitPosition - Character position to split at
 * @returns {Array} Array of two chunks
 */
export function splitChunk(chunk, splitPosition) {
	if (!chunk || !chunk.content) {
		throw new Error('Invalid chunk');
	}

	if (splitPosition <= 0 || splitPosition >= chunk.content.length) {
		throw new Error('Invalid split position');
	}

	const content1 = chunk.content.substring(0, splitPosition).trim();
	const content2 = chunk.content.substring(splitPosition).trim();

	return [
		{
			id: crypto.randomUUID(),
			title: generateTitle(content1, 1),
			content: content1,
			keywords: chunk.keywords,
			metadata: { ...chunk.metadata, splitFrom: chunk.id }
		},
		{
			id: crypto.randomUUID(),
			title: generateTitle(content2, 2),
			content: content2,
			keywords: chunk.keywords,
			metadata: { ...chunk.metadata, splitFrom: chunk.id }
		}
	];
}
