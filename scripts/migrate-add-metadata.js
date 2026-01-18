/**
 * Migration Script: Add metadata column to knowledge_entries
 * Run this if you have an existing database
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'data', 'yoga-assistant.db');

try {
	const db = new Database(dbPath);

	console.log('Adding metadata column to knowledge_entries...');

	// Check if column already exists
	const columns = db.pragma('table_info(knowledge_entries)');
	const hasMetadata = columns.some((col) => col.name === 'metadata');

	if (hasMetadata) {
		console.log('✓ Metadata column already exists');
	} else {
		// Add metadata column
		db.exec('ALTER TABLE knowledge_entries ADD COLUMN metadata TEXT');
		console.log('✓ Metadata column added successfully');
	}

	db.close();
	console.log('\nMigration complete!');
} catch (error) {
	console.error('Migration failed:', error);
	process.exit(1);
}
