/**
 * Update Tenant WhatsApp Number
 * Helper script to update the WhatsApp number for a tenant
 */

import 'dotenv/config';
import { getDatabase } from '../src/lib/server/db/index.js';

const args = process.argv.slice(2);

if (args.length !== 1) {
	console.log('\n❌ Usage: node scripts/update-tenant-whatsapp.js <whatsapp_number>');
	console.log('\nExample: node scripts/update-tenant-whatsapp.js 6281234567890');
	console.log('(Use your actual WhatsApp number without + or spaces)\n');
	process.exit(1);
}

const whatsappNumber = args[0];

const db = getDatabase();

// Get all tenants first
console.log('\n📋 Current tenants:');
const tenants = db.prepare('SELECT id, name, whatsapp_number FROM tenants').all();
tenants.forEach((t, idx) => {
	console.log(`${idx + 1}. ${t.name} - Current number: ${t.whatsapp_number || 'Not set'}`);
});

if (tenants.length === 0) {
	console.log('❌ No tenants found!');
	process.exit(1);
}

// Update the first tenant (or you can modify to ask which one)
const tenant = tenants[0];

console.log(`\n🔄 Updating ${tenant.name}...`);

db.prepare('UPDATE tenants SET whatsapp_number = ? WHERE id = ?').run(whatsappNumber, tenant.id);

console.log(`✅ Updated successfully!`);

// Verify
const updated = db.prepare('SELECT name, whatsapp_number FROM tenants WHERE id = ?').get(tenant.id);
console.log(`\n✓ Tenant: ${updated.name}`);
console.log(`✓ WhatsApp Number: ${updated.whatsapp_number}`);

console.log('\n✨ Done! You can now send messages to this number and the bot will respond.\n');

process.exit(0);
