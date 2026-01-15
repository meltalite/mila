/**
 * Create Tenant - Server Actions
 */

import { redirect, fail } from '@sveltejs/kit';
import { createTenant } from '$lib/server/services/tenant.js';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const data = {
			name: formData.get('name'),
			whatsapp_number: formData.get('whatsapp_number'),
			api_keys: formData.get('api_keys') || '{}',
			settings: formData.get('settings') || '{}',
			active: formData.get('active') === 'true'
		};

		// Validate
		if (!data.name) {
			return fail(400, {
				error: 'Tenant name is required',
				data
			});
		}

		try {
			const tenant = createTenant(data);
			throw redirect(303, `/admin/tenants/${tenant.id}`);
		} catch (error) {
			console.error('[Create Tenant] Error:', error);
			return fail(500, {
				error: error.message,
				data
			});
		}
	}
};
