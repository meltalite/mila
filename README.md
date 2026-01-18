# MILA - Yoga Studio WhatsApp AI Assistant

> Multi-tenant AI-powered customer service system for yoga studios using WhatsApp, Claude AI, and vector search.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

MILA (Multilingual Intelligent Learning Assistant) is a complete AI-powered WhatsApp customer service solution designed for yoga studios. It combines:

- **SvelteKit Admin CMS** for managing tenants, knowledge base, and conversations
- **Claude Haiku 4.5** AI agent with tool calling for intelligent responses
- **Qdrant Vector Database** for semantic knowledge search
- **WhatsApp Integration** via whatsapp-web.js
- **Multi-tenant Architecture** with complete data isolation

### Key Features

- Intelligent WhatsApp chatbot that answers customer questions
- Bilingual support (Indonesian & English) with automatic language detection
- Semantic knowledge search using vector embeddings
- Multi-tenant architecture supporting multiple yoga studios
- Clean admin interface for managing knowledge base
- Conversation history and analytics
- Automatic escalation for complex queries
- Docker-ready deployment

## Demo

![Dashboard Screenshot](docs/screenshots/dashboard.png)
*Dashboard showing WhatsApp status, statistics, and recent activity*

## Tech Stack

### Frontend
- **SvelteKit 5** - Web framework with SSR
- **TailwindCSS 3** - Utility-first CSS
- **Svelte 5** - Reactive UI components

### Backend
- **Node.js 20+** - JavaScript runtime
- **better-sqlite3** - Embedded SQL database
- **whatsapp-web.js 1.25+** - WhatsApp client library
- **@anthropic-ai/sdk** - Claude AI integration
- **OpenAI** - Text embeddings (text-embedding-3-small)
- **Qdrant 1.7.4** - Vector database

### Deployment
- **Docker** - Containerization
- **docker-compose** - Multi-container orchestration

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm
- Docker and docker-compose
- Anthropic API key (Claude)
- OpenAI API key (Embeddings)
- WhatsApp account for pairing

### Installation

```bash
# Clone repository
git clone <repository-url>
cd mila

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys and credentials

# Initialize database
pnpm run init-db

# Start Qdrant
docker compose up -d qdrant

# Start development server
pnpm run dev
```

### Access Admin Panel

1. Open http://localhost:5173/admin
2. Login with credentials from `.env` (default: admin/changeme)
3. Navigate to dashboard

### Pair WhatsApp

1. In the dashboard, you'll see a QR code
2. Open WhatsApp on your phone → Settings → Linked Devices
3. Scan the QR code
4. Wait for "Connected" status

### Add Knowledge

1. Go to **Knowledge Base** → **Add New Entry**
2. Fill in:
   - Title: "Beginner Yoga Classes"
   - Category: "classes"
   - Content: Markdown content about classes
   - Keywords: "beginner, hatha, intro"
3. Save and test via WhatsApp

### Test Integration

Send a WhatsApp message to your number:
```
!test What classes do you offer?
```

You should receive an AI-generated response based on your knowledge base.

## Project Structure

```
mila/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/              # Database layer
│   │   │   │   ├── schema.js    # SQLite schema
│   │   │   │   └── index.js     # DB connection
│   │   │   ├── agent/           # AI agent
│   │   │   │   ├── claude-agent.js  # Main agent logic
│   │   │   │   └── tools.js         # Tool definitions
│   │   │   ├── vector/          # Vector database
│   │   │   │   ├── qdrant.js    # Qdrant client
│   │   │   │   └── embeddings.js    # OpenAI embeddings
│   │   │   ├── whatsapp/        # WhatsApp integration
│   │   │   │   ├── client.js    # Client setup
│   │   │   │   ├── handler.js   # Message handler
│   │   │   │   └── state.js     # Shared state
│   │   │   ├── services/        # Business logic
│   │   │   │   ├── knowledge.js     # Knowledge CRUD
│   │   │   │   ├── tenant.js        # Tenant management
│   │   │   │   └── conversation.js  # History management
│   │   │   └── startup.js       # Lifecycle management
│   │   ├── components/ui/       # Reusable components
│   │   └── utils/               # Utilities
│   ├── routes/
│   │   ├── admin/               # Admin routes
│   │   │   ├── +page.svelte         # Dashboard
│   │   │   ├── tenants/             # Tenant management
│   │   │   ├── knowledge/           # Knowledge base
│   │   │   └── conversations/       # Conversation viewer
│   │   └── api/                 # API endpoints
│   └── hooks.server.js          # Auth middleware
├── scripts/
│   ├── init-db.js               # Database initialization
│   └── start.js                 # Production startup
├── docs/
│   ├── DEPLOYMENT.md            # Deployment guide
│   └── TESTING.md               # Testing checklist
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Architecture

### System Flow

```
WhatsApp Message
    ↓
WhatsApp Client (whatsapp-web.js)
    ↓
Message Handler
    ↓
    ├─→ Load Conversation History (SQLite)
    ↓
Claude AI Agent
    ↓
    ├─→ knowledge_search tool
    │       ↓
    │   Generate Embedding (OpenAI)
    │       ↓
    │   Search Qdrant (with tenant filter)
    │       ↓
    │   Return top 3 results
    │
    ├─→ escalate_to_human tool
    │       ↓
    │   Log to escalations table
    ↓
Generate Response
    ↓
Send via WhatsApp
    ↓
Save to Conversation History
```

### Database Schema

#### Tenants
```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp_number TEXT UNIQUE,
  api_keys JSON,
  settings JSON,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Knowledge Entries
```sql
CREATE TABLE knowledge_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,  -- schedules, classes, etc.
  content TEXT NOT NULL,
  keywords TEXT,            -- Comma-separated
  vector_id TEXT,           -- Qdrant point ID
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

#### Conversations
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  messages JSON,            -- Array of {role, content, timestamp}
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

#### Escalations
```sql
CREATE TABLE escalations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

## Configuration

### Environment Variables

```env
# Admin Authentication
ADMIN_USER=admin
ADMIN_PASS=your_secure_password

# API Keys
ANTHROPIC_API_KEY=sk-ant-...  # Claude API key
OPENAI_API_KEY=sk-...         # OpenAI API key

# Database
DATABASE_URL=sqlite:./data/yoga-assistant.db

# Qdrant
QDRANT_URL=http://localhost:6333

# Node Environment
NODE_ENV=development

# WhatsApp
WHATSAPP_SESSION_PATH=./.wwebjs_auth

# Logging (optional)
LOG_LEVEL=INFO
```

### Knowledge Categories

Predefined categories for organizing knowledge entries:
- `schedules` - Class schedules
- `classes` - Class descriptions and types
- `purchases & registrations` - How to sign up and buy packages
- `pricing & policies` - Pricing information and studio policies
- `location & facilities` - Studio location and amenities

## Development

### Run Development Server

```bash
# Start Qdrant
docker compose up -d qdrant

# Start dev server
pnpm run dev
```

Navigate to http://localhost:5173/admin

### Build for Production

```bash
pnpm run build
pnpm run preview
```

### Database Management

```bash
# Initialize database
pnpm run init-db

# Access SQLite directly
sqlite3 data/yoga-assistant.db

# Update tenant WhatsApp number
node scripts/update-tenant-whatsapp.js 6281234567890
```

## Deployment

### Docker Deployment (Recommended)

```bash
# Create environment file
cp .env.example .env
# Edit .env with your credentials

# Build and start all services
docker compose up -d --build

# Check logs
docker compose logs -f app

# Access application
# http://localhost:3000/admin
```

### Production Checklist

- [ ] Change default admin password
- [ ] Set strong, unique passwords
- [ ] Configure HTTPS (reverse proxy)
- [ ] Set up automated backups
- [ ] Monitor API usage and costs
- [ ] Configure log rotation
- [ ] Set up monitoring/alerts

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment guide.

## Testing

### Manual Testing

```bash
# Test ping
Send: !ping
Expected: pong

# Test knowledge search (English)
Send: !test What classes do you offer?
Expected: AI response with class information

# Test bilingual (Indonesian)
Send: !test Berapa harga membership?
Expected: AI response in Indonesian

# Test escalation
Send: !test I have severe back pain
Expected: AI escalates to human
```

See [docs/TESTING.md](docs/TESTING.md) for comprehensive testing checklist.

## API Documentation

### WhatsApp Status API

**GET** `/api/whatsapp/status`
```json
{
  "status": "connected" | "qr_ready" | "disconnected"
}
```

**GET** `/api/whatsapp/qr`
```json
{
  "qr": "data:image/png;base64,..."
}
```

### Knowledge Base API

**GET** `/api/knowledge` - List knowledge entries
**POST** `/api/knowledge` - Create entry
**PUT** `/api/knowledge` - Update entry
**DELETE** `/api/knowledge` - Delete entry

### Tenants API

**GET** `/api/tenants` - List tenants
**POST** `/api/tenants` - Create tenant
**PUT** `/api/tenants` - Update tenant

## Troubleshooting

### WhatsApp Not Connecting

```bash
# Clear session and re-pair
docker compose down
rm -rf whatsapp-auth/
docker compose up -d
```

### Qdrant Connection Failed

```bash
# Check Qdrant is running
docker compose ps

# Restart Qdrant
docker compose restart qdrant
```

### AI Not Responding

1. Check API keys are valid
2. Verify API credits (OpenAI and Anthropic)
3. Check tenant WhatsApp number matches
4. Review logs: `docker compose logs -f app`

## Monitoring

### View Logs

```bash
# Application logs
docker compose logs -f app

# Qdrant logs
docker compose logs -f qdrant

# All logs
docker compose logs -f
```

### Check Health

```bash
# Service status
docker compose ps

# Resource usage
docker stats
```

### Monitor API Usage

- **Anthropic**: https://console.anthropic.com/usage
- **OpenAI**: https://platform.openai.com/usage

## Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### Phase 11: Analytics (Future)
- Message volume dashboard
- Response time metrics
- Knowledge coverage analysis
- User satisfaction tracking

### Phase 12: Advanced Features (Future)
- Scheduled messages (class reminders)
- Multi-WhatsApp support (one per tenant)
- Rich media in knowledge base
- Conversation export

### Phase 13: Production Hardening (Future)
- Redis for conversation cache
- PostgreSQL option
- Secrets management (Vault)
- Automated backups
- Monitoring and alerting

## Security

- Basic HTTP authentication for admin panel
- API keys stored in environment variables
- SQLite database with foreign key constraints
- Rate limiting on WhatsApp messages (10/min per user)
- Input validation on all forms
- Tenant isolation in vector search

**Security Best Practices:**
- Never commit `.env` file
- Use strong passwords
- Enable HTTPS in production
- Regularly update dependencies
- Monitor API usage

## Performance

- **Concurrency**: Handles ~100 conversations/day per instance
- **Response Time**: < 5 seconds for simple queries
- **Database**: SQLite in WAL mode for better concurrency
- **Caching**: Conversation history cached in-memory
- **Rate Limiting**: 10 messages/user/minute

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
- Embeddings by [OpenAI](https://openai.com/)
- Vector search by [Qdrant](https://qdrant.tech/)
- WhatsApp integration via [whatsapp-web.js](https://wwebjs.dev/)

## Support

For issues, questions, or feature requests:
- Check [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/TESTING.md](docs/TESTING.md)
- Search existing issues
- Create a new issue with detailed description

---

**Built with ❤️ for yoga studios worldwide**
