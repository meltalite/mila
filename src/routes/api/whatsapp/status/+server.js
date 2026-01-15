/**
 * WhatsApp Status API
 * Returns current connection status
 */

import { json } from '@sveltejs/kit';
import { getStatus } from '$lib/server/whatsapp/state.js';

/** @type {import('./$types').RequestHandler} */
export function GET() {
	const status = getStatus();

	return json({
		status,
		timestamp: new Date().toISOString()
	});
}
