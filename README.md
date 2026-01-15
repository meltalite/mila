# Yoga Studio WhatsApp AI Assistant (codename MILA) - Complete Project

Build a complete AI-powered customer service system for a yoga studio that uses WhatsApp as the primary interface. The system consists of a SvelteKit CMS for managing knowledge base content and a Node.js backend that handles WhatsApp messages using an AI agent.

## Tech Stack Requirements

### Frontend (CMS)
- **SvelteKit** for the admin CMS interface
- **Basic HTTP Authentication** for admin access (username/password in env vars)
- **TailwindCSS** for styling
- Clean, minimal UI design

### Backend
- **Node.js** (v20+)
- **whatsapp-web.js** for WhatsApp integration
- **Qdrant** vector database (via Docker)
- **Anthropic Claude Haiku 4.5** for the AI agent (`claude-haiku-4-5-latest`)
- **OpenAI** for multilingual embeddings (`text-embedding-3-small`)
- **SQLite** for storing CMS data and metadata

### Deployment
- **docker-compose.yml** with all services
- Single application container + Qdrant container
- Environment variable configuration

## Project Structure

```
mila/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── .env.example
├── README.md
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── schema.js          # SQLite schema
│   │   │   │   └── index.js           # Database connection
│   │   │   ├── agent/
│   │   │   │   ├── claude-agent.js    # Main agent logic with tool calling
│   │   │   │   └── tools.js           # Agent tool definitions
│   │   │   ├── vector/
│   │   │   │   ├── qdrant.js          # Qdrant client & operations
│   │   │   │   └── embeddings.js      # OpenAI embedding service
│   │   │   ├── whatsapp/
│   │   │   │   ├── client.js          # WhatsApp client initialization
│   │   │   │   └── handler.js         # Message handler
│   │   │   └── services/
│   │   │       ├── knowledge.js       # Knowledge base CRUD
│   │   │       └── conversation.js    # Conversation history management
│   │   └── components/
│   │       └── ui/                    # Reusable UI components
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── +layout.server.js      # Auth check
│   │   │   ├── +page.svelte           # Dashboard
│   │   │   ├── tenants/
│   │   │   │   ├── +page.svelte       # Tenant list
│   │   │   │   └── [id]/
│   │   │   │       └── +page.svelte   # Tenant edit
│   │   │   └── knowledge/
│   │   │       ├── +page.svelte       # Knowledge base list
│   │   │       ├── new/
│   │   │       │   └── +page.svelte   # Create entry
│   │   │       └── [id]/
│   │   │           ├── +page.svelte   # View entry
│   │   │           └── edit/
│   │   │               └── +page.svelte # Edit entry
│   │   └── api/
│   │       ├── knowledge/
│   │       │   └── +server.js         # Knowledge CRUD API
│   │       ├── tenants/
│   │       │   └── +server.js         # Tenant CRUD API
│   │       └── whatsapp/
│   │           ├── status/+server.js  # WhatsApp connection status
│   │           └── qr/+server.js      # QR code for pairing
│   ├── hooks.server.js                # Basic auth middleware
│   └── app.html
└── scripts/
    ├── init-db.js                     # Initialize database
    └── start.js                       # Startup script (Qdrant check + app)
```

## Database Schema (SQLite)

### Tenants Table
```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp_number TEXT UNIQUE,
  api_keys JSON,  -- Store encrypted API keys
  settings JSON,  -- Tenant-specific settings
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Knowledge Base Table
```sql
CREATE TABLE knowledge_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT,  -- Comma-separated
  vector_id TEXT, -- Reference to Qdrant point ID
  status TEXT DEFAULT 'active', -- active, draft, archived
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_tenant_category ON knowledge_entries(tenant_id, category);
CREATE INDEX idx_status ON knowledge_entries(status);
```

### Conversation History Table (in-memory/Redis alternative)
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  messages JSON,  -- Array of {role, content, timestamp}
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_tenant_user ON conversations(tenant_id, user_phone);
```

## Categories Enum
Pre-defined categories for knowledge base:
- `classes` - Classes & Schedules
- `pricing` - Pricing & Packages
- `policies` - Policies & Rules
- `instructors` - Instructor Information
- `facilities` - Facilities & Amenities
- `getting_started` - Getting Started / First-Timers
- `programs` - Special Programs & Workshops
- `general` - General Information

## Core Features

### 1. CMS Admin Panel

#### Dashboard (`/admin`)
- Show current WhatsApp connection status (connected/disconnected)
- Display QR code if not connected (for WhatsApp pairing)
- Quick stats: Total knowledge entries, Active tenants, Messages today
- Recent activity feed

#### Tenant Management (`/admin/tenants`)
**List View:**
- Table with: Name, WhatsApp Number, Status, Created Date
- Actions: View, Edit, Activate/Deactivate
- "Add New Tenant" button

**Create/Edit Tenant:**
- Form fields:
  - Name (text input)
  - WhatsApp Number (phone input with validation)
  - API Keys section (toggle visibility):
    - Anthropic API Key
    - OpenAI API Key
  - Settings (JSON editor or form):
    - Business hours
    - Auto-escalation rules
    - Custom greeting message
  - Active status (toggle)
- Save button triggers tenant creation/update

#### Knowledge Base Management (`/admin/knowledge`)

**List View:**
- Filter by: Tenant (dropdown), Category (dropdown), Status
- Search box (searches title, content, keywords)
- Table columns: Title, Category, Keywords, Status, Last Updated
- Actions: View, Edit, Delete
- "Add New Entry" button

**Create/Edit Entry (`/admin/knowledge/new` or `/admin/knowledge/[id]/edit`):**
- Form fields:
  - Tenant (dropdown) - required
  - Title (text input) - required
  - Category (dropdown) - required
  - Content (textarea with markdown support) - required
  - Keywords (tag input, comma-separated)
  - Status (dropdown: Active, Draft, Archived)
- Preview section showing rendered markdown
- Save button logic:
  1. Save to SQLite
  2. Generate embedding via OpenAI API
  3. Upsert to Qdrant with metadata
  4. Show success message
- Delete button (with confirmation) removes from both DB and Qdrant

### 2. WhatsApp Integration

#### Client Setup (`src/lib/server/whatsapp/client.js`)
```javascript
// Initialize whatsapp-web.js client
// Store session in ./whatsapp-session directory
// Emit QR code for pairing
// Handle connection events
```

#### Message Handler (`src/lib/server/whatsapp/handler.js`)
```javascript
// On message received:
// 1. Identify tenant by WhatsApp number
// 2. Load conversation history (last 5 messages)
// 3. Call agent to process message
// 4. Send response back to user
// 5. Save conversation history
```

### 3. AI Agent with Claude

#### Agent Logic (`src/lib/server/agent/claude-agent.js`)

**System Prompt Template:**
```
You are a helpful customer service assistant for {TENANT_NAME}.

You have access to tools to help answer questions:
- knowledge_search: Search the studio's information database
- escalate_to_human: Escalate complex queries to staff

Guidelines:
- Respond in the same language as the user (Indonesian or English)
- Be warm, welcoming, and concise (this is WhatsApp)
- Always search the knowledge base before answering questions
- Keep responses to 2-4 sentences when possible
- For medical concerns, booking requests, or complex issues, escalate to human staff
- Use natural Bahasa Indonesia when responding in Indonesian

Current time: {TIMESTAMP}
```

**Tool Definitions (`src/lib/server/agent/tools.js`):**

1. **knowledge_search**
   - Input: `query` (string), `category` (optional string)
   - Logic:
     - Generate embedding for query
     - Search Qdrant with tenant filter
     - Return top 3 results
     - Format as context for Claude

2. **escalate_to_human**
   - Input: `reason` (string)
   - Logic:
     - Log escalation to database
     - Send notification (console.log for MVP)
     - Return acknowledgment message

**Agent Flow:**
```javascript
async function processMessage(tenantId, userMessage, conversationHistory) {
  // 1. Build messages array with history
  // 2. Call Claude API with tools
  // 3. Handle tool_use response (loop if multiple tools)
  // 4. Execute tools and get results
  // 5. Send tool results back to Claude
  // 6. Return final text response
}
```

### 4. Vector Database Integration

#### Qdrant Client (`src/lib/server/vector/qdrant.js`)

**Collection Schema:**
```javascript
{
  name: "yoga_knowledge",
  vectors: {
    size: 1536,  // OpenAI text-embedding-3-small
    distance: "Cosine"
  }
}

// Point payload structure:
{
  id: "entry_uuid",
  vector: [...],  // 1536-dimensional embedding
  payload: {
    tenant_id: "tenant_uuid",
    title: "...",
    content: "...",
    category: "...",
    keywords: ["..."],
    entry_id: "db_entry_id"
  }
}
```

**Operations:**
- `initCollection()` - Create collection if not exists
- `upsertEntry(entry)` - Add/update knowledge entry
- `deleteEntry(entryId)` - Remove entry
- `search(query, tenantId, category, limit)` - Semantic search with filters

#### Embeddings Service (`src/lib/server/vector/embeddings.js`)

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function embed(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// Batch embedding for initial indexing
export async function embedBatch(texts) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return response.data.map(d => d.embedding);
}
```

### 5. Authentication

#### Basic Auth Middleware (`src/hooks.server.js`)

```javascript
export async function handle({ event, resolve }) {
  // Check if route starts with /admin
  if (event.url.pathname.startsWith('/admin')) {
    const authHeader = event.request.headers.get('authorization');
    
    if (!authHeader) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"'
        }
      });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    const validUsername = process.env.ADMIN_USER || 'admin';
    const validPassword = process.env.ADMIN_PASS || 'changeme';

    if (username !== validUsername || password !== validPassword) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  return resolve(event);
}
```

## Docker Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ADMIN_USER=${ADMIN_USER:-admin}
      - ADMIN_PASS=${ADMIN_PASS:-changeme}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - QDRANT_URL=http://qdrant:6333
      - DATABASE_URL=sqlite:./data/yoga-assistant.db
    volumes:
      - ./data:/app/data
      - ./whatsapp-session:/app/.wwebjs_auth
    depends_on:
      - qdrant
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:v1.7.4
    ports:
      - "6333:6333"
    volumes:
      - ./qdrant_storage:/qdrant/storage
    restart: unless-stopped
```

### Dockerfile
```dockerfile
FROM node:20-slim

# Install Chromium for whatsapp-web.js
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build SvelteKit app
RUN npm run build

# Create data directory
RUN mkdir -p /app/data /app/.wwebjs_auth

EXPOSE 3000

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["node", "build/index.js"]
```

## Environment Variables (.env.example)

```env
# Admin Authentication
ADMIN_USER=admin
ADMIN_PASS=your_secure_password_here

# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=sqlite:./data/yoga-assistant.db

# Qdrant
QDRANT_URL=http://localhost:6333

# Node Environment
NODE_ENV=development

# WhatsApp (optional overrides)
WHATSAPP_SESSION_PATH=./.wwebjs_auth
```

## Initial Setup & Seed Data

### Database Initialization Script (`scripts/init-db.js`)
```javascript
// Create tables
// Insert default tenant (first yoga studio)
// Insert sample knowledge base entries

const sampleEntries = [
  {
    category: 'classes',
    title: 'Kelas Yoga untuk Pemula',
    content: 'Kami menawarkan kelas Hatha Yoga yang cocok untuk pemula. Kelas ini fokus pada pose dasar, pernapasan, dan relaksasi. Jadwal: Senin & Rabu 18:30, Sabtu 09:00.',
    keywords: 'beginner, pemula, hatha, basic'
  },
  {
    category: 'pricing',
    title: 'Harga Membership',
    content: 'Paket membership bulanan: Rp 1.500.000 (unlimited classes). Drop-in class: Rp 150.000 per sesi. Paket 10 kelas: Rp 1.200.000.',
    keywords: 'harga, price, membership, paket'
  },
  {
    category: 'policies',
    title: 'Kebijakan Pembatalan',
    content: 'Pembatalan kelas harus dilakukan minimal 2 jam sebelum kelas dimulai. Keterlambatan lebih dari 10 menit tidak diperkenankan masuk kelas untuk menjaga konsentrasi peserta lain.',
    keywords: 'cancel, late, policy, aturan'
  },
  {
    category: 'facilities',
    title: 'Fasilitas Studio',
    content: 'Studio dilengkapi dengan: mat yoga, shower, locker, changing room, dan parkir gratis. Kami menyediakan air minum dan handuk.',
    keywords: 'facilities, amenities, fasilitas'
  }
];
```

## UI Design Guidelines

### Color Scheme
- Primary: Calm purple/lavender (#8B7FC7)
- Secondary: Soft green (#A8D5BA)
- Background: Off-white (#FAFAFA)
- Text: Dark gray (#2D3748)
- Accent: Warm coral (#FF8B7C)

### Component Style
- Clean, minimal cards with subtle shadows
- Rounded corners (border-radius: 8px)
- Ample whitespace
- Clear typography hierarchy
- Mobile-responsive (Tailwind's responsive classes)

### Dashboard Layout
```
┌─────────────────────────────────────────────┐
│  Sidebar Navigation    │   Main Content     │
│                        │                    │
│  - Dashboard           │  ┌──────────────┐  │
│  - Tenants             │  │ WhatsApp     │  │
│  - Knowledge Base      │  │ Status Card  │  │
│  - Settings            │  └──────────────┘  │
│                        │                    │
│                        │  ┌──────────────┐  │
│                        │  │ Quick Stats  │  │
│                        │  └──────────────┘  │
│                        │                    │
│                        │  ┌──────────────┐  │
│                        │  │ Recent       │  │
│                        │  │ Activity     │  │
│                        │  └──────────────┘  │
└─────────────────────────────────────────────┘
```

## Key Implementation Details

### Conversation History Management
- Store last 10 messages per user in SQLite
- Clean up conversations older than 7 days (scheduled task)
- Format for Claude: `[{role: 'user'|'assistant', content: '...'}]`

### Error Handling
- Wrap all API calls in try-catch
- Log errors to console (can add external logging later)
- Show user-friendly error messages in UI
- For WhatsApp: Send "Sorry, I'm having trouble right now. Our team will help you shortly." on errors

### Rate Limiting (Basic)
- Prevent spam: Max 10 messages per user per minute
- Store in-memory counter (can upgrade to Redis later)
- Respond with: "Please wait a moment before sending another message."

### Performance Optimizations
- Cache embeddings for common queries (in-memory Map with 100 entry limit)
- Batch Qdrant operations when possible
- Use SvelteKit's form actions for progressive enhancement

## Testing Requirements

### Manual Test Scenarios
Create a simple test script that:

1. **WhatsApp Integration Test:**
   - Send "Hi" → Should respond with greeting
   - Send "Ada kelas untuk beginner?" → Should search KB and respond
   - Send "Berapa harganya?" → Should return pricing info
   - Send "I have back pain, is yoga safe?" → Should escalate to human

2. **CMS Test:**
   - Create a new tenant
   - Add a knowledge entry
   - Verify it appears in Qdrant (check via search)
   - Edit and update entry
   - Delete entry (verify removed from Qdrant)

3. **Multi-language Test:**
   - Send query in Indonesian → Response in Indonesian
   - Send query in English → Response in English
   - Send mixed code-switched → Natural response

## Additional Features (Nice to Have)

### Analytics Dashboard (Phase 2)
- Total messages handled
- Average response time
- Most asked questions
- Escalation rate
- User satisfaction (thumbs up/down after response)

### Scheduled Messages (Phase 2)
- Send class reminders
- Promotional messages
- Schedule via CMS

### Multi-WhatsApp Support (Phase 2)
- Each tenant has their own WhatsApp connection
- Manage multiple QR codes
- Separate message queues

## README.md Content

Include:
- Project overview
- Prerequisites (Node.js 20+, Docker)
- Quick start guide
- Environment variable documentation
- Architecture diagram
- Development workflow
- Deployment instructions
- Troubleshooting common issues
- API documentation for future integrations

## Development Workflow

1. **Setup:**
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your API keys
   docker-compose up -d qdrant
   npm run init-db
   npm run dev
   ```

2. **WhatsApp Pairing:**
   - Navigate to http://localhost:3000/admin
   - Scan QR code with WhatsApp mobile app
   - Wait for "Connected" status

3. **Add Knowledge Base:**
   - Go to /admin/knowledge/new
   - Add entries for your yoga studio
   - Test via WhatsApp

4. **Deploy:**
   ```bash
   docker-compose up -d --build
   ```

## Success Criteria

The application is complete when:
- ✅ Admin can login with basic auth
- ✅ Admin can create/manage tenants
- ✅ Admin can CRUD knowledge base entries
- ✅ WhatsApp connects and shows QR code
- ✅ User messages trigger agent responses
- ✅ Agent searches knowledge base correctly
- ✅ Agent responds in user's language (ID/EN)
- ✅ Escalation to human works
- ✅ Multi-tenant filtering works in vector search
- ✅ Docker deployment works end-to-end

## Notes for Implementation

- Use `better-sqlite3` for SQLite (synchronous, fast)
- Use `@qdrant/js-client-rest` for Qdrant client
- Use `@anthropic-ai/sdk` for Claude
- Use `openai` npm package for embeddings
- Use `whatsapp-web.js` version 1.23.0+ (stable)
- Ensure proper cleanup on process termination (WhatsApp logout, DB close)
- Add `process.on('SIGINT', cleanup)` handler

## Potential Gotchas

1. **WhatsApp session**: May need re-authentication occasionally, handle gracefully
2. **Qdrant collection**: Must be created before first upsert, check in startup
3. **Embedding dimensions**: Must match between OpenAI (1536) and Qdrant config
4. **Tenant isolation**: Always filter by tenant_id in Qdrant searches
5. **SQLite concurrent writes**: Use serialized mode, be careful with write locks
6. **Puppeteer/Chromium**: Ensure proper flags in Docker for headless mode

---

## Final Checklist

- [ ] SvelteKit app with basic auth
- [ ] Tenant management CRUD
- [ ] Knowledge base management CRUD
- [ ] SQLite database with proper schema
- [ ] Qdrant integration (create collection, CRUD operations)
- [ ] OpenAI embeddings integration
- [ ] Claude agent with tool calling
- [ ] WhatsApp client initialization
- [ ] Message handler with conversation history
- [ ] Docker and docker-compose setup
- [ ] Environment configuration
- [ ] Init script for database
- [ ] README with setup instructions
- [ ] Error handling throughout
- [ ] UI with Tailwind (clean, minimal)
- [ ] Mobile-responsive design

Build this as a production-ready MVP that can be deployed immediately and scaled later.
