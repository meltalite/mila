/**
 * Database Initialization Script
 * Creates tables and inserts seed data for development
 */

import { randomUUID } from 'crypto';
import { initDatabase, getDatabase } from '../src/lib/server/db/index.js';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

// Ensure data directory exists
const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || './data/yoga-assistant.db';
mkdirSync(dirname(dbPath), { recursive: true });

// Initialize database schema
console.log('[Init] Initializing database schema...');
initDatabase();

const db = getDatabase();

// Check if we already have data
const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get();

if (tenantCount.count > 0) {
	console.log('[Init] Database already has data. Skipping seed.');
	process.exit(0);
}

console.log('[Init] Inserting seed data...');

// Insert default tenant
const tenantId = randomUUID();
const insertTenant = db.prepare(`
  INSERT INTO tenants (id, name, whatsapp_number, api_keys, settings, active)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const tenantSettings = JSON.stringify({
	business_hours: {
		monday: '09:00-21:00',
		tuesday: '09:00-21:00',
		wednesday: '09:00-21:00',
		thursday: '09:00-21:00',
		friday: '09:00-21:00',
		saturday: '08:00-18:00',
		sunday: '08:00-18:00'
	},
	greeting_message: 'Halo! Terima kasih telah menghubungi kami. Ada yang bisa saya bantu?',
	auto_escalation_rules: {
		medical_keywords: ['sakit', 'pain', 'injury', 'cedera', 'hamil', 'pregnant'],
		complex_keywords: ['booking', 'payment', 'refund', 'complaint']
	}
});

insertTenant.run(
	tenantId,
	'Peaceful Yoga Studio',
	'6281234567890', // Example WhatsApp number (will need to be updated)
	'{}', // API keys (empty, will be set via admin panel)
	tenantSettings,
	1
);

console.log(`[Init] Created tenant: Peaceful Yoga Studio (ID: ${tenantId})`);

// Insert sample knowledge base entries
const sampleEntries = [
	{
		category: 'classes',
		title: 'Kelas Yoga untuk Pemula',
		content: `Kami menawarkan kelas Hatha Yoga yang sangat cocok untuk pemula. Kelas ini dirancang khusus untuk yang baru memulai perjalanan yoga.

**Yang akan dipelajari:**
- Pose dasar (asana) yang aman untuk pemula
- Teknik pernapasan (pranayama)
- Relaksasi dan meditasi sederhana

**Jadwal Kelas:**
- Senin & Rabu: 18:30 - 19:30
- Sabtu: 09:00 - 10:00

Instruktur kami berpengalaman dan akan membimbing setiap gerakan dengan sabar.`,
		keywords: 'beginner,pemula,hatha,basic,kelas dasar'
	},
	{
		category: 'pricing',
		title: 'Harga Paket dan Membership',
		content: `Kami menawarkan berbagai paket yang sesuai dengan kebutuhan Anda:

**Membership Bulanan:**
- Unlimited Classes: Rp 1.500.000/bulan
- Akses ke semua kelas (kecuali workshop khusus)
- Gratis 1x private session per bulan

**Paket Class Pass:**
- Drop-in (1 kelas): Rp 150.000
- Paket 10 kelas: Rp 1.200.000 (berlaku 3 bulan)
- Paket 20 kelas: Rp 2.200.000 (berlaku 6 bulan)

**First-Timer Special:**
- Trial class pertama: Rp 100.000
- Paket 3 kelas introductory: Rp 350.000

Semua harga sudah termasuk mat yoga dan air minum.`,
		keywords: 'harga,price,membership,paket,biaya,cost'
	},
	{
		category: 'policies',
		title: 'Kebijakan Pembatalan dan Keterlambatan',
		content: `Untuk menjaga kenyamanan semua member, kami menerapkan kebijakan berikut:

**Pembatalan Kelas:**
- Pembatalan harus dilakukan minimal 2 jam sebelum kelas dimulai
- Pembatalan dapat dilakukan melalui WhatsApp atau aplikasi
- Late cancellation (kurang dari 2 jam) akan mengurangi kuota kelas Anda

**Keterlambatan:**
- Keterlambatan maksimal 10 menit masih diperbolehkan
- Lebih dari 10 menit tidak diperkenankan masuk demi menjaga konsentrasi peserta lain
- Kuota kelas tetap terhitung jika terlambat lebih dari 10 menit

**No-Show:**
- Tidak datang tanpa pemberitahuan akan mengurangi 1x kuota kelas

Kami mohon pengertian Anda untuk kebijakan ini.`,
		keywords: 'cancel,late,policy,aturan,pembatalan,terlambat'
	},
	{
		category: 'facilities',
		title: 'Fasilitas Studio',
		content: `Studio kami dilengkapi dengan fasilitas lengkap untuk kenyamanan Anda:

**Fasilitas Utama:**
- Yoga mat berkualitas tinggi (gratis pakai)
- Ruangan ber-AC dengan sirkulasi udara baik
- Sound system untuk musik relaksasi
- Cermin dinding penuh

**Fasilitas Pendukung:**
- Shower dengan air panas/dingin
- Locker untuk menyimpan barang
- Changing room yang bersih
- Parkir gratis untuk mobil dan motor

**Amenities:**
- Air minum gratis (refill)
- Handuk kecil tersedia
- Aromatherapy diffuser
- Area waiting room yang nyaman

Kami menjaga kebersihan studio dengan sanitasi rutin setiap hari.`,
		keywords: 'facilities,amenities,fasilitas,studio,parking'
	}
];

const insertEntry = db.prepare(`
  INSERT INTO knowledge_entries (id, tenant_id, title, category, content, keywords, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const entry of sampleEntries) {
	const entryId = randomUUID();
	insertEntry.run(
		entryId,
		tenantId,
		entry.title,
		entry.category,
		entry.content,
		entry.keywords,
		'active'
	);
	console.log(`[Init] Created knowledge entry: ${entry.title}`);
}

console.log('[Init] Seed data inserted successfully!');
console.log(`[Init] Total entries: ${sampleEntries.length}`);
console.log('[Init] Database initialization complete.');

process.exit(0);
