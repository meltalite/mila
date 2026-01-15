/**
 * Conversation History Management
 * Stores and retrieves conversation history for maintaining context
 */

import { randomUUID } from 'crypto';
import { getDatabase } from '../db/index.js';

/**
 * Get conversation history for a user
 * @param {string} tenantId - Tenant ID
 * @param {string} userPhone - User phone number
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Array} - Array of {role, content} message objects
 */
export function getConversationHistory(tenantId, userPhone, limit = 10) {
	const db = getDatabase();

	const conversation = db
		.prepare('SELECT messages FROM conversations WHERE tenant_id = ? AND user_phone = ?')
		.get(tenantId, userPhone);

	if (!conversation) {
		return [];
	}

	const allMessages = JSON.parse(conversation.messages);

	// Return last N messages
	return allMessages.slice(-limit).map((msg) => ({
		role: msg.role,
		content: msg.content
	}));
}

/**
 * Save conversation messages
 * @param {string} tenantId - Tenant ID
 * @param {string} userPhone - User phone number
 * @param {Array} newMessages - Array of {role, content} to append
 */
export function saveConversation(tenantId, userPhone, newMessages) {
	const db = getDatabase();

	// Get existing conversation
	const existing = db
		.prepare('SELECT id, messages FROM conversations WHERE tenant_id = ? AND user_phone = ?')
		.get(tenantId, userPhone);

	const now = new Date().toISOString();

	if (existing) {
		// Append to existing conversation
		const allMessages = JSON.parse(existing.messages);

		// Add timestamps to new messages
		const timestampedMessages = newMessages.map((msg) => ({
			...msg,
			timestamp: now
		}));

		allMessages.push(...timestampedMessages);

		// Keep only last 20 messages to prevent unbounded growth
		const trimmedMessages = allMessages.slice(-20);

		db.prepare(
			'UPDATE conversations SET messages = ?, last_message_at = ? WHERE id = ?'
		).run(JSON.stringify(trimmedMessages), now, existing.id);
	} else {
		// Create new conversation
		const id = randomUUID();
		const timestampedMessages = newMessages.map((msg) => ({
			...msg,
			timestamp: now
		}));

		db.prepare(
			'INSERT INTO conversations (id, tenant_id, user_phone, messages, last_message_at) VALUES (?, ?, ?, ?, ?)'
		).run(id, tenantId, userPhone, JSON.stringify(timestampedMessages), now);
	}
}

/**
 * Clean up old conversations (older than 7 days)
 * Should be run periodically
 * @returns {number} - Number of conversations deleted
 */
export function cleanupOldConversations() {
	const db = getDatabase();

	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	const result = db
		.prepare('DELETE FROM conversations WHERE last_message_at < ?')
		.run(sevenDaysAgo.toISOString());

	console.log(`[Conversations] Cleaned up ${result.changes} old conversations`);

	return result.changes;
}
