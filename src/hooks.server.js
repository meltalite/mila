/**
 * SvelteKit Server Hooks
 * Implements Basic HTTP Authentication for admin routes
 */

import { initWhatsAppClient } from '$lib/server/whatsapp/client.js';
import { initCollection } from '$lib/server/vector/qdrant.js';
import { initDatabase } from '$lib/server/db/index.js';

// Initialize services on server start
let initialized = false;
async function initializeServices() {
	if (initialized) return;

	// Skip initialization in production (handled by scripts/start.js)
	if (process.env.NODE_ENV === 'production') {
		console.log('[Server] Skipping initialization in production mode (handled by startup script)');
		initialized = true;
		return;
	}

	console.log('[Server] Initializing services...');

	try {
		// Initialize database
		initDatabase();

		// Initialize Qdrant collection
		await initCollection();

		// Initialize WhatsApp client
		initWhatsAppClient();

		initialized = true;
		console.log('[Server] ✅ All services initialized');
	} catch (error) {
		console.error('[Server] ❌ Error initializing services:', error);
	}
}

// Start initialization (non-blocking)
initializeServices();

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	// Check if route starts with /admin
	if (event.url.pathname.startsWith('/admin')) {
		const authHeader = event.request.headers.get('authorization');

		if (!authHeader) {
			return new Response('Unauthorized', {
				status: 401,
				headers: {
					'WWW-Authenticate': 'Basic realm="Admin Area", charset="UTF-8"'
				}
			});
		}

		// Parse Basic Auth credentials
		const base64Credentials = authHeader.split(' ')[1];
		const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
		const [username, password] = credentials.split(':');

		// Validate credentials
		const validUsername = process.env.ADMIN_USER || 'admin';
		const validPassword = process.env.ADMIN_PASS || 'changeme';

		if (username !== validUsername || password !== validPassword) {
			return new Response('Unauthorized', {
				status: 401,
				headers: {
					'WWW-Authenticate': 'Basic realm="Admin Area", charset="UTF-8"'
				}
			});
		}

		// Store authenticated user in locals
		event.locals.user = { username };
	}

	return resolve(event);
}
