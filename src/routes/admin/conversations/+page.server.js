/**
 * Conversations List - Server Load
 */

import { getDatabase } from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
	const db = getDatabase();

	// Get filter parameters
	const tenantId = url.searchParams.get('tenant_id');
	const limit = parseInt(url.searchParams.get('limit') || '50');

	// Build query
	let query = `
		SELECT
			c.*,
			t.name as tenant_name
		FROM conversations c
		LEFT JOIN tenants t ON c.tenant_id = t.id
		WHERE 1=1
	`;
	const params = [];

	if (tenantId) {
		query += ' AND c.tenant_id = ?';
		params.push(tenantId);
	}

	query += ' ORDER BY c.last_message_at DESC LIMIT ?';
	params.push(limit);

	const conversations = db.prepare(query).all(...params);

	// Parse messages JSON
	const conversationsWithParsedMessages = conversations.map((conv) => ({
		...conv,
		messages: JSON.parse(conv.messages || '[]'),
		message_count: JSON.parse(conv.messages || '[]').length
	}));

	// Get tenants for filter
	const tenants = db.prepare('SELECT id, name FROM tenants ORDER BY name').all();

	// Get statistics
	const stats = {
		total_conversations: db.prepare('SELECT COUNT(*) as count FROM conversations').get().count,
		total_messages: db
			.prepare(
				`SELECT SUM(json_array_length(messages)) as count FROM conversations WHERE messages IS NOT NULL AND messages != '[]'`
			)
			.get().count,
		conversations_today: db
			.prepare(
				`SELECT COUNT(*) as count FROM conversations
				WHERE DATE(last_message_at) = DATE('now')`
			)
			.get().count
	};

	return {
		conversations: conversationsWithParsedMessages,
		tenants,
		stats,
		filters: { tenantId, limit }
	};
}
