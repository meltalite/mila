/**
 * Tenants API Endpoints
 * REST API for tenant CRUD operations
 */

import { json } from '@sveltejs/kit';
import {
	listTenants,
	getTenant,
	createTenant,
	updateTenant,
	deleteTenant,
	toggleTenantActive
} from '$lib/server/services/tenant.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const id = url.searchParams.get('id');

		if (id) {
			// Get single tenant
			const tenant = getTenant(id);
			if (!tenant) {
				return json({ success: false, error: 'Tenant not found' }, { status: 404 });
			}
			return json({ success: true, data: tenant });
		}

		// List all tenants
		const activeOnly = url.searchParams.get('active_only') === 'true';
		const tenants = listTenants({ activeOnly });

		return json({ success: true, data: tenants });
	} catch (error) {
		console.error('[API] Error listing tenants:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const data = await request.json();

		// Validate required fields
		if (!data.name) {
			return json({ success: false, error: 'Missing required field: name' }, { status: 400 });
		}

		const tenant = createTenant(data);

		return json({ success: true, data: tenant }, { status: 201 });
	} catch (error) {
		console.error('[API] Error creating tenant:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request }) {
	try {
		const data = await request.json();

		if (!data.id) {
			return json({ success: false, error: 'Missing tenant ID' }, { status: 400 });
		}

		const tenant = updateTenant(data.id, data);

		return json({ success: true, data: tenant });
	} catch (error) {
		console.error('[API] Error updating tenant:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url }) {
	try {
		const id = url.searchParams.get('id');

		if (!id) {
			return json({ success: false, error: 'Missing tenant ID' }, { status: 400 });
		}

		deleteTenant(id);

		return json({ success: true });
	} catch (error) {
		console.error('[API] Error deleting tenant:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ request }) {
	try {
		const { id, action } = await request.json();

		if (!id) {
			return json({ success: false, error: 'Missing tenant ID' }, { status: 400 });
		}

		if (action === 'toggle_active') {
			const tenant = toggleTenantActive(id);
			return json({ success: true, data: tenant });
		}

		return json({ success: false, error: 'Unknown action' }, { status: 400 });
	} catch (error) {
		console.error('[API] Error patching tenant:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
