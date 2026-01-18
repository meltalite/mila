# MILA Testing Guide

This document provides a comprehensive manual testing checklist to verify all features work correctly.

## Prerequisites

- MILA deployed and running (see DEPLOYMENT.md)
- Admin access credentials
- WhatsApp paired and connected
- Sample knowledge entries in database

## Test Scenarios

### 1. Authentication & Authorization

**Test: Admin Login**
- [ ] Navigate to http://localhost:3000/admin
- [ ] Browser prompts for username/password
- [ ] Enter invalid credentials
  - Expected: 401 Unauthorized, prompted again
- [ ] Enter valid credentials from `.env`
  - Expected: Dashboard loads successfully

**Test: Session Persistence**
- [ ] Login to admin panel
- [ ] Refresh the page
  - Expected: Still logged in, no new login prompt
- [ ] Open new browser tab to /admin
  - Expected: Requires login again (Basic Auth doesn't persist across tabs)

---

### 2. Dashboard

**Test: Dashboard Statistics**
- [ ] Navigate to /admin
- [ ] Verify statistics display correctly:
  - [ ] Knowledge Entries count (should match actual count)
  - [ ] Active Tenants count (at least 1)
  - [ ] Messages Today (0 if no messages sent today)
  - [ ] Total Conversations
  - [ ] Escalations Today

**Test: WhatsApp Status**
- [ ] Check WhatsApp Status card
- [ ] If not connected:
  - [ ] QR code should be displayed
  - [ ] Instructions shown: "Scan this QR code..."
- [ ] If connected:
  - [ ] Status badge shows "Connected" (green)
  - [ ] No QR code displayed

**Test: Recent Activity**
- [ ] Send a test message via WhatsApp
- [ ] Refresh dashboard
- [ ] Recent Activity should show:
  - [ ] User phone number (last 10 digits)
  - [ ] Tenant name
  - [ ] Message preview (first 60 chars)
  - [ ] Timestamp

---

### 3. Tenant Management

**Test: View Tenants**
- [ ] Navigate to /admin/tenants
- [ ] Tenant list displays with columns:
  - [ ] Name
  - [ ] WhatsApp Number
  - [ ] Status badge (Active/Inactive)
  - [ ] Created Date

**Test: Create Tenant**
- [ ] Click "Add New Tenant"
- [ ] Leave all fields empty, submit
  - Expected: Validation errors
- [ ] Fill in valid data:
  - Name: "Test Yoga Studio"
  - WhatsApp: "6281234567890"
  - Settings: `{"business_hours": "Mon-Fri 9-17"}`
  - Active: Checked
- [ ] Submit form
  - Expected: Redirects to tenant list, new tenant appears

**Test: Edit Tenant**
- [ ] Click on a tenant to view/edit
- [ ] Modify name, save
  - Expected: Changes saved, redirects back
- [ ] Toggle Active status
  - Expected: Status updates immediately

**Test: Tenant Validation**
- [ ] Try invalid WhatsApp number: "abc123"
  - Expected: Error "Invalid WhatsApp number format"
- [ ] Try invalid JSON in settings: `{invalid}`
  - Expected: JSON validation error

---

### 4. Knowledge Base Management

**Test: View Knowledge Entries**
- [ ] Navigate to /admin/knowledge
- [ ] Entry list displays with:
  - [ ] Title
  - [ ] Category
  - [ ] Keywords (as tags)
  - [ ] Status badge
  - [ ] Last Updated

**Test: Filter Entries**
- [ ] Use Category dropdown to filter
  - Expected: Only entries in selected category shown
- [ ] Use Status dropdown to filter by "active"
  - Expected: Only active entries shown
- [ ] Use Search box to search by title
  - Expected: Matching entries shown

**Test: Create Knowledge Entry**
- [ ] Click "Add New Entry"
- [ ] Fill in form:
  - Tenant: Select from dropdown
  - Title: "Beginner Yoga Classes"
  - Category: "classes"
  - Content: Write markdown content with headings
  - Keywords: "beginner, hatha, intro"
  - Status: "active"
- [ ] Preview markdown
  - Expected: Headings, bold, italic render correctly
- [ ] Submit form
  - Expected: Entry created, redirects to view page

**Test: Edit Knowledge Entry**
- [ ] Click on an entry to view
- [ ] Click "Edit"
- [ ] Modify content
- [ ] Save
  - Expected: Changes saved, vector embedding updated

**Test: Delete Knowledge Entry**
- [ ] Click "Delete" on an entry
- [ ] Confirm deletion dialog appears
- [ ] Cancel deletion
  - Expected: Entry still exists
- [ ] Delete again, confirm
  - Expected: Entry removed from list and database

**Test: Vector Sync**
- [ ] Create a new knowledge entry
- [ ] Check Qdrant:
  ```bash
  curl http://localhost:6333/collections/yoga_knowledge/points/scroll | jq
  ```
  - Expected: New vector point exists
- [ ] Delete the entry
- [ ] Check Qdrant again
  - Expected: Vector point removed

---

### 5. Conversations

**Test: View Conversations**
- [ ] Navigate to /admin/conversations
- [ ] Conversation list displays:
  - [ ] User phone number
  - [ ] Tenant name
  - [ ] Last message time
  - [ ] Expand/collapse button

**Test: Conversation Details**
- [ ] Click to expand a conversation
- [ ] Messages display:
  - [ ] User messages on left (gray)
  - [ ] Assistant messages on right (purple)
  - [ ] Timestamps
  - [ ] Message content

**Test: Filters**
- [ ] Filter by tenant
  - Expected: Only conversations for selected tenant
- [ ] Adjust limit (show 5, 10, 20 conversations)
  - Expected: Pagination works

**Test: Statistics**
- [ ] Verify statistics cards:
  - [ ] Total Conversations
  - [ ] Total Messages
  - [ ] Conversations Today

---

### 6. WhatsApp Integration

**Test: QR Code Pairing**
- [ ] If not paired, delete session:
  ```bash
  docker-compose down
  rm -rf whatsapp-auth/
  docker-compose up -d
  ```
- [ ] Navigate to /admin
- [ ] QR code displayed in WhatsApp Status card
- [ ] Scan with WhatsApp mobile app
  - Expected: Status changes to "Connected"

**Test: Message Handling**
- [ ] Send test message: `!test Hello`
  - Expected: AI responds with greeting
- [ ] Send question: `!test What classes do you offer?`
  - Expected: AI searches knowledge base, responds with classes info
- [ ] Send in Indonesian: `!test Jam buka berapa?`
  - Expected: AI responds in Indonesian with business hours

**Test: Rate Limiting**
- [ ] Send 10 messages rapidly (within 1 minute)
  - Expected: All 10 should be processed
- [ ] Send 11th message
  - Expected: "Please wait a moment..." response
- [ ] Wait 1 minute
- [ ] Send another message
  - Expected: Processed normally

**Test: Ping Command**
- [ ] Send: `!ping`
  - Expected: Immediate "pong" response

---

### 7. AI Agent

**Test: Knowledge Search**
- [ ] Send: `!test What are your class schedules?`
  - Expected: Agent uses knowledge_search tool, returns schedule info
- [ ] Check logs: `docker-compose logs app | grep "knowledge_search"`
  - Expected: Tool call logged

**Test: Bilingual Support**
- [ ] Send in English: `!test What is the pricing?`
  - Expected: Response in English
- [ ] Send in Indonesian: `!test Berapa harga kelas?`
  - Expected: Response in Indonesian

**Test: Conversation Context**
- [ ] Send: `!test Tell me about beginner classes`
  - Wait for response
- [ ] Send follow-up: `!test How much do they cost?`
  - Expected: Agent understands "they" refers to beginner classes

**Test: Escalation**
- [ ] Send: `!test I have severe back pain, is yoga safe?`
  - Expected: Agent uses escalate_to_human tool, explains it's escalating
- [ ] Check database:
  ```sql
  SELECT * FROM escalations ORDER BY created_at DESC LIMIT 1;
  ```
  - Expected: New escalation record created

---

### 8. Multi-Tenant Isolation

**Test: Create Second Tenant**
- [ ] Create a new tenant: "Studio B"
- [ ] Set different WhatsApp number: "6289999999999"
- [ ] Create knowledge entries for Studio B only

**Test: Verify Isolation**
- [ ] Send message to Studio A's WhatsApp
  - Expected: Only Studio A's knowledge returned
- [ ] Send message to Studio B's WhatsApp
  - Expected: Only Studio B's knowledge returned
- [ ] Verify in logs: tenant_id filter applied in vector search

---

### 9. Error Handling

**Test: Qdrant Unavailable**
- [ ] Stop Qdrant: `docker-compose stop qdrant`
- [ ] Try to create knowledge entry
  - Expected: Error message about vector database
- [ ] Restart Qdrant: `docker-compose start qdrant`

**Test: Invalid API Keys**
- [ ] Set invalid ANTHROPIC_API_KEY in .env
- [ ] Restart: `docker-compose restart app`
- [ ] Send test message
  - Expected: Error logged, fallback message sent
- [ ] Restore valid API key, restart

**Test: Database Errors**
- [ ] Try to create duplicate tenant (same name)
  - Expected: Constraint violation error handled gracefully

---

### 10. Docker Deployment

**Test: Full Stack Startup**
- [ ] Stop all services: `docker-compose down`
- [ ] Start fresh: `docker-compose up -d`
- [ ] Check logs: `docker-compose logs -f app`
  - Expected:
    ```
    [1/6] Checking Qdrant availability...
    [2/6] Initializing database...
    [3/6] Setting up Qdrant collection...
    [4/6] Running cleanup tasks...
    [5/6] Starting WhatsApp client...
    [6/6] Starting SvelteKit server...
    ✅ MILA is ready!
    ```

**Test: Data Persistence**
- [ ] Create a knowledge entry
- [ ] Restart containers: `docker-compose restart`
- [ ] Check knowledge entry still exists
  - Expected: Data persists across restarts

**Test: WhatsApp Session Persistence**
- [ ] Pair WhatsApp (if not already paired)
- [ ] Restart app: `docker-compose restart app`
  - Expected: WhatsApp reconnects automatically (no new QR)

---

## Success Criteria Checklist

From the original requirements, verify:

- [x] 1. Admin can login with basic auth
- [x] 2. Admin can create/manage tenants
- [x] 3. Admin can CRUD knowledge base entries
- [x] 4. WhatsApp connects and shows QR code
- [x] 5. User messages trigger agent responses
- [x] 6. Agent searches knowledge base correctly
- [x] 7. Agent responds in user's language (ID/EN)
- [x] 8. Escalation to human works
- [x] 9. Multi-tenant filtering works in vector search
- [x] 10. Docker deployment works end-to-end

---

## Performance Testing

**Test: Response Time**
- [ ] Measure time from sending WhatsApp message to receiving response
  - Expected: < 5 seconds for simple queries
  - Expected: < 10 seconds for complex queries requiring knowledge search

**Test: Concurrent Messages**
- [ ] Send messages from 3 different users simultaneously
  - Expected: All processed without errors

---

## Regression Testing

After any code changes, re-run critical paths:
1. Login to admin
2. Create knowledge entry
3. Send WhatsApp message
4. Verify response uses knowledge search
5. Check conversation history

---

## Bug Reporting Template

If you find a bug during testing, report it with:

```markdown
**Description**: Brief description of the issue

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Result**: What should happen

**Actual Result**: What actually happens

**Screenshots**: If applicable

**Environment**:
- OS:
- Docker version:
- Node version (if not using Docker):
- Browser (if UI issue):

**Logs**:
```
Paste relevant log excerpts
```
```

---

## Notes

- Remove `!test` prefix from messages when deploying to production
- Escalations are logged but not sent anywhere - implement notification system separately
- Rate limiting is per-user, resets every minute
- Conversation cleanup runs on startup, deletes conversations older than 7 days
