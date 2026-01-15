/**
 * Knowledge Base API Endpoints
 * REST API for knowledge entry CRUD operations
 */

import { json } from '@sveltejs/kit';
import {
	listEntries,
	getEntry,
	createEntry,
	updateEntry,
	deleteEntryById
} from '$lib/server/services/knowledge.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const filters = {
			tenantId: url.searchParams.get('tenant_id'),
			category: url.searchParams.get('category'),
			status: url.searchParams.get('status'),
			search: url.searchParams.get('search')
		};

		// Remove null/undefined filters
		Object.keys(filters).forEach((key) => {
			if (!filters[key]) delete filters[key];
		});

		const entries = listEntries(filters);

		return json({ success: true, data: entries });
	} catch (error) {
		console.error('[API] Error listing knowledge entries:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const data = await request.json();

		// Validate required fields
		if (!data.tenant_id || !data.title || !data.category || !data.content) {
			return json(
				{ success: false, error: 'Missing required fields: tenant_id, title, category, content' },
				{ status: 400 }
			);
		}

		const entry = await createEntry(data);

		return json({ success: true, data: entry }, { status: 201 });
	} catch (error) {
		console.error('[API] Error creating knowledge entry:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request }) {
	try {
		const data = await request.json();

		if (!data.id) {
			return json({ success: false, error: 'Missing entry ID' }, { status: 400 });
		}

		const entry = await updateEntry(data.id, data);

		return json({ success: true, data: entry });
	} catch (error) {
		console.error('[API] Error updating knowledge entry:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url }) {
	try {
		const id = url.searchParams.get('id');

		if (!id) {
			return json({ success: false, error: 'Missing entry ID' }, { status: 400 });
		}

		await deleteEntryById(id);

		return json({ success: true });
	} catch (error) {
		console.error('[API] Error deleting knowledge entry:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
