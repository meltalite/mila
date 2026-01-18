/**
 * Production Startup Script
 * Initializes services and starts the SvelteKit production server
 */

import 'dotenv/config';
import {
	waitForQdrant,
	performStartupCleanup,
	setupShutdownHandlers
} from '../src/lib/server/startup.js';
import { initDatabase } from '../src/lib/server/db/index.js';
import { initCollection } from '../src/lib/server/vector/qdrant.js';
import { initWhatsAppClient } from '../src/lib/server/whatsapp/client.js';

async function start() {
	console.log('\n🚀 MILA - Starting Production Server\n');
	console.log('=====================================\n');

	try {
		// 1. Wait for Qdrant
		console.log('[1/6] Checking Qdrant availability...');
		const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
		await waitForQdrant(qdrantUrl, 30000);

		// 2. Initialize database
		console.log('\n[2/6] Initializing database...');
		initDatabase();

		// 3. Ensure Qdrant collection exists
		console.log('\n[3/6] Setting up Qdrant collection...');
		await initCollection();

		// 4. Perform startup cleanup
		console.log('\n[4/6] Running cleanup tasks...');
		await performStartupCleanup();

		// 5. Initialize WhatsApp client
		console.log('\n[5/6] Starting WhatsApp client...');
		const whatsappClient = initWhatsAppClient();

		// Setup graceful shutdown
		setupShutdownHandlers(whatsappClient);

		console.log('\n=====================================');
		console.log('✅ MILA is ready!');
		console.log('=====================================\n');

		// Start SvelteKit production server (it auto-starts when imported)
		console.log('[6/6] Starting SvelteKit server...\n');
		await import('../build/index.js');
	} catch (error) {
		console.error('\n❌ Failed to start MILA:', error);
		process.exit(1);
	}
}

// Start the application
start();
