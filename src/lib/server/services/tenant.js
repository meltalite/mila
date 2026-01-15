/**
 * Tenant Service
 * Business logic for managing yoga studio tenants
 */

import { randomUUID } from 'crypto';
import { getDatabase } from '../db/index.js';

/**
 * List all tenants
 * @param {Object} options - Query options
 * @param {boolean} [options.activeOnly] - Only return active tenants
 * @returns {Array} - Array of tenants
 */
export function listTenants(options = {}) {
	const db = getDatabase();

	let query = 'SELECT * FROM tenants';
	const params = [];

	if (options.activeOnly) {
		query += ' WHERE active = 1';
	}

	query += ' ORDER BY created_at DESC';

	const tenants = db.prepare(query).all(...params);

	// Parse JSON fields
	return tenants.map((tenant) => ({
		...tenant,
		api_keys: tenant.api_keys ? JSON.parse(tenant.api_keys) : {},
		settings: tenant.settings ? JSON.parse(tenant.settings) : {}
	}));
}

/**
 * Get a single tenant by ID
 * @param {string} id - Tenant ID
 * @returns {Object|null} - Tenant object or null
 */
export function getTenant(id) {
	const db = getDatabase();
	const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(id);

	if (!tenant) return null;

	// Parse JSON fields
	return {
		...tenant,
		api_keys: tenant.api_keys ? JSON.parse(tenant.api_keys) : {},
		settings: tenant.settings ? JSON.parse(tenant.settings) : {}
	};
}

/**
 * Find tenant by WhatsApp number
 * @param {string} whatsappNumber - WhatsApp number
 * @returns {Object|null} - Tenant object or null
 */
export function findTenantByWhatsApp(whatsappNumber) {
	const db = getDatabase();

	// Clean the number (remove @c.us or other suffixes)
	const cleanNumber = whatsappNumber.split('@')[0];

	const tenant = db
		.prepare('SELECT * FROM tenants WHERE whatsapp_number = ? AND active = 1')
		.get(cleanNumber);

	if (!tenant) return null;

	return {
		...tenant,
		api_keys: tenant.api_keys ? JSON.parse(tenant.api_keys) : {},
		settings: tenant.settings ? JSON.parse(tenant.settings) : {}
	};
}

/**
 * Create a new tenant
 * @param {Object} data - Tenant data
 * @param {string} data.name - Tenant name
 * @param {string} [data.whatsapp_number] - WhatsApp number
 * @param {Object} [data.api_keys] - API keys object
 * @param {Object} [data.settings] - Settings object
 * @param {boolean} [data.active] - Active status
 * @returns {Object} - Created tenant
 */
export function createTenant(data) {
	const db = getDatabase();
	const id = randomUUID();
	const now = new Date().toISOString();

	// Validate WhatsApp number format (basic validation)
	if (data.whatsapp_number && !/^\d{10,15}$/.test(data.whatsapp_number)) {
		throw new Error('Invalid WhatsApp number format. Use digits only (10-15 characters).');
	}

	// Validate settings is valid JSON if provided
	let settingsJson = '{}';
	if (data.settings) {
		if (typeof data.settings === 'string') {
			// Validate it's valid JSON
			JSON.parse(data.settings); // Will throw if invalid
			settingsJson = data.settings;
		} else {
			settingsJson = JSON.stringify(data.settings);
		}
	}

	// Validate and stringify API keys
	let apiKeysJson = '{}';
	if (data.api_keys) {
		if (typeof data.api_keys === 'string') {
			JSON.parse(data.api_keys); // Validate
			apiKeysJson = data.api_keys;
		} else {
			apiKeysJson = JSON.stringify(data.api_keys);
		}
	}

	db.prepare(
		`INSERT INTO tenants (id, name, whatsapp_number, api_keys, settings, active, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		id,
		data.name,
		data.whatsapp_number || null,
		apiKeysJson,
		settingsJson,
		data.active !== false ? 1 : 0,
		now,
		now
	);

	console.log(`[Tenant] Created: ${data.name} (ID: ${id})`);

	return getTenant(id);
}

/**
 * Update a tenant
 * @param {string} id - Tenant ID
 * @param {Object} data - Updated data
 * @returns {Object} - Updated tenant
 */
export function updateTenant(id, data) {
	const db = getDatabase();
	const existing = getTenant(id);

	if (!existing) {
		throw new Error(`Tenant not found: ${id}`);
	}

	const now = new Date().toISOString();
	const updates = [];
	const params = [];

	if (data.name !== undefined) {
		updates.push('name = ?');
		params.push(data.name);
	}

	if (data.whatsapp_number !== undefined) {
		// Validate format
		if (data.whatsapp_number && !/^\d{10,15}$/.test(data.whatsapp_number)) {
			throw new Error('Invalid WhatsApp number format. Use digits only (10-15 characters).');
		}
		updates.push('whatsapp_number = ?');
		params.push(data.whatsapp_number || null);
	}

	if (data.api_keys !== undefined) {
		let apiKeysJson = '{}';
		if (typeof data.api_keys === 'string') {
			JSON.parse(data.api_keys); // Validate
			apiKeysJson = data.api_keys;
		} else {
			apiKeysJson = JSON.stringify(data.api_keys);
		}
		updates.push('api_keys = ?');
		params.push(apiKeysJson);
	}

	if (data.settings !== undefined) {
		let settingsJson = '{}';
		if (typeof data.settings === 'string') {
			JSON.parse(data.settings); // Validate
			settingsJson = data.settings;
		} else {
			settingsJson = JSON.stringify(data.settings);
		}
		updates.push('settings = ?');
		params.push(settingsJson);
	}

	if (data.active !== undefined) {
		updates.push('active = ?');
		params.push(data.active ? 1 : 0);
	}

	if (updates.length === 0) {
		return existing; // No changes
	}

	updates.push('updated_at = ?');
	params.push(now);
	params.push(id);

	db.prepare(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`).run(...params);

	console.log(`[Tenant] Updated: ${id}`);

	return getTenant(id);
}

/**
 * Delete a tenant
 * Note: This will cascade delete all knowledge entries and conversations
 * @param {string} id - Tenant ID
 */
export function deleteTenant(id) {
	const db = getDatabase();
	const tenant = getTenant(id);

	if (!tenant) {
		throw new Error(`Tenant not found: ${id}`);
	}

	db.prepare('DELETE FROM tenants WHERE id = ?').run(id);

	console.log(`[Tenant] Deleted: ${tenant.name} (ID: ${id})`);
}

/**
 * Toggle tenant active status
 * @param {string} id - Tenant ID
 * @returns {Object} - Updated tenant
 */
export function toggleTenantActive(id) {
	const tenant = getTenant(id);

	if (!tenant) {
		throw new Error(`Tenant not found: ${id}`);
	}

	return updateTenant(id, { active: !tenant.active });
}
