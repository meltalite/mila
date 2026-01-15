/**
 * WhatsApp Client Initialization
 * Sets up whatsapp-web.js client with event handlers
 */

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import { setQR, clearQR, setStatus } from './state.js';
import { handleMessage } from './handler.js';

let client = null;
let isInitialized = false;

/**
 * Initialize WhatsApp client
 * @returns {Client}
 */
export function initWhatsAppClient() {
	if (isInitialized) {
		console.log('[WhatsApp] Client already initialized');
		return client;
	}

	const sessionPath = process.env.WHATSAPP_SESSION_PATH || './.wwebjs_auth';

	console.log('[WhatsApp] Initializing client...');

	client = new Client({
		authStrategy: new LocalAuth({
			dataPath: sessionPath
		}),
		puppeteer: {
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
        '--disable-popup-blocking',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--no-first-run',
				'--no-zygote',
				'--disable-gpu'
			]
		}
	});

	// QR Code event
	client.on('qr', async (qr) => {
		try {
			const qrDataURL = await qrcode.toDataURL(qr);
			setQR(qrDataURL);
			setStatus('qr_ready');
			console.log('[WhatsApp] QR Code ready for scanning');
		} catch (error) {
			console.error('[WhatsApp] Error generating QR code:', error);
		}
	});

	// Ready event
	client.on('ready', async () => {
		clearQR();
		setStatus('connected');
		console.log('[WhatsApp] ✅ Client is ready!');
    // Patch sendSeen to use markSeen instead (fixes markedUnread error)
    await client.pupPage?.evaluate(`
      window.WWebJS.sendSeen = async (chatId) => {
        const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
        if (chat) {
          window.Store.WAWebStreamModel.Stream.markAvailable();
          await window.Store.SendSeen.markSeen(chat);
          window.Store.WAWebStreamModel.Stream.markUnavailable();
          return true;
        }
        return false;
      };
    `);
	});

	// Authenticated event
	client.on('authenticated', () => {
		setStatus('authenticated');
		console.log('[WhatsApp] Authenticated');
	});

	// Authentication failure
	client.on('auth_failure', (msg) => {
		setStatus('disconnected');
		console.error('[WhatsApp] Authentication failure:', msg);
	});

	// Disconnected event
	client.on('disconnected', (reason) => {
		setStatus('disconnected');
		clearQR();
		console.log('[WhatsApp] Client disconnected:', reason);
	});

	// Message event
	client.on('message', (message) => {
    console.log('[WhatsApp] incoming message:', message);
    if (!message.body.startsWith('!test')) return;
		handleMessage(message).catch((error) => {
			console.error('[WhatsApp] Error handling message:', error);
		});
	});

  // client.on('message_create', (message) => {
  //   console.log('[WhatsApp] message created:');
  // });

  // client.on('message_edit', (message) => {
  //   console.log('[WhatsApp] message edited:', message);
  // });

	// Initialize the client
	client.initialize().catch((error) => {
		console.warn('[WhatsApp] Initialization error:', error);
		// setStatus('disconnected');
	});

  // client.getChats().then(chats => {
  //   console.log(`[WhatsApp] Loaded ${chats.length} chats`);
  // }).catch(err => {
  //   console.error('[WhatsApp] Error loading chats:', err);
  // });

	// client.getWWebVersion().then(version => {
	// 	console.log('[WhatsApp] Client version: ', version);
	// });

	isInitialized = true;

	return client;
}

/**
 * Get current client instance
 * @returns {Client|null}
 */
export function getClient() {
	return client;
}

/**
 * Destroy client (for graceful shutdown)
 * @returns {Promise<void>}
 */
export async function destroyClient() {
	if (client) {
		console.log('[WhatsApp] Destroying client...');
		await client.destroy();
		client = null;
		isInitialized = false;
		setStatus('disconnected');
		clearQR();
	}
}
