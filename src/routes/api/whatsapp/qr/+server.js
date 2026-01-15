/**
 * WhatsApp QR Code API
 * Returns current QR code data URL
 */

import { json } from '@sveltejs/kit';
import { getQR } from '$lib/server/whatsapp/state.js';

/** @type {import('./$types').RequestHandler} */
export function GET() {
	const qr = getQR();

	return json({
		qr,
		available: qr !== null
	});
}
