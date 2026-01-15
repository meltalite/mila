/**
 * Claude AI Agent with Tool Calling
 * Main orchestration logic for processing messages with knowledge search and escalation
 */

import Anthropic from '@anthropic-ai/sdk';
import { getDatabase } from '../db/index.js';
import {
	knowledgeSearchTool,
	escalateToHumanTool,
	executeKnowledgeSearch,
	escalateToHuman
} from './tools.js';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;

/**
 * Build system prompt for the agent
 * @param {Object} tenant - Tenant object
 * @returns {string} - System prompt
 */
function buildSystemPrompt(tenant) {
	const tenantName = tenant.name;
  const settings = tenant.settings || {};
	const currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
	const greeting = settings.greeting_message || 'Hello! How can I help you today?';
  const rootGuidelines = `
- Respond in the SAME language as the user (Indonesian or English). If they write in Indonesian, respond in Indonesian. If in English, respond in English.
- Be warm, welcoming, and concise. This is WhatsApp - keep responses to 2-4 sentences when possible.
- ALWAYS search the knowledge base before answering questions about the studio.
- Use natural, conversational Bahasa Indonesia when responding in Indonesian. Slang words are preferable than formal.
- For medical concerns (pain, injuries, pregnancy), booking requests, payment issues, or complex matters, escalate to human staff.
- When guidelines conflict, tenant-specific guidelines take precedence over root guidelines.
  `;

	return `You are a helpful customer service assistant for ${tenantName}, a yoga studio.

You have access to tools to help answer questions:
- knowledge_search: Search the studio's information database for classes, pricing, policies, facilities, etc.
- escalate_to_human: Escalate complex queries to staff members

Root Guidelines: ${rootGuidelines}

Additional Tenant Guidelines:
- ${settings.basic_guidelines || 'None'}

Current time: ${currentTime}

Greeting message: ${greeting}`;
}

/**
 * Process a user message with the AI agent
 * @param {string} tenantId - Tenant ID
 * @param {string} userPhone - User phone number
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous messages [{role, content}]
 * @returns {Promise<string>} - Agent's response
 */
export async function processMessage(tenantId, userPhone, userMessage, conversationHistory = []) {
	const db = getDatabase();

	// Load tenant
	const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);

	if (!tenant) {
		throw new Error(`Tenant not found: ${tenantId}`);
	}

	// Parse tenant settings
	tenant.settings = tenant.settings ? JSON.parse(tenant.settings) : {};
	tenant.api_keys = tenant.api_keys ? JSON.parse(tenant.api_keys) : {};

	// Get API key (prefer tenant-specific, fallback to global)
	const apiKey = ANTHROPIC_API_KEY;

	if (!apiKey) {
		throw new Error('Anthropic API key not configured');
	}

	// Initialize Anthropic client
	const anthropic = new Anthropic({ apiKey });

	// Build system prompt
	const systemPrompt = buildSystemPrompt(tenant);

	// Prepare messages array with history
	const messages = [
		...conversationHistory,
		{
			role: 'user',
			content: userMessage
		}
	];

	try {
		// Call Claude with tools
		let response = await anthropic.messages.create({
			model: MODEL,
			max_tokens: MAX_TOKENS,
			system: systemPrompt,
			messages: messages,
			tools: [knowledgeSearchTool, escalateToHumanTool]
		});

		console.log(`[Agent] Initial response - stop_reason: ${response.stop_reason}`);

		// Handle tool use loop
		while (response.stop_reason === 'tool_use') {
			const toolUses = response.content.filter((block) => block.type === 'tool_use');

			console.log(`[Agent] Processing ${toolUses.length} tool call(s)`);

			// Execute all tool calls
			const toolResults = [];
			for (const toolUse of toolUses) {
				console.log(`[Agent] Executing tool: ${toolUse.name}`);

				let result;
				if (toolUse.name === 'knowledge_search') {
					result = await executeKnowledgeSearch(
						tenantId,
						toolUse.input.query,
						toolUse.input.category
					);
				} else if (toolUse.name === 'escalate_to_human') {
					result = await escalateToHuman(tenantId, userPhone, toolUse.input.reason);
				} else {
					result = { error: 'Unknown tool' };
				}

				toolResults.push({
					type: 'tool_result',
					tool_use_id: toolUse.id,
					content: JSON.stringify(result)
				});
			}

			// Continue conversation with tool results
			messages.push({
				role: 'assistant',
				content: response.content
			});

			messages.push({
				role: 'user',
				content: toolResults
			});

			// Call Claude again with tool results
			response = await anthropic.messages.create({
				model: MODEL,
				max_tokens: MAX_TOKENS,
				system: systemPrompt,
				messages: messages,
				tools: [knowledgeSearchTool, escalateToHumanTool]
			});

			console.log(`[Agent] Continuation response - stop_reason: ${response.stop_reason}`);
		}

		// Extract final text response
		const textBlocks = response.content.filter((block) => block.type === 'text');
		const finalResponse = textBlocks.map((block) => block.text).join('\n');

		console.log(`[Agent] Final response length: ${finalResponse.length} chars`);

		return finalResponse;
	} catch (error) {
		console.error('[Agent] Error processing message:', error);
		throw error;
	}
}
