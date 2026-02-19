# Perplexity Research: Self-Hosted Open Source Help Desk Solutions for Small Business

**Date**: 2026-02-19
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Comprehensive evaluation of open source, self-hosted customer service and help desk solutions suitable for a small business. Research covered top actively maintained options as of early 2026, evaluating core features, hosting requirements, setup complexity, UI quality, community health, limitations, and pricing models.

---

## Top Solutions Evaluated

Eight solutions were identified as actively maintained and worth evaluating. Two additional solutions (Trudesk, Helpy) were investigated but found to have low or stalled activity.

---

### 1. Chatwoot

**Website**: chatwoot.com | **GitHub**: github.com/chatwoot/chatwoot
**GitHub Stars**: ~21k+ | **License**: MIT
**Latest Release**: v4.10.0 (January 16, 2026) | **Release Cadence**: Monthly
**Tech Stack**: Ruby on Rails, PostgreSQL, Redis, Sidekiq

#### Core Features
- **Ticketing**: Unified inbox with labels, assignments, priorities, collision detection
- **Live Chat**: Customizable website widget with multilingual support, pre-chat forms
- **Knowledge Base**: Branded help center with multiple portals, article search in chat widget
- **Email**: Full IMAP/SMTP integration, email treated as a chat channel
- **Omnichannel**: WhatsApp Business API, Facebook Messenger, Instagram DMs, Telegram, Line, custom API channels
- **AI**: "Captain" AI assistant for reply drafting, summarization, knowledge base suggestions
- **Reporting**: Real-time dashboards, CSAT surveys, agent/team metrics
- **Other**: Campaigns, SLAs, automations (auto-labeling, macros, webhooks), canned responses, team collaboration (private notes, @mentions)

#### Self-Hosting Requirements
- **Minimum**: 4 GB RAM, 2 CPU cores (small deployment)
- **Dependencies**: PostgreSQL, Redis, Sidekiq (background jobs)
- **Docker**: Official Docker Compose setup, well-documented
- **Disk**: Moderate; grows with attachments and conversation history
- **Complexity**: Medium - requires familiarity with Rails apps and Docker

#### UI/UX Quality
Modern, clean interface. Feels like a commercial product. Mobile-responsive. The widget is polished and customizable.

#### Community Activity
- 316+ contributors, 133 releases total
- Monthly release cadence with milestones planned through May 2026
- Active development: WhatsApp templates, Twilio CTA, Shopify/Linear integrations added in 2025
- Strong Discord/community support

#### Limitations
- Heavier resource requirements than PHP-based alternatives
- Scaling self-hosted instances requires DevOps expertise
- AI features (Captain) may need tuning
- No built-in telephony in open-source edition
- More chat-focused than traditional ticket-focused

#### Pricing Model
**Fully free and open-source** for self-hosted. Optional paid cloud plans exist. No open-core restrictions on self-hosted features.

---

### 2. FreeScout

**Website**: freescout.net | **GitHub**: github.com/freescout-helpdesk/freescout
**GitHub Stars**: ~3k-5k | **License**: AGPL-3.0
**Tech Stack**: PHP (Laravel), MySQL/MariaDB

#### Core Features
- **Ticketing**: Shared inbox model (like HelpScout/Zendesk), conversation-based
- **Live Chat**: Available as paid module
- **Knowledge Base**: Available as module
- **Email**: Core strength - converts emails directly to tickets, seamless reply flow
- **Modules**: WhatsApp, Facebook, Telegram, LDAP, CRM, End-User Portal, Kanban mode
- **Mobile**: Free iOS and Android PWA apps

#### Self-Hosting Requirements
- **Minimum**: 512 MB - 1 GB RAM (extremely lightweight)
- **Dependencies**: PHP 7.1+, MySQL/MariaDB, web server (Apache/Nginx)
- **Docker**: Easy Docker Compose setup available
- **Disk**: Minimal - distribution kit is only 10 MB
- **Complexity**: Very low - runs on shared hosting, simplest to deploy of all options

#### UI/UX Quality
Clean, modern interface deliberately modeled after HelpScout. Described consistently as having "the best design and usability" among open-source options. Familiar email-like workflow.

#### Community Activity
- Active development with patches and updates in 2025-2026
- Growing popularity among self-hosting communities
- Modular extension ecosystem (similar to WordPress plugins)

#### Limitations
- Many useful features (live chat, knowledge base, CRM) require paid modules ($0-199 per module)
- Email-centric - not designed for real-time omnichannel out of the box
- Smaller community than Chatwoot or Zammad
- No native AI features

#### Pricing Model
**Open-core**: Free core with paid modules. Core is fully functional for email ticketing. Advanced modules (live chat, WhatsApp, LDAP, etc.) are paid, typically one-time purchases ranging $29-199 per module.

---

### 3. Zammad

**Website**: zammad.com | **GitHub**: github.com/zammad/zammad
**GitHub Stars**: ~5.3k | **License**: AGPL-3.0
**Tech Stack**: Ruby on Rails, PostgreSQL (switching to PostgreSQL-only in v7.0), Elasticsearch

#### Core Features
- **Ticketing**: Full-featured with custom forms, workflows, SLA management, macros
- **Live Chat**: Integrated chat support
- **Knowledge Base**: Built-in wiki-style knowledge base
- **Email**: Email-to-ticket with threading
- **Omnichannel**: Email, phone logging, social media (Twitter, Facebook, Telegram)
- **Search**: Elasticsearch-powered full-text search across all tickets
- **Reporting**: Visual dashboards, detailed analytics (response times, satisfaction, volumes)
- **Other**: REST API, LDAP, role-based access control, time-based escalation triggers

#### Self-Hosting Requirements
- **Minimum**: 4 GB RAM (8 GB recommended), 4 vCPUs
- **Dependencies**: PostgreSQL, Elasticsearch (mandatory for search)
- **Docker**: Official Docker Compose setup; virtually mandatory due to complex dependency stack
- **Disk**: Moderate to high (Elasticsearch indexes)
- **Complexity**: Medium-High - Elasticsearch adds operational overhead
- **Cost estimate**: ~$10/month for a 4 vCPU, 8 GB RAM cloud server

#### UI/UX Quality
Modern interface that mirrors Zendesk patterns. Clean and functional. Can open multiple tickets simultaneously without browser tab switching. Responsive design.

#### Community Activity
- Strong, sustained development with modern UI updates in 2025-2026
- Enterprise backing (Zammad GmbH, German company)
- Professional documentation
- Active community forums

#### Limitations
- **Resource-heavy**: Will not run stably on small VPS (2 GB RAM insufficient)
- Elasticsearch is mandatory and adds complexity
- MySQL/MariaDB support being dropped in v7.0 (PostgreSQL only)
- Installation without Docker is time-consuming
- Steeper learning curve than FreeScout

#### Pricing Model
**Fully free and open-source** for self-hosted. Paid hosted plans start at $4,500/year for 25 users. No open-core feature restrictions.

---

### 4. osTicket

**Website**: osticket.com | **GitHub**: github.com/osTicket/osTicket
**GitHub Stars**: ~3k+ | **License**: GPL-2.0
**Tech Stack**: PHP, MySQL

#### Core Features
- **Ticketing**: Robust ticket management with custom forms, workflows, SLA management
- **Live Chat**: Not native (available via third-party add-ons)
- **Knowledge Base**: Help topics and FAQ system
- **Email**: Email-to-ticket, web forms, API ticket creation
- **Other**: Agent collision avoidance, custom fields, auto-responder, department routing, phone logging
- **Scale**: 5+ million users worldwide, 15,000+ businesses

#### Self-Hosting Requirements
- **Minimum**: 1-2 GB RAM (very lightweight)
- **Dependencies**: PHP, MySQL, web server (Apache/Nginx)
- **Docker**: Official Docker images available
- **Disk**: Minimal
- **Complexity**: Very low - runs on shared hosting, quick installation

#### UI/UX Quality
**Dated interface** is the most common criticism. Functional but looks like 2010-era software. Editing the UI requires modifying PHP files directly. The admin panel is utilitarian.

#### Community Activity
- One of the oldest solutions (first GitHub release 2013)
- Regular updates for security and workflows
- Large community with plenty of tutorials and add-ons
- Active forums

#### Limitations
- **Outdated UI** is the primary complaint
- No native live chat
- Built-in reports are basic; custom reports need technical skills
- Limited built-in integrations
- No native automation beyond basics
- Mobile experience is poor (no official apps, third-party only)
- Customizing UI requires PHP editing

#### Pricing Model
**Fully free and open-source** for self-hosted. Cloud-hosted option starts at $12/month/agent.

---

### 5. UVdesk

**Website**: uvdesk.com | **GitHub**: github.com/uvdesk/community-skeleton
**GitHub Stars**: ~17.1k | **License**: OSL-3.0
**Tech Stack**: PHP (Symfony), MySQL

#### Core Features
- **Ticketing**: Full ticket management with workflows, email parsing
- **Live Chat**: Not native in community edition
- **Knowledge Base**: Built-in self-service knowledge base
- **Email**: Email-to-ticket with parsing
- **E-Commerce**: Native Shopify and Magento plugins that auto-sync order data with tickets
- **Other**: Automated actions, preset response templates, performance tracking, multi-channel add-ons, form builders, file viewing

#### Self-Hosting Requirements
- **Minimum**: 1-2 GB RAM
- **Dependencies**: PHP 7.2+, Symfony, MySQL, web server
- **Docker**: Community Docker images available
- **Complexity**: Low-Medium (Symfony knowledge helps for customization)

#### UI/UX Quality
Functional but described as "really basic" by reviewers. Clean but not as polished as FreeScout or Chatwoot.

#### Community Activity
- Steady maintenance through 2025-2026
- Listed in multiple "top picks" lists for 2026
- E-commerce integration focus sets it apart

#### Limitations
- UI is basic compared to competitors
- Limited integrations outside e-commerce
- Community Docker support (not official)
- Some bulk operations reported as slow

#### Pricing Model
**Open-core**: Free community edition. Pro plan at $22/month/2 agents. Enterprise at $36/month/2 agents.

---

### 6. Peppermint

**Website**: peppermint.sh | **GitHub**: github.com/Peppermint-Lab/peppermint
**GitHub Stars**: ~2.8k | **License**: AGPL-3.0
**Tech Stack**: Next.js (React), Node.js, Prisma ORM, PostgreSQL

#### Core Features
- **Ticketing**: Web UI for ticket management, dashboard, markdown editor
- **Live Chat**: Not native
- **Knowledge Base**: Todo notebooks (basic)
- **Email**: Email-to-ticket via SMTP/IMAP
- **Other**: OIDC SSO (Keycloak/Authentik), webhooks (Discord, n8n), file uploads, client history logs, multi-team user/role management

#### Self-Hosting Requirements
- **Minimum**: Very low - runs on Raspberry Pi, small VMs, Proxmox containers
- **Dependencies**: PostgreSQL, Node.js
- **Docker**: Easy Docker Compose setup; also one-liner deploy script
- **Complexity**: Very low - designed for homelabs and small teams

#### UI/UX Quality
Modern React-based interface. Responsive from mobile to 4K. Clean and functional but simpler than full-featured alternatives.

#### Community Activity
- Active development with ongoing documentation updates
- Growing community interest (2.8k stars)
- Hostinger offers pre-configured VPS template

#### Limitations
- No enterprise ITSM features (change management, asset management)
- No built-in live chat
- SSO relies on external identity providers
- Webhook extensions need custom scripting
- Smaller community than top-tier options
- Less mature than established alternatives

#### Pricing Model
**Fully free and open-source**. No paid tiers or premium features.

---

### 7. Faveo Helpdesk

**Website**: faveohelpdesk.com | **GitHub**: github.com/ladybirdweb/faveo-helpdesk
**GitHub Stars**: ~1.5k+ | **License**: OSL-3.0
**Tech Stack**: PHP (Laravel), MySQL

#### Core Features
- **Ticketing**: Department-segregated ticket management, SLA management
- **Live Chat**: Via add-ons
- **Knowledge Base**: Built-in self-service portal
- **Email**: Email and social media ticket creation
- **Other**: Invoicing, automation, agent management, reporting/analytics

#### Self-Hosting Requirements
- **Minimum**: 1-2 GB RAM
- **Dependencies**: PHP, MySQL, web server
- **Docker**: Supported
- **Complexity**: Low

#### UI/UX Quality
Clean, user-friendly interface. Business-oriented design.

#### Community Activity
- Active in 2026 comparison reviews
- Business-oriented updates
- SMB-focused development

#### Limitations
- May push toward paid enterprise upgrades
- Smaller community than top-tier options
- Limited third-party integrations in free version
- Patching updates can be slow

#### Pricing Model
**Open-core**: Free community edition. Paid plans: Startup ($6.30/agent/month), SME ($13.50/agent/month), Enterprise (contact sales).

---

### 8. Frappe Helpdesk

**Website**: frappecloud.com/helpdesk | **GitHub**: github.com/frappe/helpdesk
**License**: GPL-3.0
**Tech Stack**: Python (Frappe Framework), MariaDB

#### Core Features
- **Ticketing**: Full ticket management with SLA monitoring, assignment/escalation rules
- **Knowledge Base**: Built-in with FAQs to reduce ticket volume
- **Email**: Email integration for ticket creation/updates
- **Customer Portal**: Self-service portal for ticket tracking
- **Other**: Canned responses, role-based access, B2B organization management, PWA mobile app, customizable priorities, internal notes

#### Self-Hosting Requirements
- **Dependencies**: Frappe framework, MariaDB, Redis
- **Docker**: Supported via Frappe Docker or Easypanel one-click deployment
- **Complexity**: Medium - best suited for teams already in the Frappe/ERPNext ecosystem

#### UI/UX Quality
Clean, modern interface. Well-reviewed for user-friendliness.

#### Community Activity
- Active development with recent demos (late 2024-2025)
- Part of the larger Frappe ecosystem (ERPNext)
- Niche but dedicated community

#### Limitations
- Niche - best for teams already using Frappe/ERPNext
- Less emphasis on live chat compared to Chatwoot
- Smaller community outside Frappe ecosystem
- Docker setup is Frappe-specific (not standard compose)

#### Pricing Model
**Fully free and open-source**. Frappe Cloud offers managed hosting.

---

## Solutions Investigated but Not Recommended

### Trudesk
No evidence of active maintenance into 2025-2026. Appears unmaintained or abandoned. **Not recommended.**

### Helpy
2.5k GitHub stars, MIT license, Ruby-based. Has omnichannel and multilingual support but lower community momentum compared to Chatwoot. Viable but a second-tier choice.

### Hesk
Lightweight PHP/MySQL option. Stable but very basic. Better suited as a minimal FAQ/ticket system than a full help desk. Tied to SysAid as an upsell partner.

---

## Comparison Summary: Ranking for Small Business

| Rank | Solution | Best For | Ease of Setup | Resources | Features | UI/UX | Community | Pricing |
|------|----------|----------|---------------|-----------|----------|-------|-----------|---------|
| 1 | **Chatwoot** | Omnichannel support with live chat focus | Medium | 4GB+ RAM | Excellent | Excellent | Excellent | 100% Free |
| 2 | **FreeScout** | Email-based ticketing, simplest setup | Very Easy | 512MB RAM | Good (core) | Excellent | Good | Open-core |
| 3 | **Zammad** | Feature-complete enterprise-grade | Medium-Hard | 4-8GB RAM | Excellent | Very Good | Very Good | 100% Free |
| 4 | **Peppermint** | Lightweight, modern tech stack | Very Easy | Very Low | Basic | Good | Growing | 100% Free |
| 5 | **osTicket** | Battle-tested, maximum stability | Easy | 1-2GB RAM | Good | Dated | Very Good | 100% Free |
| 6 | **UVdesk** | E-commerce businesses | Low-Medium | 1-2GB RAM | Good | Basic | Moderate | Open-core |
| 7 | **Faveo** | SMB with billing/CRM needs | Easy | 1-2GB RAM | Good | Good | Moderate | Open-core |
| 8 | **Frappe Helpdesk** | Frappe/ERPNext ecosystem users | Medium | Moderate | Good | Good | Niche | 100% Free |

---

## Recommendations by Use Case

### "I need live chat + email + social media support"
**Pick Chatwoot.** It is the clear leader for omnichannel with the best live chat widget, WhatsApp/social integrations, and AI features (Captain). Requires more server resources but delivers the most complete feature set.

### "I just need email ticketing, keep it simple"
**Pick FreeScout.** Lightest resource usage (runs on shared hosting), best UI among email-focused tools, and familiar HelpScout-like workflow. Budget for paid modules if you need live chat or WhatsApp later.

### "I need a full-featured enterprise-grade system"
**Pick Zammad.** Most comprehensive feature set with search, analytics, and multi-channel. Requires more resources (Elasticsearch) but is fully free with no feature restrictions.

### "I want the lightest possible setup for a tiny team"
**Pick Peppermint.** Runs on a Raspberry Pi, modern Next.js stack, dead-simple Docker setup. Perfect for homelabs or teams that just need basic ticketing.

### "I need proven stability above all else"
**Pick osTicket.** Oldest and most battle-tested. 5+ million users. The UI is dated but it just works. Massive community knowledge base.

### "I run an e-commerce business"
**Pick UVdesk.** Native Shopify and Magento integrations that auto-sync order data with tickets. Purpose-built for e-commerce support workflows.

---

## Notable Documentation and Communities

**Best Documentation**:
1. **Chatwoot** - Comprehensive docs site, active Discord, video tutorials
2. **Zammad** - Professional documentation with clear self-hosting guides
3. **FreeScout** - Good docs plus active blog with comparison articles

**Most Active Communities**:
1. **Chatwoot** - 316+ contributors, monthly releases, Discord community
2. **Zammad** - Backed by Zammad GmbH (German company), professional support forums
3. **osTicket** - Largest install base (5M+ users), extensive forums and tutorials

---

## Sources & Citations
- NocoBase blog: "6 Best Open-Source Ticketing Systems for 2026"
- FreeScout blog: "5 Best Open Source Helpdesk Systems 2025"
- Tidio blog: "9 Best Open Source Helpdesk Ticketing Software in 2026"
- RedmineUP: "Best 5 open source helpdesk and ticketing system in 2025"
- Nextiva: open-source helpdesk software comparison
- osTicket.com official site
- Faveo Helpdesk blog: "Top 7 Open-Source IT Ticketing Systems"
- Desk365: "9 Best Free Ticketing Systems for SMBs in 2026"
- HiverHQ: "Top 11 free help desk" comparison
- TheCXLead: "20 Best Free Ticketing Systems Reviewed in 2026"
- Chatwoot GitHub milestones and release notes
- Peppermint.sh documentation and GitHub repository
- Frappe Helpdesk official documentation

## Key Takeaways
- **Chatwoot** is the most feature-complete omnichannel solution with the strongest community momentum (21k+ stars, monthly releases, AI features)
- **FreeScout** is the best choice if you primarily need email ticketing with minimal resource usage
- **Zammad** is the best fully-free enterprise-grade option, but requires significant server resources
- **Peppermint** is a rising star for lightweight self-hosting with a modern tech stack
- **osTicket** remains the proven workhorse despite its dated UI
- **Trudesk** appears abandoned and should be avoided
- All top solutions support Docker deployment
- PHP-based solutions (FreeScout, osTicket, UVdesk, Faveo) have the lowest resource requirements
- Ruby/Node-based solutions (Chatwoot, Zammad, Peppermint) offer more modern architectures but need more resources

## Related Searches
- Chatwoot vs Intercom for small business self-hosted alternative
- FreeScout module pricing and total cost of ownership analysis
- Zammad v7.0 PostgreSQL-only migration impact
- Peppermint roadmap and upcoming features for 2026
- Self-hosted help desk security hardening best practices
