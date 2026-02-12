#!/bin/bash

# Script to import Todoist tasks into Mission Control

API_BASE="http://localhost:3001/api/v1"
EXISTING_TASKS=$(curl -s $API_BASE/tasks | jq -r '.[].name' | tr '[:upper:]' '[:lower:]' | sort)

# Function to check if task exists
task_exists() {
    local task_name="$1"
    local normalized=$(echo "$task_name" | tr '[:upper:]' '[:lower:]')
    if echo "$EXISTING_TASKS" | grep -qF "$normalized"; then
        return 0
    fi
    return 1
}

# Function to create and assign task
create_task() {
    local name="$1"
    local initiative_id="$2"

    if task_exists "$name"; then
        echo "  ⏭️  SKIP: '$name' already exists"
        return 1
    fi

    # Create task
    response=$(curl -s -X POST "$API_BASE/tasks" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$name\", \"board_id\": 1, \"priority\": \"medium\", \"initiativeId\": $initiative_id}")

    task_id=$(echo "$response" | jq -r '.id')

    if [ "$task_id" != "null" ] && [ -n "$task_id" ]; then
        # Assign task
        curl -s -X PATCH "$API_BASE/tasks/$task_id/assign" >/dev/null
        echo "  ✅ CREATED: '$name' (ID: $task_id, Init: $initiative_id)"
        return 0
    else
        echo "  ❌ FAILED: '$name' - $(echo "$response" | jq -r '.error // .message // .')"
        return 1
    fi
}

# Initialize counters by objective
declare -A counts

echo "=== Starting Todoist Task Import ==="
echo ""

# Obj 1 — Product
echo "🚀 Objective 1: Build a Product Customers Love"
echo ""
echo "Init 15 - Ship Core Product:"
counts[15]=0
create_task "Dashboard Completion (S1890)" 15 && ((counts[15]++)) || :
create_task "Outline UI Polish" 15 && ((counts[15]++)) || :
create_task "Storyboard Build" 15 && ((counts[15]++)) || :
create_task "Generate Rebuild (AI content generation)" 15 && ((counts[15]++)) || :
create_task "Presentation Export (PPTX/PDF)" 15 && ((counts[15]++)) || :
create_task "Ragie Integration (Upload → Extract → Populate)" 15 && ((counts[15]++)) || :
create_task "Workflow Bug Fixes" 15 && ((counts[15]++)) || :
create_task "Homepage Implementation" 15 && ((counts[15]++)) || :
create_task "Beta Testing & Polish" 15 && ((counts[15]++)) || :
create_task "Build storyboard feature" 15 && ((counts[15]++)) || :
create_task "Create app homepage dashboard" 15 && ((counts[15]++)) || :
create_task "Debug PPT generation feature" 15 && ((counts[15]++)) || :
create_task "Rebuild Dashboard with GPT" 15 && ((counts[15]++)) || :
create_task "Document creation solution (documint)" 15 && ((counts[15]++)) || :
create_task "Create a Templates section" 15 && ((counts[15]++)) || :
create_task "Update swipe file formatting" 15 && ((counts[15]++)) || :
create_task "Build out complete data architecture" 15 && ((counts[15]++)) || :

echo ""
echo "Init 16 - Harden Platform:"
counts[16]=0
create_task "Implement products, user groups, permissions" 16 && ((counts[16]++)) || :
create_task "Optimize onboarding sequence" 16 && ((counts[16]++)) || :
create_task "Finish debugging Staging CICD workflow" 16 && ((counts[16]++)) || :
create_task "Fix email redirect links in supabase" 16 && ((counts[16]++)) || :
create_task "Test payments" 16 && ((counts[16]++)) || :
create_task "Setup Cloudflare Zaraz for consent management" 16 && ((counts[16]++)) || :
create_task "Setup makerkit email templates" 16 && ((counts[16]++)) || :
create_task "Implement PostHog in frontend + backend" 16 && ((counts[16]++)) || :
create_task "Create PostHog reports" 16 && ((counts[16]++)) || :
create_task "Setup Posthog MCP server" 16 && ((counts[16]++)) || :
create_task "Test supabase-seed command" 16 && ((counts[16]++)) || :
create_task "Setup Productlane/Linear for issue tracking" 16 && ((counts[16]++)) || :
create_task "Continue to debug CI/CD" 16 && ((counts[16]++)) || :
create_task "Fix Kopia backup" 16 && ((counts[16]++)) || :
create_task "Create a Course feature flag" 16 && ((counts[16]++)) || :
create_task "Run the Orchestrator" 16 && ((counts[16]++)) || :
create_task "Configure PromoteKit" 16 && ((counts[16]++)) || :

echo ""
echo "Init 17 - Knowledge Engine:"
counts[17]=0
create_task "Implement RAG system" 17 && ((counts[17]++)) || :
create_task "New course content: more Presentation Surgeries" 17 && ((counts[17]++)) || :
create_task "Embed 'Bookshelf' from VitalSource" 17 && ((counts[17]++)) || :
create_task "Curated list of vendors" 17 && ((counts[17]++)) || :
create_task "MECE" 17 && ((counts[17]++)) || :
create_task "Patterns of Organization" 17 && ((counts[17]++)) || :
create_task "BOARD framework" 17 && ((counts[17]++)) || :
create_task "Inductive vs deductive" 17 && ((counts[17]++)) || :
create_task "Deep dive profiles of different WHOs" 17 && ((counts[17]++)) || :
create_task "Add more interactive content" 17 && ((counts[17]++)) || :
create_task "Content on Challenger Sales Model" 17 && ((counts[17]++)) || :

echo ""
echo "Init 18 - Launch & Beta:"
counts[18]=0
create_task "Beta Launch for feedback (Mar 10 milestone)" 18 && ((counts[18]++)) || :
create_task "Identify people for feedback" 18 && ((counts[18]++)) || :
create_task "Create feedback form" 18 && ((counts[18]++)) || :
create_task "Invite beta testers" 18 && ((counts[18]++)) || :
create_task "Request feedback" 18 && ((counts[18]++)) || :
create_task "Select people for beta" 18 && ((counts[18]++)) || :
create_task "App & Website testing (Mar 3 milestone)" 18 && ((counts[18]++)) || :
create_task "Soft Launch to existing customers (Mar 17 milestone)" 18 && ((counts[18]++)) || :
create_task "Prepare a Product Hunt launch" 18 && ((counts[18]++)) || :

echo ""
echo "Init 19 - Competitive Intelligence & Pricing:"
counts[19]=0
create_task "Magic slides research" 19 && ((counts[19]++)) || :
create_task "Decktopus research" 19 && ((counts[19]++)) || :
create_task "PlusAI research" 19 && ((counts[19]++)) || :
create_task "Beautiful.ai research" 19 && ((counts[19]++)) || :
create_task "Time.app research" 19 && ((counts[19]++)) || :
create_task "Business Decisions — Pricing & product config" 19 && ((counts[19]++)) || :
create_task "Homepage Design Exploration" 19 && ((counts[19]++)) || :
create_task "Pricing Page UI" 19 && ((counts[19]++)) || :
create_task "Stripe Products Configuration" 19 && ((counts[19]++)) || :
create_task "Decide on Trial strategy" 19 && ((counts[19]++)) || :
create_task "Build a quote configuration page" 19 && ((counts[19]++)) || :

echo ""
echo "Init 20 - Enterprise Data Security:"
counts[20]=0
create_task "E2EE Strategy" 20 && ((counts[20]++)) || :

# Obj 2 — Audience
echo ""
echo "📢 Objective 2: Build an Audience That Trusts Us"
echo ""
echo "Init 21 - Content Marketing:"
counts[21]=0
create_task "Create 'Local Presentation Training' content system" 21 && ((counts[21]++)) || :
create_task "Review YouTube video / firecrawl / jina.ai / apify.com tools" 21 && ((counts[21]++)) || :
create_task "Need a PowerPoint tools collection" 21 && ((counts[21]++)) || :
create_task "Updated PowerPoint tools" 21 && ((counts[21]++)) || :
create_task "Create a Content Context system" 21 && ((counts[21]++)) || :

echo ""
echo "Init 22 - SEO:"
counts[22]=0
create_task "Optimize SEO" 22 && ((counts[22]++)) || :
create_task "Research Next.js SEO techniques" 22 && ((counts[22]++)) || :
create_task "Technical SEO review with Screaming Frog" 22 && ((counts[22]++)) || :
create_task "Use surferseo.com" 22 && ((counts[22]++)) || :
create_task "Use Surfer SEO for content review" 22 && ((counts[22]++)) || :
create_task "Consider AirOps for Content Optimization" 22 && ((counts[22]++)) || :

echo ""
echo "Init 23 - Social Media & Community:"
counts[23]=0
create_task "Add a Community" 23 && ((counts[23]++)) || :
create_task "Explore social media management tools for LinkedIn and Reddit" 23 && ((counts[23]++)) || :
create_task "Add more testimonials" 23 && ((counts[23]++)) || :

echo ""
echo "Init 24 - Thought Leadership & Brand:"
counts[24]=0
create_task "Re-evaluate SlideHeroes brand" 24 && ((counts[24]++)) || :
create_task "Review SlideHeroes Manifesto draft" 24 && ((counts[24]++)) || :

# Obj 3 — Convert Existing
echo ""
echo "🔄 Objective 3: Convert Existing Customers"
echo ""
echo "Init 25 - Re-engagement & Email:"
counts[25]=0
create_task "Update Autoresponder series" 25 && ((counts[25]++)) || :
create_task "Update autoresponder to include product-focused emails" 25 && ((counts[25]++)) || :
create_task "Create a conclusion to series (offer)" 25 && ((counts[25]++)) || :
create_task "Remove underperforming emails" 25 && ((counts[25]++)) || :
create_task "Rewrite Welcome email" 25 && ((counts[25]++)) || :
create_task "Update email template to align with site" 25 && ((counts[25]++)) || :
create_task "Create new product onboarding campaign" 25 && ((counts[25]++)) || :

echo ""
echo "Init 26 - Platform Migration:"
counts[26]=0
create_task "Import website prospects from Thinkific and old prospects from Drip" 26 && ((counts[26]++)) || :

echo ""
echo "Init 27 - Customer Onboarding:"
counts[27]=0
create_task "Build a Product Tour / Use Onborda" 27 && ((counts[27]++)) || :
create_task "Figure out custom class names for sidebar onboarding elements" 27 && ((counts[27]++)) || :

echo ""
echo "Init 28 - Customer Segmentation:"
counts[28]=0
create_task "Segment existing subscribers & customers" 28 && ((counts[28]++)) || :

# Obj 4 — Acquire New
echo ""
echo "🆕 Objective 4: Acquire Net-New Customers"
echo ""
echo "Init 29 - Outbound Sales Engine:"
counts[29]=0
create_task "Outbound email launch campaign" 29 && ((counts[29]++)) || :
create_task "Select cold outbound email tech stack" 29 && ((counts[29]++)) || :
create_task "Try Apollo.io for outbound sales" 29 && ((counts[29]++)) || :
create_task "Outbound email strategy" 29 && ((counts[29]++)) || :
create_task "Explore tools for outbound personalization" 29 && ((counts[29]++)) || :
create_task "Cold email: More give, less ask (audit tool idea)" 29 && ((counts[29]++)) || :
create_task "Build lists of YouTube influencers" 29 && ((counts[29]++)) || :
create_task "YouTube 'productivity tool' influencers / Shu Omi, Ali Abdal" 29 && ((counts[29]++)) || :

echo ""
echo "Init 30 - Partnerships & Affiliates:"
counts[30]=0
create_task "Lesson Swaps with Entrepreneurship course providers" 30 && ((counts[30]++)) || :
create_task "Build an AIESEC version" 30 && ((counts[30]++)) || :
create_task "Reach out to Data Story Academy" 30 && ((counts[30]++)) || :
create_task "Become affiliate for Beautiful.ai" 30 && ((counts[30]++)) || :
create_task "Be affiliate for SlideGenius" 30 && ((counts[30]++)) || :
create_task "Embed training into other tools" 30 && ((counts[30]++)) || :
create_task "Develop Affiliate outreach strategy" 30 && ((counts[30]++)) || :
create_task "Explore Lesson 'Swaps'" 30 && ((counts[30]++)) || :
create_task "Consider Affiliate program - PromoteKit" 30 && ((counts[30]++)) || :

echo ""
echo "Init 31 - Sales Infrastructure:"
counts[31]=0
create_task "Create a social selling campaign" 31 && ((counts[31]++)) || :
create_task "Setup Attio CRM" 31 && ((counts[31]++)) || :
create_task "Import gmail contacts" 31 && ((counts[31]++)) || :
create_task "Import existing customers" 31 && ((counts[31]++)) || :
create_task "Setup CRM (folk CRM)" 31 && ((counts[31]++)) || :
create_task "Build a quote configuration page" 31 && ((counts[31]++)) || :
create_task "Evaluate email platform pricing (Brevo, ActiveCampaign, SendGrid)" 31 && ((counts[31]++)) || :
create_task "Define ICP (ideal customer profile)" 31 && ((counts[31]++)) || :

echo ""
echo "Init 35 - Inbound Nurture Campaigns:"
counts[35]=0
create_task "Add qualification quiz for Corporate funnel" 35 && ((counts[35]++)) || :
create_task "Create new lead magnet for Corporates" 35 && ((counts[35]++)) || :
create_task "Explore Video Ask for funnel" 35 && ((counts[35]++)) || :
create_task "Gather good cold outbound email examples" 35 && ((counts[35]++)) || :

# Obj 5 — Delight & Retain
echo ""
echo "💎 Objective 5: Delight & Retain Customers"
echo ""
echo "Init 32 - Onboarding & Activation:"
counts[32]=0
# Covered under Obj 3-C

echo ""
echo "Init 33 - Engagement & Retention Features:"
counts[33]=0
create_task "Integrate digital credentials system (Canvas Badges + alternatives)" 33 && ((counts[33]++)) || :
create_task "Assess Verifyed.io / Badgecraft / Open Badge Factory / POK" 33 && ((counts[33]++)) || :
create_task "Add Gamification" 33 && ((counts[33]++)) || :
create_task "Co-working space for Corporates" 33 && ((counts[33]++)) || :
create_task "Perks - discounts on other services" 33 && ((counts[33]++)) || :
create_task "Custom embedded calendars for Corporate Bootcamps" 33 && ((counts[33]++)) || :
create_task "Incorporate high-concept customer retention ideas" 33 && ((counts[33]++)) || :

echo ""
echo "Init 34 - Customer Feedback & Success:"
counts[34]=0
# No existing Todoist tasks

# Obj 6 — AI Systems
echo ""
echo "🤖 Objective 6: Build the AI Systems"
echo ""
echo "Init 1 - Knowledge & Context:"
counts[1]=0
create_task "Get Sophie to clean up Notion" 1 && ((counts[1]++)) || :
create_task "Figure out YouTube transcript solution" 1 && ((counts[1]++)) || :

echo ""
echo "Init 2 - Orchestration & Quality:"
counts[2]=0
create_task "Continue to improve the Daily Briefing" 2 && ((counts[2]++)) || :
create_task "Social media highlights" 2 && ((counts[2]++)) || :
create_task "Add Perplexity/Context7 for OpenAI" 2 && ((counts[2]++)) || :
create_task "Orchestrator Refactor" 2 && ((counts[2]++)) || :
create_task "Setup Bitwarden skill" 2 && ((counts[2]++)) || :
create_task "Create menu cron job" 2 && ((counts[2]++)) || :

echo ""
echo "Init 3 - Coding Engine:"
counts[3]=0
create_task "Setup GPT in Claude Code Router" 3 && ((counts[3]++)) || :

echo ""
echo "Init 4 - Content Engine:"
counts[4]=0
# Already listed under Init 2

# Obj 7 — Business OS
echo ""
echo "⚙️ Objective 7: Build the Business Operating System"
echo ""
echo "Init 12 - Financial & Legal:"
counts[12]=0
create_task "Sort out automated HST tax filing" 12 && ((counts[12]++)) || :
create_task "Sort out Xero integration for receipts" 12 && ((counts[12]++)) || :
create_task "Set up Hubdoc with Xero" 12 && ((counts[12]++)) || :
create_task "Investigate Huuman for bookkeeping" 12 && ((counts[12]++)) || :
create_task "Update Xero" 12 && ((counts[12]++)) || :

# Summary
echo ""
echo "=== Import Summary ==="
echo "Objective 1 (Product):"
echo "  Init 15 (Ship Core Product): ${counts[15]:-0} created"
echo "  Init 16 (Harden Platform): ${counts[16]:-0} created"
echo "  Init 17 (Knowledge Engine): ${counts[17]:-0} created"
echo "  Init 18 (Launch & Beta): ${counts[18]:-0} created"
echo "  Init 19 (Competitive Intel & Pricing): ${counts[19]:-0} created"
echo "  Init 20 (Enterprise Data Security): ${counts[20]:-0} created"
echo "Objective 2 (Audience):"
echo "  Init 21 (Content Marketing): ${counts[21]:-0} created"
echo "  Init 22 (SEO): ${counts[22]:-0} created"
echo "  Init 23 (Social Media & Community): ${counts[23]:-0} created"
echo "  Init 24 (Thought Leadership & Brand): ${counts[24]:-0} created"
echo "Objective 3 (Convert Existing):"
echo "  Init 25 (Re-engagement & Email): ${counts[25]:-0} created"
echo "  Init 26 (Platform Migration): ${counts[26]:-0} created"
echo "  Init 27 (Customer Onboarding): ${counts[27]:-0} created"
echo "  Init 28 (Customer Segmentation): ${counts[28]:-0} created"
echo "Objective 4 (Acquire New):"
echo "  Init 29 (Outbound Sales Engine): ${counts[29]:-0} created"
echo "  Init 30 (Partnerships & Affiliates): ${counts[30]:-0} created"
echo "  Init 31 (Sales Infrastructure): ${counts[31]:-0} created"
echo "  Init 35 (Inbound Nurture): ${counts[35]:-0} created"
echo "Objective 5 (Delight & Retain):"
echo "  Init 32 (Onboarding & Activation): ${counts[32]:-0} created"
echo "  Init 33 (Engagement & Retention): ${counts[33]:-0} created"
echo "  Init 34 (Customer Feedback): ${counts[34]:-0} created"
echo "Objective 6 (AI Systems):"
echo "  Init 1 (Knowledge & Context): ${counts[1]:-0} created"
echo "  Init 2 (Orchestration & Quality): ${counts[2]:-0} created"
echo "  Init 3 (Coding Engine): ${counts[3]:-0} created"
echo "  Init 4 (Content Engine): ${counts[4]:-0} created"
echo "Objective 7 (Business OS):"
echo "  Init 12 (Financial & Legal): ${counts[12]:-0} created"
echo ""
echo "=== Complete ==="
