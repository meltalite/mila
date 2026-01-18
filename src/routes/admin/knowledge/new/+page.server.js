/**
 * Create Knowledge Entry - Server Actions
 */

import { redirect, fail } from '@sveltejs/kit';
import { getTenants, createEntry } from '$lib/server/services/knowledge.js';
import { KNOWLEDGE_CATEGORIES } from '$lib/server/db/schema.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	return {
		tenants: getTenants(),
		categories: KNOWLEDGE_CATEGORIES
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const data = {
			tenant_id: formData.get('tenant_id'),
			title: formData.get('title'),
			category: formData.get('category'),
			content: formData.get('content'),
			keywords: formData.get('keywords'),
			status: formData.get('status') || 'active',
      metadata: formData.get('metadata')
		};

		// Validate
		if (!data.tenant_id || !data.title || !data.category || !data.content) {
			return fail(400, {
				error: 'Please fill in all required fields',
				data
			});
		}

		try {
			const entry = await createEntry(data);
			throw redirect(303, `/admin/knowledge/${entry.id}`);
		} catch (error) {
      if (error?.status === 303) throw error; // or: if (error instanceof Redirect)
			console.error('[Create Entry] Error:', error);
			return fail(500, {
				error: error.message,
				data
			});
		}
	}
};
