/**
 * Database connection module using better-sqlite3
 * Provides singleton database instance with WAL mode enabled
 */

import Database from 'better-sqlite3';
import { createTablesSQL } from './schema.js';

let db = null;

/**
 * Get or create database connection
 * @returns {Database} SQLite database instance
 */
export function getDatabase() {
	if (!db) {
		const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || './data/yoga-assistant.db';

		db = new Database(dbPath, {
			verbose: process.env.NODE_ENV === 'development' ? console.log : null
		});

		// Enable WAL mode for better concurrent access
		db.pragma('journal_mode = WAL');

		// Enable foreign keys
		db.pragma('foreign_keys = ON');

		console.log(`[Database] Connected to ${dbPath}`);
	}

	return db;
}

/**
 * Initialize database with schema
 * Creates all tables if they don't exist
 */
export function initDatabase() {
	const database = getDatabase();

	// Execute schema creation
	database.exec(createTablesSQL);

	console.log('[Database] Schema initialized');

	return database;
}

/**
 * Close database connection
 */
export function closeDatabase() {
	if (db) {
		db.close();
		db = null;
		console.log('[Database] Connection closed');
	}
}

// Graceful shutdown
process.on('SIGINT', () => {
	closeDatabase();
	process.exit(0);
});

process.on('SIGTERM', () => {
	closeDatabase();
	process.exit(0);
});

export default getDatabase;
