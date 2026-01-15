/**
 * Knowledge Base List - Server Load
 */

import { listEntries, getTenants } from '$lib/server/services/knowledge.js';
import { KNOWLEDGE_CATEGORIES } from '$lib/server/db/schema.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
	const filters = {
		tenantId: url.searchParams.get('tenant_id') || undefined,
		category: url.searchParams.get('category') || undefined,
		status: url.searchParams.get('status') || undefined,
		search: url.searchParams.get('search') || undefined
	};

	const entries = listEntries(filters);
	const tenants = getTenants();

	return {
		entries,
		tenants,
		categories: KNOWLEDGE_CATEGORIES,
		filters
	};
}
