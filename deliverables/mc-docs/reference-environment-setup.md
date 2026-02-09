# Environment Setup Guide

**Tags:** `reference`, `setup`
**Updated:** 2026-02-02

---

## slideheroes-internal-tools

### Prerequisites
- Node.js 22+
- pnpm

### Setup
```bash
cd ~/slideheroes-internal-tools/app
pnpm install
```

### Environment
Create `.env.local`:
```
DATABASE_URL=file:./dev.db
OPENAI_API_KEY=sk-...
```

### Database
```bash
# Run migrations
npx prisma migrate dev

# Seed data (Reddit feeds)
npx prisma db seed

# View database
npx prisma studio
```

### Run Development
```bash
npm run dev
# Opens at http://localhost:3001
```

### Common Commands
```bash
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run build        # Production build
```

---

## Sophie Workspace

### Location
```
~/clawd/
```

### Key Files
```
AGENTS.md       # Agent instructions
SOUL.md         # Personality/identity
USER.md         # About Mike
TOOLS.md        # Local tool notes
MEMORY.md       # Long-term memory
HEARTBEAT.md    # Periodic check tasks

memory/         # Daily notes
state/          # Current state
deliverables/   # Outputs for Mike
```

### Git
```bash
cd ~/clawd
git status
git add -A && git commit -m "message"
git push
```

---

## Clawdbot

### Check Status
```bash
clawdbot status
clawdbot gateway status
```

### Restart
```bash
clawdbot gateway restart
```

### Config
Located in Clawdbot config file (managed by Clawdbot).

---

## Database Locations

| System | Database |
|--------|----------|
| Mission Control | `~/slideheroes-internal-tools/app/dev.db` |
| Feed Monitor | Same as MC |
| Clawdbot | Internal SQLite |

---

## Ports

| Service | Port |
|---------|------|
| Mission Control | 3001 |
| SlideHeroes App | 3000 (when running) |

---

## Troubleshooting

### Prisma Issues
```bash
# Regenerate client
npx prisma generate

# Reset database (WARNING: deletes data)
npx prisma migrate reset
```

### Node Modules
```bash
rm -rf node_modules
pnpm install
```

### Port Conflicts
```bash
lsof -i :3001
kill -9 <PID>
```
