/**
 * Edit Tenant - Server Actions
 */

import { error, fail } from '@sveltejs/kit';
import { getTenant, updateTenant } from '$lib/server/services/tenant.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const tenant = getTenant(params.id);

	if (!tenant) {
		throw error(404, 'Tenant not found');
	}

	return {
		tenant
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ params, request }) => {
		const formData = await request.formData();

		const data = {
			name: formData.get('name'),
			whatsapp_number: formData.get('whatsapp_number'),
			api_keys: formData.get('api_keys'),
			settings: formData.get('settings'),
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
			const tenant = updateTenant(params.id, data);

			return { success: true, tenant };
		} catch (error) {
			console.error('[Update Tenant] Error:', error);
			return fail(500, {
				error: error.message,
				data
			});
		}
	}
};
