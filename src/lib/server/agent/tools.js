/**
 * Claude Tool Definitions
 * Defines tools available to the AI agent for knowledge search and escalation
 */

import { randomUUID } from 'crypto';
import { embed } from '../vector/embeddings.js';
import { search } from '../vector/qdrant.js';
import { getDatabase } from '../db/index.js';
import { KNOWLEDGE_CATEGORIES } from '../db/schema.js';

/**
 * Tool definition for knowledge base search
 */
export const knowledgeSearchTool = {
	name: 'knowledge_search',
	description:
		"REQUIRED TOOL: Search the yoga studio's knowledge base for accurate, up-to-date information. You MUST use this tool for ANY question about: classes, schedules, pricing, membership, policies, facilities, location, instructors, or any studio-related information. DO NOT answer from general knowledge - always search first.",
	input_schema: {
		type: 'object',
		properties: {
			query: {
				type: 'string',
				description:
					'The search query. Use natural language that captures what the user is asking about. Include both English and Indonesian keywords if relevant (e.g., "kelas classes beginner pemula").'
			},
			category: {
				type: 'string',
				enum: KNOWLEDGE_CATEGORIES,
				description:
					'Optional category to filter results. Use if the question clearly relates to a specific category.'
			}
		},
		required: ['query']
	}
};

/**
 * Tool definition for escalating to human staff
 */
export const escalateToHumanTool = {
	name: 'escalate_to_human',
	description:
		'Escalate the conversation to human staff when the query is too complex, involves medical concerns, booking requests, payments, complaints, or anything requiring human judgment and authority.',
	input_schema: {
		type: 'object',
		properties: {
			reason: {
				type: 'string',
				description:
					'Brief explanation of why this conversation needs human attention (e.g., "medical concern about back pain", "wants to book private session", "payment issue")'
			}
		},
		required: ['reason']
	}
};

/**
 * Execute knowledge search tool
 * @param {string} tenantId - Tenant ID for filtering
 * @param {string} query - Search query
 * @param {string} [category] - Optional category filter
 * @returns {Promise<Object>} - Search results formatted for Claude
 */
export async function executeKnowledgeSearch(tenantId, query, category = null) {
	try {
		// Generate embedding for the query
		const queryEmbedding = await embed(query);

		// Search Qdrant with tenant filter
		const results = await search(queryEmbedding, tenantId, category, 7);

		if (results.length === 0) {
			return {
				found: false,
				message: 'No relevant information found in the knowledge base for this query.'
			};
		}

		// Format results for Claude
		const formattedResults = results.map((result, index) => ({
			rank: index + 1,
			title: result.payload.title,
			category: result.payload.category,
			content: result.payload.content,
			relevance_score: result.score
		}));

		return {
			found: true,
			count: results.length,
			results: formattedResults
		};
	} catch (error) {
		console.error('[Tools] Error in knowledge search:', error);
		return {
			found: false,
			error: 'Failed to search knowledge base. Please try again or ask a staff member.'
		};
	}
}

/**
 * Execute escalation to human tool
 * @param {string} tenantId - Tenant ID
 * @param {string} userPhone - User phone number
 * @param {string} reason - Reason for escalation
 * @returns {Promise<Object>} - Escalation result
 */
export async function escalateToHuman(tenantId, userPhone, reason) {
	try {
		const db = getDatabase();
		const escalationId = randomUUID();
		const now = new Date().toISOString();

		// Log escalation to database
		db.prepare(
			'INSERT INTO escalations (id, tenant_id, user_phone, reason, created_at) VALUES (?, ?, ?, ?, ?)'
		).run(escalationId, tenantId, userPhone, reason, now);

		// In production, this would trigger notifications (email, Slack, etc.)
		console.log(`[ESCALATION] ${tenantId} - ${userPhone}: ${reason}`);

		return {
			escalated: true,
			message:
				'Your question has been forwarded to our staff. They will contact you shortly to assist you personally.'
		};
	} catch (error) {
		console.error('[Tools] Error in escalation:', error);
		return {
			escalated: false,
			error: 'Failed to escalate. Please contact us directly.'
		};
	}
}
