/**
 * Structured Logging Utility
 * Simple console-based logging with consistent formatting
 */

const LOG_LEVELS = {
	DEBUG: 0,
	INFO: 1,
	WARN: 2,
	ERROR: 3
};

const currentLevel = process.env.LOG_LEVEL
	? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()]
	: LOG_LEVELS.INFO;

/**
 * Format log message with timestamp and context
 * @param {string} level
 * @param {string} message
 * @param {Object} context
 * @returns {string}
 */
function formatMessage(level, message, context = {}) {
	const timestamp = new Date().toISOString();
	const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
	return `[${timestamp}] [${level}] ${message}${contextStr}`;
}

/**
 * Debug log (only in development)
 * @param {string} message
 * @param {Object} context
 */
export function debug(message, context = {}) {
	if (currentLevel <= LOG_LEVELS.DEBUG) {
		console.debug(formatMessage('DEBUG', message, context));
	}
}

/**
 * Info log
 * @param {string} message
 * @param {Object} context
 */
export function info(message, context = {}) {
	if (currentLevel <= LOG_LEVELS.INFO) {
		console.info(formatMessage('INFO', message, context));
	}
}

/**
 * Warning log
 * @param {string} message
 * @param {Object} context
 */
export function warn(message, context = {}) {
	if (currentLevel <= LOG_LEVELS.WARN) {
		console.warn(formatMessage('WARN', message, context));
	}
}

/**
 * Error log
 * @param {string} message
 * @param {Error|Object} error
 */
export function error(message, errorObj = {}) {
	if (currentLevel <= LOG_LEVELS.ERROR) {
		const context = errorObj instanceof Error ? { error: errorObj.message, stack: errorObj.stack } : errorObj;
		console.error(formatMessage('ERROR', message, context));
	}
}

/**
 * Log WhatsApp message received
 * @param {string} from
 * @param {string} preview
 */
export function logMessageReceived(from, preview) {
	info('Message received', { from, preview: preview.substring(0, 50) });
}

/**
 * Log WhatsApp message sent
 * @param {string} to
 * @param {string} preview
 */
export function logMessageSent(to, preview) {
	info('Message sent', { to, preview: preview.substring(0, 50) });
}

/**
 * Log knowledge search
 * @param {string} query
 * @param {number} results
 */
export function logKnowledgeSearch(query, results) {
	info('Knowledge search', { query: query.substring(0, 50), results });
}

/**
 * Log escalation
 * @param {string} userPhone
 * @param {string} reason
 */
export function logEscalation(userPhone, reason) {
	warn('Escalation triggered', { userPhone, reason });
}

/**
 * Log rate limit hit
 * @param {string} userPhone
 */
export function logRateLimit(userPhone) {
	warn('Rate limit exceeded', { userPhone });
}

export default {
	debug,
	info,
	warn,
	error,
	logMessageReceived,
	logMessageSent,
	logKnowledgeSearch,
	logEscalation,
	logRateLimit
};
