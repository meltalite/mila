/**
 * WhatsApp Message Handler
 * Processes incoming messages with rate limiting and AI agent integration
 */

import { getDatabase } from '../db/index.js';
import { processMessage } from '../agent/claude-agent.js';
import { getConversationHistory, saveConversation } from '../services/conversation.js';

// Rate limiting: Map of phone number -> {count, resetTime}
const userMessageCounts = new Map();
const RATE_LIMIT = 10; // messages per minute
const RATE_WINDOW = 60000; // 1 minute in milliseconds

/**
 * Find tenant by WhatsApp number
 * @param {string} whatsappNumber - WhatsApp number (from message.to)
 * @returns {Object|null} - Tenant object or null
 */
function findTenantByWhatsApp(whatsappNumber) {
	const db = getDatabase();

	// Clean the number (remove @c.us or other suffixes)
	const cleanNumber = whatsappNumber.split('@')[0];

	const tenant = db
		.prepare('SELECT * FROM tenants WHERE whatsapp_number = ? AND active = 1')
		.get(cleanNumber);

	return tenant;
}

/**
 * Check rate limit for user
 * @param {string} userPhone - User phone number
 * @returns {boolean} - True if allowed, false if rate limited
 */
function checkRateLimit(userPhone) {
	const now = Date.now();
	const userLimit = userMessageCounts.get(userPhone);

	if (!userLimit || now > userLimit.resetTime) {
		// Reset or initialize counter
		userMessageCounts.set(userPhone, {
			count: 1,
			resetTime: now + RATE_WINDOW
		});
		return true;
	}

	if (userLimit.count >= RATE_LIMIT) {
		// Rate limit exceeded
		return false;
	}

	// Increment counter
	userLimit.count++;
	userMessageCounts.set(userPhone, userLimit);
	return true;
}

/**
 * Handle incoming WhatsApp message
 * @param {Message} message - WhatsApp message object
 */
export async function handleMessage(message) {
	try {
		const userPhone = message.from;
		const messageText = message.body;

    if (messageText === '!ping') {
      await message.reply('pong');
      return;
    }

		console.log(`[WhatsApp Handler] Message from ${userPhone}: ${messageText}`);

		// Check rate limit
		if (!checkRateLimit(userPhone)) {
			console.log(`[WhatsApp Handler] Rate limit exceeded for ${userPhone}`);
			await message.reply('Please wait a moment before sending another message.');
			return;
		}

		// Find tenant by WhatsApp number
		const tenant = findTenantByWhatsApp(message.to);

		if (!tenant) {
			console.log(`[WhatsApp Handler] No active tenant found for ${message.to}`);
			// Could send a default message or just ignore
			return;
		}

		console.log(`[WhatsApp Handler] Tenant: ${tenant.name} (ID: ${tenant.id})`);

		// Load conversation history (last 5 messages)
		const history = getConversationHistory(tenant.id, userPhone, 5);

		console.log(`[WhatsApp Handler] Loaded ${history.length} previous messages`);

		// Process message with AI agent
		const agentResponse = await processMessage(tenant.id, userPhone, messageText, history);

		console.log(`[WhatsApp Handler] Agent response: ${agentResponse.substring(0, 100)}...`);

		// Save conversation
		saveConversation(tenant.id, userPhone, [
			{ role: 'user', content: messageText },
			{ role: 'assistant', content: agentResponse }
		]);

		// Send response
		await message.reply(agentResponse);

		console.log(`[WhatsApp Handler] ✅ Response sent to ${userPhone}`);
	} catch (error) {
		console.error('[WhatsApp Handler] Error processing message:', error);

		// Send fallback message
		try {
			await message.reply(
				"Sorry, I'm having trouble right now. Our team will help you shortly."
			);
		} catch (replyError) {
			console.error('[WhatsApp Handler] Error sending fallback message:', replyError);
		}
	}
}

/**
 * Clean up old rate limit entries (should be called periodically)
 */
export function cleanupRateLimits() {
	const now = Date.now();
	for (const [phone, limit] of userMessageCounts.entries()) {
		if (now > limit.resetTime) {
			userMessageCounts.delete(phone);
		}
	}
}

// Clean up rate limits every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);
