/**
 * SQLite Database Schema for MILA
 * Defines tables for tenants, knowledge entries, conversations, and escalations
 */

export const createTablesSQL = `
-- Tenants table: Multi-tenant architecture support
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp_number TEXT UNIQUE,
  api_keys TEXT,  -- JSON string with encrypted API keys
  settings TEXT,  -- JSON string for tenant-specific settings
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge base entries table
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,  -- Enum: classes, pricing, policies, instructors, facilities, getting_started, programs, general
  content TEXT NOT NULL,
  keywords TEXT,  -- Comma-separated keywords
  metadata TEXT,  -- JSON object with key-value pairs
  vector_id TEXT,  -- Reference to Qdrant point ID
  status TEXT DEFAULT 'active',  -- active, draft, archived
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for knowledge entries
CREATE INDEX IF NOT EXISTS idx_tenant_category ON knowledge_entries(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_status ON knowledge_entries(status);
CREATE INDEX IF NOT EXISTS idx_tenant_status ON knowledge_entries(tenant_id, status);

-- Conversation history table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  messages TEXT NOT NULL,  -- JSON array of {role, content, timestamp}
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Index for conversation lookup
CREATE INDEX IF NOT EXISTS idx_tenant_user ON conversations(tenant_id, user_phone);

-- Escalations table for tracking when conversations are escalated to humans
CREATE TABLE IF NOT EXISTS escalations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Index for escalations
CREATE INDEX IF NOT EXISTS idx_escalations_tenant ON escalations(tenant_id, created_at);
`;

/**
 * Valid knowledge base categories
 */
export const KNOWLEDGE_CATEGORIES = [
  'schedules',
	'classes',
  'purchases & registrations',
  'pricing & policies',
  'location & facilities',

	// 'pricing',
	// 'policies',
	// 'instructors',
	// 'facilities',
	// 'getting_started',
	// 'programs',
	'general'
];

/**
 * Valid entry statuses
 */
export const ENTRY_STATUSES = ['active', 'draft', 'archived'];
