/**
 * Startup Utilities
 * Helper functions for application initialization and lifecycle management
 */

import { getQdrantClient } from './vector/qdrant.js';
import { cleanupOldConversations } from './services/conversation.js';

/**
 * Wait for Qdrant to be available
 * @param {string} url - Qdrant URL
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>}
 */
export async function waitForQdrant(url, timeout = 30000) {
	const startTime = Date.now();
	const checkInterval = 1000; // Check every 1 second

	console.log(`[Startup] Waiting for Qdrant at ${url}...`);

	while (Date.now() - startTime < timeout) {
		try {
			const client = getQdrantClient();
			await client.getCollections();
			console.log('[Startup] ✓ Qdrant is ready');
			return true;
		} catch (error) {
			// Qdrant not ready yet, wait and retry
			await new Promise((resolve) => setTimeout(resolve, checkInterval));
		}
	}

	throw new Error(`Qdrant not available after ${timeout}ms`);
}

/**
 * Perform startup cleanup tasks
 * @returns {Promise<void>}
 */
export async function performStartupCleanup() {
	console.log('[Startup] Running cleanup tasks...');

	try {
		// Clean up old conversations (older than 7 days)
		cleanupOldConversations();

		console.log('[Startup] ✓ Cleanup complete');
	} catch (error) {
		console.error('[Startup] Cleanup error:', error);
		// Don't fail startup on cleanup errors
	}
}

/**
 * Graceful shutdown handler
 * @param {Object} whatsappClient - WhatsApp client instance
 * @param {Function} exitCallback - Callback to exit process
 */
export async function gracefulShutdown(whatsappClient, exitCallback) {
	console.log('\n[Shutdown] Received shutdown signal');
	console.log('[Shutdown] Gracefully shutting down...');

	try {
		// Destroy WhatsApp client
		if (whatsappClient) {
			console.log('[Shutdown] Closing WhatsApp client...');
			await whatsappClient.destroy();
			console.log('[Shutdown] ✓ WhatsApp client closed');
		}

		// Close database connections (handled by better-sqlite3 automatically on process exit)
		console.log('[Shutdown] ✓ Database connections closed');

		console.log('[Shutdown] ✓ Shutdown complete');

		// Exit
		if (exitCallback) {
			exitCallback(0);
		}
	} catch (error) {
		console.error('[Shutdown] Error during shutdown:', error);
		if (exitCallback) {
			exitCallback(1);
		}
	}
}

/**
 * Setup shutdown handlers
 * @param {Object} whatsappClient - WhatsApp client instance
 */
export function setupShutdownHandlers(whatsappClient) {
	// Handle SIGINT (Ctrl+C)
	process.on('SIGINT', async () => {
		await gracefulShutdown(whatsappClient, (code) => process.exit(code));
	});

	// Handle SIGTERM (Docker stop, systemd stop, etc.)
	process.on('SIGTERM', async () => {
		await gracefulShutdown(whatsappClient, (code) => process.exit(code));
	});

	// Handle uncaught errors
	process.on('uncaughtException', (error) => {
		console.error('[Error] Uncaught exception:', error);
		gracefulShutdown(whatsappClient, (code) => process.exit(1));
	});

	process.on('unhandledRejection', (reason, promise) => {
		console.error('[Error] Unhandled rejection at:', promise, 'reason:', reason);
		// Don't exit on unhandled rejections, just log them
	});
}
