import { getDatabase } from '../src/lib/server/db/index.js';

const db = getDatabase();

console.log('\n=== Database Tables ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => console.log(`- ${t.name}`));

console.log('\n=== Tenants ===');
const tenants = db.prepare('SELECT id, name, whatsapp_number, active FROM tenants').all();
console.log(tenants);

console.log('\n=== Knowledge Entries ===');
const entries = db.prepare('SELECT id, title, category, status FROM knowledge_entries').all();
entries.forEach(e => console.log(`- [${e.category}] ${e.title}`));

console.log('\n✓ Database verification complete!\n');
process.exit(0);
