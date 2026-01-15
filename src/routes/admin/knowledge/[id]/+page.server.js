/**
 * View Knowledge Entry - Server Load
 */

import { error } from '@sveltejs/kit';
import { getEntry } from '$lib/server/services/knowledge.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const entry = getEntry(params.id);

	if (!entry) {
		throw error(404, 'Knowledge entry not found');
	}

	return {
		entry
	};
}
