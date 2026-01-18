# MILA Deployment Guide

## Prerequisites

Before deploying MILA, ensure you have:

- **Docker** (20.10+) and **docker-compose** (1.29+) installed
- **Anthropic API Key** for Claude AI (get it from https://console.anthropic.com/)
- **OpenAI API Key** for embeddings (get it from https://platform.openai.com/)
- At least 2GB RAM and 10GB disk space
- **WhatsApp account** for pairing (cannot be already linked to WhatsApp Web)

## Quick Start

### 1. Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd mila

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required environment variables:
```env
ADMIN_USER=admin              # Admin username
ADMIN_PASS=your_secure_pass   # Change this!
ANTHROPIC_API_KEY=sk-ant-... # Your Claude API key
OPENAI_API_KEY=sk-...        # Your OpenAI API key
```

### 2. Initialize Database

```bash
# Install dependencies (development only)
pnpm install

# Initialize database with seed data
pnpm run init-db
```

This creates:
- SQLite database at `data/yoga-assistant.db`
- Default tenant: "Peaceful Yoga Studio"
- Sample knowledge entries (Indonesian)

### 3. Deploy with Docker

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f app

# You should see:
# [1/6] Checking Qdrant availability...
# [2/6] Initializing database...
# [3/6] Setting up Qdrant collection...
# [4/6] Running cleanup tasks...
# [5/6] Starting WhatsApp client...
# [6/6] Starting SvelteKit server...
# ✅ MILA is ready!
```

### 4. Access Admin Panel

1. Open browser to http://localhost:3000/admin
2. Login with credentials from `.env` (default: admin/changeme)
3. You should see the dashboard with WhatsApp status

### 5. Pair WhatsApp

1. In the dashboard, you'll see a QR code (if not already paired)
2. Open WhatsApp on your phone
3. Go to Settings > Linked Devices > Link a Device
4. Scan the QR code displayed in the admin panel
5. Status should change to "Connected" (green)

## Configuration

### Tenant Setup

1. Go to **Admin > Tenants**
2. Edit the default tenant or create a new one
3. Set the **WhatsApp Number** (must match the number receiving messages)
   - Format: Country code + number (e.g., `6281234567890` for Indonesia)
4. Configure **Settings** (JSON):
   ```json
   {
     "business_hours": "Mon-Sat 7:00-20:00",
     "greeting_message": "Welcome to our yoga studio!",
     "auto_escalation_rules": {
       "medical_keywords": ["injury", "pain", "medical", "doctor"]
     }
   }
   ```

### Knowledge Base

1. Go to **Admin > Knowledge Base**
2. Add entries for your yoga studio:
   - **Categories**: schedules, classes, purchases & registrations, pricing & policies, location & facilities
   - **Content**: Write in markdown, use clear language
   - **Keywords**: Add relevant search terms (comma-separated)
3. AI agent will search these entries when users ask questions

## Testing

### Test WhatsApp Integration

1. Send a message to your WhatsApp number: `!test Halo, ada kelas untuk pemula?`
   - The `!test` prefix is required in development mode
2. You should receive a response from the AI agent
3. Check **Admin > Conversations** to see the conversation history

### Test Knowledge Search

Send questions that match your knowledge base:
- "What classes do you offer?"
- "Berapa harga membership?" (Indonesian)
- "Where is the studio located?"

### Test Escalation

Send a message that should trigger human escalation:
- "I have severe back pain, is yoga safe for me?"
- AI should respond that it's escalating to a human instructor

## Production Deployment

### Environment Variables

For production, add these to docker-compose.yml or your hosting platform:

```yaml
environment:
  - ADMIN_USER=${ADMIN_USER}
  - ADMIN_PASS=${ADMIN_PASS}
  - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
  - OPENAI_API_KEY=${OPENAI_API_KEY}
  - QDRANT_URL=http://qdrant:6333
  - DATABASE_URL=sqlite:./data/yoga-assistant.db
  - NODE_ENV=production
  - PORT=3000
  - LOG_LEVEL=INFO
```

### Security Checklist

- [ ] Change default admin password
- [ ] Use strong, unique passwords
- [ ] Keep API keys secret (never commit to git)
- [ ] Enable HTTPS (use reverse proxy like Nginx or Caddy)
- [ ] Restrict admin panel access (IP whitelist or VPN)
- [ ] Regularly update dependencies
- [ ] Monitor API usage and costs

### Backup and Restore

**Backup**:
```bash
# Stop services
docker-compose down

# Backup data
tar -czf mila-backup-$(date +%Y%m%d).tar.gz data/ whatsapp-auth/ whatsapp-cache/

# Restart services
docker-compose up -d
```

**Restore**:
```bash
# Stop services
docker-compose down

# Extract backup
tar -xzf mila-backup-20250115.tar.gz

# Restart services
docker-compose up -d
```

### Scaling Considerations

- **Single Instance**: Current setup handles ~100 conversations/day
- **Multiple Tenants**: Supported, data isolated by tenant_id
- **High Volume**: Consider upgrading to:
  - PostgreSQL instead of SQLite
  - Redis for conversation caching
  - Horizontal scaling with load balancer

## Troubleshooting

### WhatsApp Not Connecting

**Symptom**: QR code keeps refreshing or status shows "Disconnected"

**Solutions**:
1. Check logs: `docker-compose logs -f app`
2. Ensure WhatsApp number is not already linked elsewhere
3. Delete session and re-pair:
   ```bash
   docker-compose down
   rm -rf whatsapp-auth/
   docker-compose up -d
   ```
4. Check Chromium dependencies in Docker container

### Qdrant Connection Failed

**Symptom**: `[1/6] Checking Qdrant availability... Failed`

**Solutions**:
1. Check Qdrant is running: `docker-compose ps`
2. Check Qdrant logs: `docker-compose logs qdrant`
3. Restart Qdrant: `docker-compose restart qdrant`
4. Verify port not in use: `netstat -tulpn | grep 6333`

### AI Agent Not Responding

**Symptom**: Messages received but no response

**Solutions**:
1. Check API keys are valid
2. Verify API credits (OpenAI and Anthropic)
3. Check tenant WhatsApp number matches message destination
4. Review logs for errors: `docker-compose logs -f app`
5. Test with `!ping` command (should reply "pong")

### Database Locked

**Symptom**: `SQLITE_BUSY` or `SQLITE_LOCKED` errors

**Solutions**:
1. SQLite uses WAL mode (should handle concurrency)
2. Check for long-running queries
3. Restart app: `docker-compose restart app`
4. For high concurrency, migrate to PostgreSQL

### Vector Dimension Mismatch

**Symptom**: `Vector dimension mismatch` error

**Solutions**:
1. Delete Qdrant collection and recreate:
   ```bash
   docker-compose down
   rm -rf qdrant_storage/
   docker-compose up -d
   ```
2. Verify OpenAI embedding model is `text-embedding-3-small` (1536 dimensions)

## Monitoring

### Check Application Health

```bash
# View application logs
docker-compose logs -f app

# Check service status
docker-compose ps

# View resource usage
docker stats
```

### Monitor API Usage

1. **Anthropic**: https://console.anthropic.com/usage
2. **OpenAI**: https://platform.openai.com/usage

Set up billing alerts to avoid unexpected charges.

## Updating

```bash
# Pull latest code
git pull

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check logs
docker-compose logs -f app
```

## Support

For issues, questions, or feature requests:
1. Check this documentation
2. Review logs for error messages
3. Search existing issues on GitHub
4. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Relevant log excerpts
   - Environment details (OS, Docker version, etc.)
