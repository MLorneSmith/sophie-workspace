# RB2B Integration Spec

**Purpose:** Technical specification for RB2B visitor identification integration with BigQuery.

**Created:** 2026-02-27
**Task:** #453
**Status:** Ready for implementation

---

## 1. RB2B Webhook Payload

### Example Payload
```json
{
  "LinkedIn URL": "https://www.linkedin.com/in/example/",
  "First Name": "John",
  "Last Name": "Doe",
  "Title": "VP of Sales",
  "Company Name": "Acme Corp",
  "Business Email": "john.doe@acme.com",
  "Website": "https://acme.com",
  "Industry": "Management Consulting",
  "Employee Count": "50-100",
  "Estimate Revenue": "$5M-$10M",
  "City": "New York",
  "State": "New York",
  "Zipcode": "10001",
  "Seen At": "2026-02-27T12:34:56:00.00+00.00",
  "Referrer": "https://google.com",
  "Captured URL": "https://slideheroes.com/pricing",
  "Tags": "Hot Pages, ICP"
}
```

### Field Mapping to BigQuery

| RB2B Field | BigQuery Column | Type | Notes |
|------------|-----------------|------|-------|
| LinkedIn URL | linkedin_url | STRING | |
| First Name | first_name | STRING | |
| Last Name | last_name | STRING | |
| Title | title | STRING | |
| Company Name | company_name | STRING | |
| Business Email | business_email | STRING | Lowercased |
| Website | company_website | STRING | Normalized domain |
| Industry | industry | STRING | |
| Employee Count | employee_count | STRING | e.g., "50-100" |
| Estimate Revenue | estimated_revenue | STRING | e.g., "$5M-$10M" |
| City | city | STRING | |
| State | state | STRING | |
| Zipcode | zipcode | STRING | |
| Seen At | seen_at | TIMESTAMP | Parsed from string |
| Referrer | referrer | STRING | |
| Captured URL | captured_url | STRING | |
| Tags | tags | STRING | Comma-separated |

---

## 2. BigQuery Schema

### staging.rb2b_visitors
```sql
CREATE OR REPLACE TABLE staging.rb2b_visitors (
    id STRING NOT NULL,  -- UUID generated on insert
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    
    -- Person data
    linkedin_url STRING,
    first_name STRING,
    last_name STRING,
    title STRING,
    business_email STRING,
    
    -- Company data
    company_name STRING,
    company_website STRING,
    company_domain STRING,  -- Extracted from website
    industry STRING,
    employee_count STRING,
    estimated_revenue STRING,
    
    -- Location
    city STRING,
    state STRING,
    zipcode STRING,
    
    -- Visit data
    seen_at TIMESTAMP,
    referrer STRING,
    captured_url STRING,
    tags ARRAY<STRING>,
    
    -- Deduplication
    visit_hash STRING  -- SHA256 of email + seen_at
)
CLUSTER BY company_domain, seen_at;
```

### core.identified_visitors
```sql
CREATE OR REPLACE VIEW core.identified_visitors AS
WITH latest_visits AS (
    SELECT 
        business_email,
        company_domain,
        ARRAY_AGG(DISTINCT captured_url) as visited_pages,
        MAX(seen_at) as last_visit,
        MIN(seen_at) as first_visit,
        COUNT(*) as visit_count
    FROM staging.rb2b_visitors
    WHERE business_email IS NOT NULL
    GROUP BY business_email, company_domain
)
SELECT 
    v.id,
    v.business_email,
    v.first_name,
    v.last_name,
    v.title,
    v.linkedin_url,
    v.company_name,
    v.company_domain,
    v.company_website,
    v.industry,
    v.employee_count,
    v.estimated_revenue,
    v.city,
    v.state,
    v.zipcode,
    lv.visited_pages,
    lv.visit_count,
    lv.first_visit,
    lv.last_visit,
    v.tags,
    v.referrer
FROM staging.rb2b_visitors v
JOIN latest_visits lv USING (business_email, company_domain)
WHERE v.seen_at = lv.last_visit  -- Only latest visit per person
```

---

## 3. Webhook Endpoint Implementation

### File: `app/src/app/api/webhooks/rb2b/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { BigQuery } from "@google-cloud/bigquery";

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || "slideheroes-data-platform",
});

const DATASET = "staging";
const TABLE = "rb2b_visitors";

interface RB2BPayload {
  "LinkedIn URL"?: string;
  "First Name"?: string;
  "Last Name"?: string;
  "Title"?: string;
  "Company Name"?: string;
  "Business Email"?: string;
  "Website"?: string;
  "Industry"?: string;
  "Employee Count"?: string;
  "Estimate Revenue"?: string;
  "City"?: string;
  "State"?: string;
  "Zipcode"?: string;
  "Seen At"?: string;
  "Referrer"?: string;
  "Captured URL"?: string;
  "Tags"?: string;
}

function normalizeDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function parseTimestamp(ts: string | undefined): Date | null {
  if (!ts) return null;
  // RB2B format: "2024-01-01T12:34:56:00.00+00.00"
  try {
    // Replace the weird timestamp format with ISO
    const normalized = ts.replace(/:(\d{2})\.(\d{2})\+/, ".$1+");
    return new Date(normalized);
  } catch {
    return null;
  }
}

function generateVisitHash(email: string, seenAt: string): string {
  return createHash("sha256").update(`${email}:${seenAt}`).digest("hex");
}

export async function POST(request: Request) {
  try {
    const payload: RB2BPayload = await request.json();

    // Validate required fields
    if (!payload["Business Email"] && !payload["Company Name"]) {
      return NextResponse.json(
        { error: "Missing required fields: Business Email or Company Name" },
        { status: 400 }
      );
    }

    const businessEmail = payload["Business Email"]?.toLowerCase() || null;
    const seenAt = payload["Seen At"] || new Date().toISOString();
    const companyDomain = normalizeDomain(payload["Website"]);

    const row = {
      id: uuidv4(),
      received_at: new Date().toISOString(),
      linkedin_url: payload["LinkedIn URL"] || null,
      first_name: payload["First Name"] || null,
      last_name: payload["Last Name"] || null,
      title: payload["Title"] || null,
      business_email: businessEmail,
      company_name: payload["Company Name"] || null,
      company_website: payload["Website"] || null,
      company_domain: companyDomain,
      industry: payload["Industry"] || null,
      employee_count: payload["Employee Count"] || null,
      estimated_revenue: payload["Estimate Revenue"] || null,
      city: payload["City"] || null,
      state: payload["State"] || null,
      zipcode: payload["Zipcode"] || null,
      seen_at: parseTimestamp(seenAt)?.toISOString() || null,
      referrer: payload["Referrer"] || null,
      captured_url: payload["Captured URL"] || null,
      tags: payload["Tags"]?.split(",").map((t) => t.trim()) || [],
      visit_hash: generateVisitHash(businessEmail || "unknown", seenAt),
    };

    // Insert into BigQuery
    await bigquery.dataset(DATASET).table(TABLE).insert([row]);

    console.log(`[RB2B] Inserted visitor: ${businessEmail} from ${companyDomain}`);

    return NextResponse.json({ success: true, id: row.id });
  } catch (error) {
    console.error("[RB2B] Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: "ok", service: "rb2b-webhook" });
}
```

---

## 4. Environment Variables Required

Add to `~/.clawdbot/.env` or internal-tools `.env.local`:

```bash
GOOGLE_CLOUD_PROJECT=slideheroes-data-platform
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

## 5. RB2B Dashboard Configuration

After implementation:

1. **Navigate to:** https://app.rb2b.com/integrations/webhook
2. **Enter webhook URL:** `https://internal.slideheroes.com/api/webhooks/rb2b`
3. **Enable settings:**
   - ✅ Send repeat visitor data
   - ✅ Sync company-only profiles
4. **Click "Test"** to verify integration
5. **Save** the configuration

---

## 6. dbt Model

### models/staging/stg_rb2b_visitors.sql
```sql
with source as (
    select * from {{ source('staging', 'rb2b_visitors') }}
),

cleaned as (
    select
        id,
        received_at,
        
        -- Person
        lower(business_email) as email,
        first_name,
        last_name,
        title,
        linkedin_url,
        
        -- Company
        company_name,
        company_domain,
        company_website,
        industry,
        employee_count,
        estimated_revenue,
        
        -- Location
        city,
        state,
        zipcode,
        
        -- Visit
        seen_at,
        referrer,
        captured_url,
        tags,
        visit_count,
        
        -- Derived
        case
            when employee_count like '1-10%' then 5
            when employee_count like '10-50%' then 25
            when employee_count like '50-100%' then 75
            when employee_count like '100-500%' then 250
            when employee_count like '500-%' then 750
            else null
        end as estimated_employees
        
    from source
    where business_email is not null  -- Only identified visitors
)

select * from cleaned
```

---

## 7. Testing

### Local Test
```bash
curl -X POST http://localhost:3001/api/webhooks/rb2b \
  -H "Content-Type: application/json" \
  -d '{
    "First Name": "Test",
    "Last Name": "User",
    "Business Email": "test@example.com",
    "Company Name": "Test Corp",
    "Website": "https://example.com",
    "Industry": "Technology",
    "Seen At": "2026-02-27T12:00:00:00.00+00.00",
    "Captured URL": "https://slideheroes.com/pricing"
  }'
```

### Expected Response
```json
{
  "success": true,
  "id": "uuid-here"
}
```

### Verify in BigQuery
```sql
SELECT * FROM staging.rb2b_visitors 
WHERE business_email = 'test@example.com'
ORDER BY received_at DESC LIMIT 1
```

---

## 8. Privacy Considerations

- Webhook receives visitor data in real-time
- Business email is lowercased for deduplication
- No sensitive personal data beyond business contact info
- Privacy policy disclosure must be live before enabling RB2B pixel
- See task #586 for privacy policy requirements

---

## 9. Integration with ICP Scoring

Once RB2B data is flowing:

1. Add `stg_rb2b_visitors` to `dim_customers` join
2. Add `company_domain` to `dim_companies` for company matching
3. Add behavioral score boost for identified visitors (engaged enough to be identified)
4. Update `mvl_qualified_leads` to include RB2B-sourced companies

---

## 10. Implementation Checklist

- [ ] Create BigQuery table `staging.rb2b_visitors`
- [ ] Implement webhook endpoint `/api/webhooks/rb2b`
- [ ] Add dbt model `stg_rb2b_visitors.sql`
- [ ] Test with RB2B test payload
- [ ] Configure RB2B webhook in dashboard
- [ ] Monitor first 24h of data flow
- [ ] Add to ICP scoring model
