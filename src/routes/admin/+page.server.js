/**
 * Dashboard - Server Load
 * Loads real statistics for the dashboard
 */

import { getDatabase } from '$lib/server/db/index.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const db = getDatabase();

	// Get statistics
	const stats = {
		// Knowledge entries count
		knowledge_entries: db
			.prepare('SELECT COUNT(*) as count FROM knowledge_entries WHERE status = ?')
			.get('active').count,

		// Active tenants count
		active_tenants: db.prepare('SELECT COUNT(*) as count FROM tenants WHERE active = 1').get()
			.count,

		// Messages today
		messages_today: db
			.prepare(
				`SELECT SUM(
					CASE
						WHEN messages IS NOT NULL AND messages != '[]'
						THEN json_array_length(messages)
						ELSE 0
					END
				) as count
				FROM conversations
				WHERE DATE(last_message_at) = DATE('now')`
			)
			.get().count || 0,

		// Total conversations
		total_conversations: db.prepare('SELECT COUNT(*) as count FROM conversations').get().count,

		// Escalations today
		escalations_today: db
			.prepare(
				`SELECT COUNT(*) as count FROM escalations
				WHERE DATE(created_at) = DATE('now')`
			)
			.get().count
	};

	// Recent conversations (last 5)
	const recentConversations = db
		.prepare(
			`SELECT
				c.user_phone,
				c.last_message_at,
				t.name as tenant_name,
				c.messages
			FROM conversations c
			LEFT JOIN tenants t ON c.tenant_id = t.id
			ORDER BY c.last_message_at DESC
			LIMIT 5`
		)
		.all();

	// Parse messages and get last message
	const recentActivity = recentConversations.map((conv) => {
		const messages = JSON.parse(conv.messages || '[]');
		const lastMessage = messages[messages.length - 1];
		return {
			user_phone: conv.user_phone.split('@')[0], // Clean phone number
			tenant_name: conv.tenant_name,
			last_message_at: conv.last_message_at,
			preview: lastMessage
				? lastMessage.content.substring(0, 60) + (lastMessage.content.length > 60 ? '...' : '')
				: 'No messages'
		};
	});

	return {
		stats,
		recentActivity
	};
}
