/**
 * Auto Chunker - Server Load
 */

import { getTenants } from '$lib/server/services/knowledge.js';
import { KNOWLEDGE_CATEGORIES } from '$lib/server/db/schema.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const tenants = getTenants();

	return {
		tenants,
		categories: KNOWLEDGE_CATEGORIES
	};
}
