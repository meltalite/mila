/**
 * Edit Knowledge Entry - Server Actions
 */

import { redirect, fail, error } from '@sveltejs/kit';
import { getEntry, updateEntry, getTenants } from '$lib/server/services/knowledge.js';
import { KNOWLEDGE_CATEGORIES } from '$lib/server/db/schema.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const entry = getEntry(params.id);

	if (!entry) {
		throw error(404, 'Knowledge entry not found');
	}

	return {
		entry,
		tenants: getTenants(),
		categories: KNOWLEDGE_CATEGORIES
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ params, request }) => {
		const formData = await request.formData();

		const data = {
			title: formData.get('title'),
			category: formData.get('category'),
			content: formData.get('content'),
			keywords: formData.get('keywords'),
			status: formData.get('status'),
      metadata: formData.get('metadata')
		};
    console.log('Metadata received:', data.metadata);

		// Validate
		if (!data.title || !data.category || !data.content) {
			return fail(400, {
				error: 'Please fill in all required fields',
				data
			});
		}

		try {
			await updateEntry(params.id, data);
			throw redirect(303, `/admin/knowledge/${params.id}`);
		} catch (error) {
      if (error?.status === 303) throw error; // or: if (error instanceof Redirect)
			console.error('[Update Entry] Error:', error);
			return fail(500, {
				error: error.message,
				data
			});
		}
	}
};
