# Airbyte Self-Hosted Setup Guide — SlideHeroes

Step-by-step guide to set up Airbyte on EC2 and configure the first pipeline: **Supabase (Postgres CDC) → BigQuery**.

---

## Prerequisites

- ✅ Docker installed on EC2
- ✅ Supabase direct connection string (`SUPABASE_DB_DIRECT_URL` in `~/.clawdbot/.env`)
- ✅ GCP project with BigQuery dataset
- [ ] GCP service account JSON key with BigQuery write access

---

## Step 1: Install Airbyte on EC2

```bash
# Clone Airbyte
cd /home/ubuntu
git clone --depth 1 https://github.com/airbytehq/airbyte.git
cd airbyte

# Start Airbyte (first run pulls all images — takes 5-10 min)
./run-ab-platform.sh
```

Airbyte will be available at **http://localhost:8000**

Default credentials: `airbyte` / `password` (change after first login)

> **Note:** Airbyte uses ~4GB RAM. Our c7i-flex.large has 4GB — it'll be tight. If it's sluggish, we may need to bump to 8GB or run Airbyte on a separate small instance.

### Make Airbyte start on boot

```bash
# Create systemd service
sudo tee /etc/systemd/system/airbyte.service > /dev/null <<EOF
[Unit]
Description=Airbyte
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/airbyte
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=ubuntu
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable airbyte
```

---

## Step 2: Secure Airbyte Access

Airbyte's UI should NOT be exposed publicly. Options:

**Option A — SSH tunnel (simplest):**
```bash
# From your local machine
ssh -L 8000:localhost:8000 ubuntu@<ec2-ip>
# Then open http://localhost:8000 in your browser
```

**Option B — Caddy reverse proxy with auth:**
Add to Caddyfile alongside internal-tools:
```
airbyte.internal.slideheroes.com {
    reverse_proxy localhost:8000
    # Add Cloudflare Access or basic auth
}
```

---

## Step 3: Configure Supabase as a Source (Postgres CDC)

### 3a. In Supabase SQL Editor — prepare for CDC

```sql
-- 1. Create a publication for the tables you want to replicate
-- Start with the key tables (adjust names to match your schema)
CREATE PUBLICATION airbyte_publication FOR TABLE
  public.users,
  public.organizations,
  public.presentations,
  public.subscriptions;
-- You can add more tables later:
-- ALTER PUBLICATION airbyte_publication ADD TABLE public.new_table;

-- 2. Create a replication slot (Airbyte may do this automatically,
--    but creating it manually gives you more control)
SELECT pg_create_logical_replication_slot('airbyte_slot', 'pgoutput');

-- 3. Verify it worked
SELECT * FROM pg_replication_slots;
SELECT * FROM pg_publication_tables WHERE pubname = 'airbyte_publication';
```

### 3b. In Airbyte UI — add Postgres source

1. Go to **Sources → New Source → Postgres**
2. Fill in connection details from your `SUPABASE_DB_DIRECT_URL`:
   - **Host:** `db.xxxxx.supabase.co`
   - **Port:** `5432`
   - **Database:** `postgres`
   - **Username:** `postgres`
   - **Password:** (your Supabase DB password)
3. **Replication method:** Select **Logical Replication (CDC)**
4. **Publication:** `airbyte_publication`
5. **Replication slot:** `airbyte_slot`
6. Click **Set up source** → Airbyte will test the connection

### Troubleshooting

- **"replication slot not found"** — Airbyte can create its own slot; just select "Let Airbyte create" if offered
- **Connection refused** — Make sure you're using the **direct** connection string, not the pooler
- **Permission denied** — Must use the `postgres` user (not a custom role) for replication

---

## Step 4: Configure BigQuery as a Destination

### 4a. Create GCP Service Account

1. Go to [GCP Console → IAM → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Create service account: `airbyte-bigquery-writer`
3. Grant roles:
   - **BigQuery Data Editor**
   - **BigQuery Job User**
4. Create JSON key → download it
5. Copy to EC2:
   ```bash
   scp ~/Downloads/service-account-key.json ubuntu@<ec2-ip>:~/airbyte/secrets/
   ```

### 4b. In Airbyte UI — add BigQuery destination

1. Go to **Destinations → New Destination → BigQuery**
2. Fill in:
   - **Project ID:** your GCP project ID
   - **Dataset ID:** `slideheroes_raw` (or whatever your raw dataset is)
   - **Dataset location:** `us` (match your BigQuery region)
   - **Service Account Key:** paste the JSON key contents
   - **Loading method:** Standard (GCS staging is faster but needs a bucket)
3. Click **Set up destination** → Airbyte tests the connection

---

## Step 5: Create the Connection (Pipeline)

1. Go to **Connections → New Connection**
2. Select your Postgres source and BigQuery destination
3. Configure:
   - **Replication frequency:** Every 1 hour (adjust based on needs)
   - **Sync mode per stream:** Choose **Incremental | Append + Dedup** for CDC tables
   - **Cursor field:** Airbyte auto-detects from CDC
   - **Primary key:** Airbyte auto-detects from table PKs
   - **Destination namespace:** `Custom` → `supabase_` (prefix for BigQuery tables)
4. Select which tables to sync (the ones in your publication)
5. Click **Set up connection**

### Sync Modes Explained

| Mode | Use When |
|------|----------|
| **Incremental \| Append + Dedup** | Most tables — captures inserts/updates/deletes, deduplicates |
| **Incremental \| Append** | Event/log tables where you want the full history |
| **Full Refresh \| Overwrite** | Small reference tables that change rarely |

---

## Step 6: Verify the Pipeline

1. Click **Sync Now** on your connection
2. Watch the sync progress in the UI
3. Check BigQuery — you should see tables like:
   - `slideheroes_raw.supabase_users`
   - `slideheroes_raw.supabase_presentations`
   - etc.
4. Verify row counts match Supabase

---

## Step 7: Add Stripe Source (Next)

1. In Airbyte: **Sources → New Source → Stripe**
2. You'll need your **Stripe Secret Key** (from Stripe Dashboard → Developers → API Keys)
3. Airbyte's Stripe connector pulls: charges, customers, invoices, subscriptions, payment_intents, etc.
4. Create a new connection: Stripe → BigQuery
5. Namespace prefix: `stripe_`

---

## What's Next

After Airbyte is running with Supabase + Stripe:

1. **PostHog source** — Airbyte has a native connector. Add when PostHog is set up.
2. **Cloud Functions** — Build lightweight functions for API sources:
   - Attio → BigQuery (via Attio webhooks or polling API)
   - Apollo → BigQuery (export API)
   - Cal.com → BigQuery (webhooks)
   - Loops → BigQuery (webhooks)
   - RB2B → BigQuery (webhooks)
3. **dbt** — Transform raw data in BigQuery (ICP scoring, dedup, etc.)

---

## Resource Usage & Monitoring

Airbyte on our c7i-flex.large (2 vCPU, 4GB RAM):
- Idle: ~1.5-2GB RAM
- During sync: ~2.5-3.5GB RAM
- If RAM is tight, reduce `MAX_WORKERS` in Airbyte's `.env`

Monitor:
```bash
# Check Airbyte is running
docker compose -f /home/ubuntu/airbyte/docker-compose.yaml ps

# Check resource usage
docker stats --no-stream

# View logs
docker compose -f /home/ubuntu/airbyte/docker-compose.yaml logs -f --tail=50
```

---

## Architecture Summary

```
┌─────────────┐    CDC    ┌──────────┐   Load   ┌──────────────┐
│  Supabase   │─────────→│ Airbyte  │────────→│   BigQuery   │
│  (Postgres) │  logical  │  (EC2)   │         │  (raw layer) │
└─────────────┘  replic.  │          │         └──────┬───────┘
                          │          │                │
┌─────────────┐  API pull │          │                │  dbt
│   Stripe    │─────────→│          │────────→       ▼
└─────────────┘           └──────────┘         ┌──────────────┐
                                               │   BigQuery   │
┌─────────────┐  webhooks ┌──────────┐  Load   │ (transforms) │
│ Attio/Apollo│─────────→│  Cloud   │────────→└──────────────┘
│ Cal/Loops/  │   + API   │Functions │
│ RB2B        │           └──────────┘
└─────────────┘
```
