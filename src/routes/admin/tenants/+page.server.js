/**
 * Tenants List - Server Load
 */

import { listTenants } from '$lib/server/services/tenant.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const tenants = listTenants();

	return {
		tenants
	};
}
