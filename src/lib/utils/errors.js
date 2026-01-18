/**
 * Centralized Error Handling
 * Provides consistent error formatting and handling across the application
 */

/**
 * Format API error response
 * @param {Error} error
 * @returns {Object}
 */
export function formatApiError(error) {
	console.error('[API Error]', error);

	return {
		error: {
			message: error.message || 'An unexpected error occurred',
			code: error.code || 'INTERNAL_ERROR',
			details: process.env.NODE_ENV === 'development' ? error.stack : undefined
		}
	};
}

/**
 * Handle database errors
 * @param {Error} error
 * @returns {Error}
 */
export function handleDatabaseError(error) {
	console.error('[Database Error]', error);

	// SQLite specific errors
	if (error.code === 'SQLITE_CONSTRAINT') {
		return new Error('Database constraint violation: This operation violates data integrity rules');
	}

	if (error.code === 'SQLITE_BUSY') {
		return new Error('Database is busy. Please try again in a moment');
	}

	if (error.code === 'SQLITE_LOCKED') {
		return new Error('Database is locked. Please try again');
	}

	return new Error('Database operation failed: ' + error.message);
}

/**
 * Handle vector database errors
 * @param {Error} error
 * @returns {Error}
 */
export function handleVectorError(error) {
	console.error('[Vector DB Error]', error);

	if (error.message?.includes('timeout')) {
		return new Error('Vector database timeout. Please check if Qdrant is running');
	}

	if (error.message?.includes('connection')) {
		return new Error('Cannot connect to vector database. Please check Qdrant configuration');
	}

	if (error.message?.includes('dimension')) {
		return new Error('Vector dimension mismatch. Please check embedding configuration');
	}

	return new Error('Vector database operation failed: ' + error.message);
}

/**
 * Handle WhatsApp client errors
 * @param {Error} error
 * @returns {Error}
 */
export function handleWhatsAppError(error) {
	console.error('[WhatsApp Error]', error);

	if (error.message?.includes('not ready')) {
		return new Error('WhatsApp client is not ready. Please scan QR code');
	}

	if (error.message?.includes('disconnected')) {
		return new Error('WhatsApp client disconnected. Attempting to reconnect...');
	}

	if (error.message?.includes('rate limit')) {
		return new Error('Rate limit exceeded. Please wait before sending more messages');
	}

	return new Error('WhatsApp operation failed: ' + error.message);
}

/**
 * Handle AI/LLM errors
 * @param {Error} error
 * @returns {Error}
 */
export function handleAIError(error) {
	console.error('[AI Error]', error);

	if (error.message?.includes('timeout')) {
		return new Error('AI request timed out. Please try again');
	}

	if (error.message?.includes('rate limit') || error.status === 429) {
		return new Error('AI service rate limit exceeded. Please try again in a moment');
	}

	if (error.message?.includes('quota') || error.status === 402) {
		return new Error('AI service quota exceeded. Please check your API credits');
	}

	if (error.status === 401 || error.status === 403) {
		return new Error('AI service authentication failed. Please check your API key');
	}

	return new Error('AI service error: ' + error.message);
}

/**
 * Validate input and throw error if invalid
 * @param {any} value
 * @param {string} fieldName
 * @param {Object} rules
 */
export function validateInput(value, fieldName, rules = {}) {
	if (rules.required && !value) {
		throw new Error(`${fieldName} is required`);
	}

	if (rules.minLength && value.length < rules.minLength) {
		throw new Error(`${fieldName} must be at least ${rules.minLength} characters`);
	}

	if (rules.maxLength && value.length > rules.maxLength) {
		throw new Error(`${fieldName} must be no more than ${rules.maxLength} characters`);
	}

	if (rules.pattern && !rules.pattern.test(value)) {
		throw new Error(`${fieldName} format is invalid`);
	}

	if (rules.enum && !rules.enum.includes(value)) {
		throw new Error(`${fieldName} must be one of: ${rules.enum.join(', ')}`);
	}
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn
 * @param {number} maxRetries
 * @param {number} baseDelay
 * @returns {Promise<any>}
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
	let lastError;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			if (i < maxRetries - 1) {
				const delay = baseDelay * Math.pow(2, i);
				console.log(`[Retry] Attempt ${i + 1} failed, retrying in ${delay}ms...`);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError;
}
