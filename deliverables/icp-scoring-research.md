# ICP Scoring Research: Best Practices for B2B SaaS Companies

**Prepared for:** SlideHeroes (AI-powered presentation SaaS targeting consultants and consultancies, $39-49/user/mo)
**Research Date:** February 10, 2026
**Purpose:** Inform scoring criteria design for ideal customer profile identification and lead qualification

---

## Executive Summary

This research synthesizes best practices for ICP (Ideal Customer Profile) scoring models specifically for B2B SaaS companies. It draws from practitioners at Cargo, Madkudu, Clearbit, HubSpot, Gartner, SaaStr, OpenView Partners, and various SaaS experts.

**Key Findings for Early-Stage SaaS like SlideHeroes:**

1. **Start Simple**: Begin with 10-20 data points in a spreadsheet-based MVP scoring model before investing in complex ML systems
2. **Separate Fit vs. Intent**: Maintain distinct scores for ICP fit (firmographic/demographic) and behavioral intent—combine them only for final grading
3. **Use Time Decay**: Implement recency weighting to ensure scores reflect current buying interest
4. **Include Negative Signals**: Deduct points for disqualifiers like competitor usage, wrong geographies, or career page visits
5. **Iterate Rapidly**: Re-calibrate thresholds monthly based on actual conversion outcomes

---

## 1. Scoring Methodologies

### 1.1 Points-Based (Manual) Scoring

**Description:** Traditional approach where each attribute/action is assigned a point value. Total score determines qualification.

**Pros for Early-Stage SaaS:**
- Simple to implement in spreadsheets or basic CRM workflows
- Transparent and explainable to sales teams
- Easy to adjust as you learn
- No ML expertise required
- Works with limited historical data

**Cons for Early-Stage SaaS:**
- Prone to human bias in assigning point values
- Static rules don't adapt to market changes
- Can be "gamed" once reps understand the formula
- Doesn't capture complex patterns

**Sources:**
- Cargo: "The biggest lift in lead scoring is not defining how many points something is worth, it's making sure everyone internally is aligned" (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)
- Lift AI: "Classic lead scoring assigns points based on explicit criteria" (https://www.lift-ai.com/blog/top-6-lead-scoring-models-and-how-to-use-them)
- Growform: Detailed guide on assigning point values based on conversion rate analysis (https://www.growform.co/lead-scoring-saas/)

### 1.2 Tiered/Bucket Scoring

**Description:** Leads are categorized into tiers (A/B/C or Hot/Warm/Cold) rather than raw scores. Each tier triggers different SLAs.

**Pros for Early-Stage SaaS:**
- Simple communication framework
- Clear handoff rules between marketing and sales
- Easy to implement in most CRMs
- Reduces complexity for reps

**Cons for Early-Stage SaaS:**
- Less granular for prioritization
- Doesn't capture nuance within tiers
- May miss leads on tier boundaries

**Examples from Industry:**
- **Heap (early stage):** Used two firmographic fit points (employee count, industry), bucketed into Low/Medium/High priority (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)
- **B2B SaaS communications company:** A/B/C/F buckets in Salesforce, 1-5 points for firmographics (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)
- **Clearbit (medium-stage):** A/B/F groups based on firmographic fit data points (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)

### 1.3 Predictive ML Scoring

**Description:** Machine learning models analyze historical conversion data to identify patterns and predict which leads will convert.

**Pros for Early-Stage SaaS:**
- Removes human bias from point assignment
- Continuously learns from new data
- Can surface non-obvious patterns
- Scales automatically

**Cons for Early-Stage SaaS:**
- **Requires significant historical data** (major limitation for early-stage)
- Can be a "black box" with unclear reasoning
- Expensive to implement (tools like Madkudu, 6sense)
- Overkill for companies with <1000 leads

**Key Insight:** "The main limit for B2B SaaS is having enough data. The datasets are often too small to warrant anything reliable." - Cargo (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)

**When to Consider:**
- 500+ closed-won opportunities
- Consistent conversion data across segments
- Resources to invest in platform ($500+/month for Madkudu, etc.)

**Sources:**
- Madkudu: Platform uses ML to predict fit and likelihood to buy (https://www.madkudu.com/platform/learn)
- Coefficient: AI/ML models continuously learn from new data (https://coefficient.io/lead-scoring/saas-lead-scoring)
- Refiner: "Predictive lead scoring platforms collect all necessary information, match it with historic data to deliver accurate lead scores" (https://refiner.io/blog/lead-scoring-saas/)

### 1.4 Hybrid Scoring (Recommended for SlideHeroes)

**Description:** Combine manual scoring for firmographic fit with simple rules for behavioral intent. Use ML only if data supports it.

**Why for Early-Stage:**
- Leverages your domain knowledge about ICP
- Adapts quickly as you learn
- Maintain control while benefiting from automation
- Can evolve to full predictive over time

**Implementation Approach:**
1. Start with manual scoring for firmographic fit (ICP alignment)
2. Add simple behavioral rules (pricing page visit = higher score)
3. Consider lightweight ML for behavioral intent only if data supports
4. Grade A/B/C based on combined fit + intent

**Sources:**
- Madkudu + Clearbit: "Fit score + Likelihood to Buy (LTB) = Lead Grade A-E" (https://help.madkudu.com/docs/lead-grade-scoring)
- Cargo: "Most modern SaaS companies split scoring between fit score and behavioral/activity score" (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)
- Reform: "The most effective models use data from both explicit and implicit data" (https://www.reform.app/blog/lead-scoring-thresholds-data-driven-best-practices)

### 1.5 LLM-Powered Scoring (Emerging)

**Description:** Use GPT/Claude to analyze lead context and provide scores with reasoning.

**Pros for Early-Stage SaaS:**
- Can use unstructured data (LinkedIn posts, news articles)
- Provides explainable reasoning with scores
- No training data required
- Can adapt quickly to ICP changes

**Cons for Early-Stage SaaS:**
- API costs add up quickly
- Requires careful prompt engineering
- Consistency concerns across leads
- Still experimental

**Cargo's Approach:**
- ICP Fit (0-30)
- Timing Signals (0-30)
- Engagement Quality (0-25)
- Stakeholder Level (0-15)
- Total: 0-100 with component breakdown and reasoning

**Sources:**
- Cargo: Comprehensive guide on LLM-powered lead scoring (https://www.getcargo.ai/blog/llm-powered-lead-scoring-beyond-traditional-models)
- Coefficient: Emerging AI lead scoring approaches (https://coefficient.io/lead-scoring/saas-lead-scoring)

---

## 2. Data Inputs

### 2.1 Firmographic Signals

Company-level attributes that indicate ICP fit:

| Attribute | Relevance to SlideHeroes | Data Sources |
|-----------|------------------------|--------------|
| Industry (Consulting, Strategy, Advisory) | **Critical** - Core ICP | Clearbit, Crunchbase, Manual entry |
| Company Size (Employees) | **High** - Capacity/need for external help | Clearbit, LinkedIn Sales Navigator, Manual entry |
| Annual Revenue | **High** - Budget capacity for $39-49/mo | Clearbit, Crunchbase, ZoomInfo |
| Location (Geography) | **Medium** - Time zones, support capability | Clearbit, IP geolocation, Manual entry |
| Company Age | **Medium** - Maturity affects buying process | Crunchbase, LinkedIn |
| Growth Rate | **Medium** - Growing companies need more presentations | LinkedIn hiring data, News scraping |
| Customer Base Type (B2B vs B2C) | **Medium** - Affects presentation style | Manual research, Website analysis |
| Business Model (Service provider vs Product) | **High** - Consultants likely more likely | Manual research |

**Sources:**
- AriseGTM: "Firmographics are to businesses what demographics are to individuals" (https://arisegtm.com/blog/ideal-customer-profile-icp)
- Cargo: Firmographic context as foundation of scoring (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)
- CaptivateIQ: Account scoring based on firmographics (https://www.captivateiq.com/blog/account-scoring)

### 2.2 Technographic Signals

Technology stack data indicating compatibility and sophistication:

| Attribute | Relevance to SlideHeroes | Data Sources |
|-----------|------------------------|--------------|
| Current Presentation Tools (PowerPoint, Keynote, Google Slides) | **High** - Pain indicator | Clearbit tech tags, User surveys |
| CRM Usage (Salesforce, HubSpot) | **High** - Sales process maturity | Clearbit tech tags, Form capture |
| Collaboration Tools (Slack, Microsoft Teams) | **Medium** - Team structure | Clearbit tech tags, Enrichment APIs |
| Design Tools (Figma, Canva) | **Medium** - Visual sophistication | Clearbit tech tags |
| Competitor Presentation Tools | **Critical** - Replace opportunity | Clearbit tech tags, User surveys |
| Marketing Automation (Marketo, Pardot) | **High** - Marketing maturity | Clearbit tech tags |

**Best-in-Class Example:**
- **Clearbit customer:** Uses tech tags to identify competition and compatible integrations. Awards 1-5 points for technology used (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)

**Sources:**
- AriseGTM: "Technographics provide insight into a company's current technology landscape" (https://arisegtm.com/blog/ideal-customer-profile-icp)
- Cargo: Weight technographic data based on integration compatibility (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)

### 2.3 Behavioral Signals (Implicit Data)

User actions indicating buying intent and engagement:

| Attribute | Relevance to SlideHeroes | Typical Points |
|-----------|------------------------|----------------|
| Visited pricing page | **Very High** | +15-20 |
| Requested demo | **Very High** | +20-30 |
| Downloaded case study | **High** | +10-15 |
| Attended webinar | **High** | +10-15 |
| Free trial activation | **Very High** | +20-25 |
| Feature usage within trial | **Critical** | Variable based on depth |
| Pricing page views (frequency) | **High** | +10 per visit (capped) |
| Time on site | **Medium** | +5 for >2 min sessions |
| Email opens | **Low-Medium** | +3 per open (decayed) |
| Email link clicks | **Medium** | +8-10 per click |
| LinkedIn profile views | **Low-Medium** | +5 |

**Advanced Pattern Recognition:**
- **Proposify:** Tracks pricing page views, trial activations, and feature usage via Marketo + Segment (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)
- **Turtl:** Broke down time spent into 15-second increments (+1 point each) rather than flat scores for duration (https://www.reform.app/blog/lead-scoring-thresholds-data-driven-best-practices)

**Sources:**
- Reform: "Identifying key buyer signals—visit pricing pages, request demos, download case studies" (https://www.reform.app/blog/lead-scoring-thresholds-data-driven-best-practices)
- Ortto: Implicit/behavioral data scoring with time decay (https://ortto.com/learn/what-is-lead-scoring/)
- Refiner: Comprehensive list of SaaS behavioral signals (https://refiner.io/blog/lead-scoring-saas/)

### 2.4 Explicit (Demographic) Signals

Information leads provide directly:

| Attribute | Relevance to SlideHeroes |
|-----------|------------------------|
| Job Title (Partner, Principal, Senior Consultant) | **Critical** - Decision authority |
| Seniority Level (Director/VP/C-level) | **High** - Budget control |
| Team/Department (Consulting, Strategy, Client Services) | **High** - Relevance to product |
| Email Domain Type (Company vs Personal) | **Critical** - B2B vs B2C |
| Years of Experience | **Medium** - Sophistication level |

**Sources:**
- AriseGTM: Explicit data as foundation of scoring (https://arisegtm.com/blog/ideal-customer-profile-icp)
- UserMotion: ICP vs Buyer Persona distinction (https://usermotion.com/blog/how-to-identify-ideal-customer-profile-icp)

### 2.5 Intent Signals

Third-party data indicating active buying interest:

| Signal | Data Sources |
|---------|--------------|
| Branded keyword searches | Google Ads, 6sense, Bombora |
| Competitor research | 6sense, Demandbase |
| Job postings (sales team expansion) | LinkedIn, Indeed data |
| Funding announcements | Crunchbase, PitchBook |
| Executive movements | LinkedIn, News APIs |
| Content consumption (topic-specific) | 6sense, Bombora |

**Clearbit + Madkudu Approach:**
- Use Clearbit Reveal to detect target account visits
- Track week-over-week activity changes
- Alert sales when multiple people from same account visit (https://clearbit.com/resources/guides/MadKudu-prioritize-leads)

**Sources:**
- Lift AI: "In-market activity—accounts reading content or researching keywords" (https://www.lift-ai.com/blog/top-6-lead-scoring-models-and-how-to-use-them)
- Clearbit: Intent-based account targeting (https://clearbit.com/resources/guides/MadKudu-prioritize-leads)
- CaptivateIQ: Behavioral signals in account scoring (https://www.captivateiq.com/blog/account-scoring)

### 2.6 Negative Signals (Disqualifiers)

Attributes/actions that reduce score:

| Negative Signal | Point Deduction | Rationale |
|----------------|------------------|-----------|
| Visited careers page | -20 | Likely job seeker, not buyer |
| Using strong competitor | -15 | Contract lock-in risk |
| Company in excluded geography | -25 | Can't serve effectively |
| Unsubscribed from emails | -25 | Disengaged |
| No response after 3+ outreaches | -25 | Not interested |
| Personal email domain (gmail, etc.) | -30 | B2C, not B2B |
| Company too small (<5 employees) | -20 | Low capacity |
| Company too large (Enterprise with own design team) | -15 | Less likely to outsource |

**Sources:**
- Reform: "Negative scoring for disengagement" (https://www.reform.app/blog/lead-scoring-thresholds-data-driven-best-practices)
- Cargo: Manual scoring with negative factors (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)
- Lift AI: "Subtractive scoring—start from baseline and take away points" (https://www.lift-ai.com/blog/top-6-lead-scoring-models-and-how-to-use-them)

---

## 3. Scoring Architecture

### 3.1 Separate Scores vs. Composite Scores

**Industry Trend: Modern SaaS companies maintain separate scores**

Most sophisticated companies use separate scores that are combined for final grading:

1. **Fit Score (ICP Alignment)**: How well they match your ideal customer profile
2. **Intent Score (Likelihood to Buy)**: Behavioral signals indicating buying interest
3. **Lead Grade (A-E)**: Combined matrix of fit + intent

**Madkudu's Approach:**
```
Very High LTB + Very Good/Good Fit = Grade A
High LTB + Medium/Good Fit = Grade B
Medium LTB + Medium Fit = Grade C
Low LTB + Low/Medium Fit = Grade D
Low LTB + Low Fit = Grade E
```

**Why Separate:**
- Allows different actions: High fit/low intent = nurture; High intent/low fit = educate on fit
- More granular for routing decisions
- Easier to diagnose scoring issues
- Enables "stakeholder triangulation" scoring

**Sources:**
- Madkudu: Lead grade scoring matrix (https://help.madkudu.com/docs/lead-grade-scoring)
- Cargo: "Split between fit score and behavioral/activity score" (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)
- Ortto: Multiple scoring models for different purposes (https://ortto.com/learn/what-is-lead-scoring/)

### 3.2 Decay and Recency Weighting

**Critical Concept: Older signals should count less**

Most platforms implement time decay via "half-life" concept—the time after which a lead is half as valuable as when they last interacted.

**Typical Half-Lives by Sales Cycle:**
- Short cycle (<30 days): 3-7 days
- Medium cycle (30-90 days): 14-21 days
- Long cycle (90+ days): 30-45 days

**Implementation:**
- Ortto: Configurable half-life applied to behavioral attributes only (https://ortto.com/learn/what-is-lead-scoring/)
- Growform: "Time decay ensures recency and that you only consider recent and active behavior" (https://www.growform.co/lead-scoring-saas/)

**For SlideHeroes (likely 30-60 day cycle):**
- Suggested half-life: 14 days
- Behavioral actions decay, but firmographic fit does not
- Scores refreshed daily or weekly

**Advanced Decay:**
- **Cargo:** "Behavioral or activity score measures prospect's engagement with your company and decays over time" (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)

### 3.3 Stakeholder Triangulation (Account-Level Scoring)

**For multi-stakeholder deals, score at account level**

When multiple people from same account engage:

| Account Activity | Score Impact |
|-----------------|---------------|
| One stakeholder engaged | Base individual score |
| 2-3 stakeholders from same account engaged | +20-30% multiplier |
| C-level + Director + User involved | +40-50% multiplier |
| Stakeholders from different departments | +25-35% multiplier |

**Cargo's Recommendation:**
"Having multiple stakeholders in the loop maximizes conversion probability (stakeholder triangulation)"

**Implementation:**
- Track account-level score separate from individual scores
- When account score crosses threshold, trigger account-based outreach
- Consider Lead-to-Account (L2A) scoring platforms like LeanData

**Sources:**
- Cargo: Stakeholder triangulation strategy (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)
- CaptivateIQ: Account vs lead scoring distinction (https://www.captivateiq.com/blog/account-scoring)
- LeanData: Account scoring for multi-stakeholder deals

### 3.4 Multi-Score Architecture

**Advanced companies maintain multiple scores simultaneously:**

| Score Type | Purpose | When to Use |
|------------|-----------|--------------|
| Product Fit | ICP alignment | Always |
| Lead Intent | Buying readiness | Always |
| Lead Grade | Combined prioritization | For routing |
| Expansion Score | Upsell potential | For customer success |
| Churn Risk | At-risk customers | For retention |
| PQL Score | Product-qualified leads | For PLG motion |

**Ortto's Perspective:**
"Having multiple lead-scoring models can help you get a more granular understanding of how different campaigns, channels, and messages are performing." (https://ortto.com/learn/what-is-lead-scoring/)

**For SlideHeroes:**
Start with:
1. **Fit Score** (ICP alignment) - 40% weight
2. **Intent Score** (behavioral signals with decay) - 60% weight
3. **Combined Grade** (A-E) - Final routing decision

### 3.5 Score Calculation Methods

**Common Scales:**
- **0-100**: Most common, intuitive
- **0-1000**: More granular
- **-100 to +100**: Allows negative disqualifiers

**Calculation Approaches:**

1. **Simple Sum:** `Score = Σ (Attribute Value × Weight)`
2. **Weighted Average:** `Score = Σ (Attribute Score × Weight) / Σ Weights`
3. **Multiplier:** `Score = Fit Score × Intent Multiplier`
4. **Matrix:** Use fit + intent to look up grade in matrix table

**Recommendation for SlideHeroes:**
Start with simple sum (0-100), evolve to matrix as sophistication increases.

---

## 4. Threshold Design

### 4.1 Setting Qualification Thresholds

**Two Main Approaches:**

#### 1. Statistical/K-Means Clustering (Data-Driven)

**Process:**
1. Retroactively score historical leads (both converted and non-converted)
2. Plot scores in spreadsheet
3. Use k-means clustering to identify natural groupings
4. Set thresholds at cluster boundaries

**Tools:**
- Excel/Google Sheets with clustering add-ons
- Python (scikit-learn)
- ChatGPT: "Retroactively score these leads and identify thresholds"

**From Growform:**
"Go back to your historical data and retroactively score a representative sample of leads (both successful conversions and ones that didn't pan out). Then use k-means clustering to identify your thresholds…or just ask ChatGPT to do it." (https://www.growform.co/lead-scoring-saas/)

#### 2. Percentile-Based (Capacity-Constrained)

**Process:**
1. Determine sales capacity (how many leads can team handle per period)
2. Score all leads
3. Set threshold at percentile that matches capacity

**Example:**
- Sales team can handle 20 quality leads/week
- 100 leads enter system/week
- Set threshold at top 20% of scores

**For Early-Stage:**
Start simple: Top 10% = Hot, 20-50% = Warm, rest = Nurture

### 4.2 Calibration with Limited Historical Data

**Early-Stage Challenges:**
- Few closed-won deals for training
- Limited conversion data
- Rapid ICP evolution

**Recommended Approaches:**

#### 1. MVP Approach: Start with 10-20 Data Points

**From Cargo:**
"Start by identifying 10 to 20 data points you know work, and use them to build a reliable minimum viable product (MVP). Don't try to create a highly sophisticated scoring model right off the bat."

**Process:**
1. Interview sales: "What are our best customers like?"
2. Interview customers: "What made you buy?"
3. Pick top 10 attributes mentioned
4. Assign simple points (1-10 or 10-20 ranges)
5. Set threshold at what feels like "good lead"
6. Adjust weekly based on outcomes

#### 2. Use Industry Benchmarks as Starting Point

**Conservative Starting Thresholds (0-100 scale):**
- **Hot/A:** 70+ - Immediate sales engagement (within hours)
- **Warm/B:** 50-69 - SDR outreach sequence
- **Cool/C:** 30-49 - Marketing nurture
- **Cold:** 0-29 - Long-term nurture or disqualify

**Adjustment Factors:**
- **Short sales cycle:** Lower thresholds (more aggressive)
- **Long sales cycle:** Higher thresholds (more conservative)
- **High volume:** Higher thresholds (stricter)
- **Low volume:** Lower thresholds (broader)

#### 3. Pilot Phase Before Full Rollout

**From Reform:**
"When rolling out lead scoring thresholds, begin with a pilot phase using a limited set of leads. This approach minimizes risk while allowing you to evaluate your model's effectiveness." (https://www.reform.app/blog/lead-scoring-thresholds-data-driven-best-practices)

**Process:**
1. Define ICP attributes
2. Score leads but DON'T route automatically
3. Compare scored leads to sales' intuitive priorities
4. Adjust model to align
5. Then enable automatic routing

#### 4. Monthly Re-Calibration

**Process:**
1. After month 1: Compare scored leads vs. actual conversions
2. Adjust: Are high-scoring leads converting?
3. If not: Re-weight attributes
4. If yes: Validate and potentially raise thresholds

**From Coefficient:**
"Track which scored leads actually convert, adjust weights based on real outcomes, A/B test different scoring models, use historical data to validate your approach." (https://coefficient.io/lead-scoring/saas-lead-scoring)

### 4.3 Threshold Best Practices

1. **Align Sales and Marketing**
   - Ensure both teams agree on what constitutes a "hot lead"
   - From Reform: "Ensure both teams agree on what constitutes a hot lead to streamline the process"

2. **Define Next Steps for Each Threshold**
   - From JustCall: "A threshold can be seen as an indication that the prospect is ready to move up to the next state. These stages should be identified, a value range assigned, and the next steps clearly spelled out"

3. **Test in Isolation**
   - Don't change scoring AND thresholds simultaneously
   - One variable at a time to measure impact

4. **Track Score Distribution**
   - Monitor distribution: If everyone scores 80+, lower points
   - If everyone scores 20-, raise points
   - Goal: Normal distribution around midpoint

5. **Monitor Threshold "Pressure"**
   - If sales says "not enough leads": Lower threshold or generate more
   - If sales says "waste of time": Raise threshold

### 4.4 Threshold Examples by Company Size

| Company Stage | Monthly Leads | Recommended Hot Threshold |
|---------------|---------------|---------------------------|
| Early stage (<$1M ARR) | <100 | 60-70 (more inclusive) |
| Seed/Series A | 100-500 | 70-80 |
| Series B | 500-2000 | 75-85 |
| Series C+ | 2000+ | 80-90 (stricter) |

---

## 5. Tools & Implementation

### 5.1 CRM-Native Scoring

#### HubSpot Lead Scoring

**Capabilities:**
- Native lead scoring with positive and negative criteria
- Lifecycle stage transitions based on score thresholds
- Email notifications when leads cross thresholds
- Time decay options
- Multiple scoring models

**Pros:**
- No additional cost if already using HubSpot
- Deep integration with all HubSpot data
- Easy UI for non-technical users
- Works with HubSpot workflows

**Cons:**
- Limited predictive capabilities
- Basic behavioral tracking only
- Requires manual maintenance

**Sources:**
- HubSpot documentation on lead scoring
- Various practitioner blogs

#### Salesforce Lead Scoring

**Capabilities:**
- Process Builder/Flow for automated scoring
- Custom fields for scores
- Apex classes for complex logic
- Integration with Einstein AI (predictive)
- Workflow rules for routing

**Implementation Approaches:**
- **Simple:** Formula fields + Workflow rules
- **Medium:** Process Builder + Custom objects
- **Advanced:** Apex classes + External scoring APIs

**Examples:**
- **Heap:** Used Salesforce rules for routing based on employee count buckets (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)
- **Clearbit:** Built point-based system in Salesforce Process Builder (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)

### 5.2 Data Enrichment Tools

#### Clearbit

**Primary Use Cases:**
- **Enrichment API:** Fill in missing company/person data automatically
- **Reveal:** Identify anonymous website visitors by company
- **Tech Tags:** Identify technology stack
- **Form Optimization:** Shorten forms, auto-enrich

**Integration Patterns:**
1. **Real-time:** Enrich on form submission
2. **Batch:** Enrich existing database
3. **Continuous:** Re-enrich monthly for data freshness

**Clearbit Attributes for ICP Scoring:**
```javascript
// Example attributes
{
  company: {
    industry: "Professional Services",
    size: "11-50",
    employees: 25,
    annualRevenue: "1M-10M",
    techTags: ["salesforce", "powerpoint", "zoom"],
    location: "United States"
  },
  person: {
    title: "Principal Consultant",
    seniority: "Director",
    department: "Consulting"
  }
}
```

**Cost:**
- Enrichment API: ~$0.50-1.00 per record
- Reveal: $300-1000/month
- Full platform: $1,000+/month

**Sources:**
- Clearbit documentation
- Clearbit + Madkudu integration guide (https://clearbit.com/resources/guides/MadKudu-prioritize-leads)

#### Alternatives
- **ZoomInfo:** Similar enrichment, strong company data
- **Apollo.io:** Enrichment + outreach platform
- **LinkedIn Sales Navigator:** Manual enrichment, strong people data

### 5.3 Predictive Scoring Platforms

#### Madkudu

**Capabilities:**
- ML-based fit scoring (Low/Medium/Good/Very Good)
- Likelihood to Buy (LTB) behavioral scoring
- Lead Grade (A-E) combining fit + LTB
- Real-time scoring via API
- CRM integrations (Salesforce, HubSpot)

**Architecture:**
```
CRM Data + Clearbit Enrichment + Behavioral Data
    ↓
Madkudu ML Model
    ↓
Fit Score + LTB Score + Lead Grade
    ↓
Pushed back to CRM
    ↓
Routing via LeanData or native workflows
```

**Pricing:**
- Starts at ~$500/month
- Scales with lead volume
- Professional services additional

**When It Makes Sense:**
- 500+ leads/month
- 50+ closed-won deals for training
- Sales team >3 reps
- Budget for platform + maintenance

**Sources:**
- Madkudu platform documentation (https://www.madkudu.com/platform/learn)
- Madkudu lead grade docs (https://help.madkudu.com/docs/lead-grade-scoring)
- Clearbit + Madkudu guide (https://clearbit.com/resources/guides/MadKudu-prioritize-leads)

#### Alternatives
- **6sense:** Strong intent data + predictive
- **Infer:** Predictive lead scoring
- **Lift AI:** Real-time website visitor scoring

### 5.4 Warehouse-First Architecture (BigQuery + CRM)

**Modern Data Stack Approach:**

**Architecture Diagram:**
```
Sources (CRM, MAP, Product DB, Web Analytics, Clearbit)
    ↓
Data Warehouse (BigQuery/Snowflake)
    ↓
Transformation Layer (dbt)
    ↓
Scoring Model (SQL + ML)
    ↓
Reverse ETL (Hightouch/Census)
    ↓
CRM (Salesforce/HubSpot)
```

**Benefits:**
- Single source of truth
- Complex scoring logic in SQL/Python
- All data available for scoring
- Easy to iterate and test
- Historical analysis for improvement

**Tools:**
- **Warehouse:** BigQuery, Snowflake, Redshift
- **Transformation:** dbt
- **Reverse ETL:** Hightouch, Census, Grouparoo
- **Scheduling:** Airflow, dbt Cloud

**Clearbit's Architecture:**
- Uses Segment to collect behavioral data
- Stores in Redshift (data warehouse)
- dbt transforms into master table
- Census pushes to Salesforce and Customer.io
- Custom intent model in warehouse
- Madkudu for fit scoring

**Sources:**
- Clearbit architecture example (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)
- Cargo: Warehouse-based lead scoring (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)

### 5.5 Lightweight Implementation for Early Stage

**Recommended Stack for SlideHeroes (Early Stage):**

**Option 1: Spreadsheet + CRM Sync (Cheapest)**
1. **Scoring Logic:** Google Sheets with formulas
2. **Data Import:** Coefficient, Zapier, or CSV export
3. **Score Export:** Coefficient pushes back to CRM
4. **Cost:** ~$50-100/month

**Option 2: CRM-Native (Simpler)**
1. **HubSpot:** Native scoring + Clearbit enrichment
2. **Salesforce:** Formula fields + Process Builder
3. **Cost:** HubSpot Starter ($45/mo) + Clearbit (~$100-200/mo)

**Option 3: Lightweight Warehouse (Scalable)**
1. **BigQuery:** Free tier or $10-50/month
2. **dbt Cloud:** $100/month (or free tier)
3. **Hightouch:** $100/month
4. **Total:** ~$200-250/month

**Recommendation:**
Start with Option 1 or 2, migrate to Option 3 when lead volume >1,000/month or scoring complexity increases.

### 5.6 Integration Patterns

#### Clearbit + HubSpot

```javascript
// Example workflow
1. Lead fills form → HubSpot
2. HubSpot workflow triggers Clearbit Enrichment
3. Clearbit returns: industry, size, tech tags
4. HubSpot scoring rules:
   - Industry = Consulting → +15
   - Size = 11-50 → +10
   - Tech = PowerPoint → +8
   - Has job title → +5
5. Total score → Lead Grade field
6. Grade = A/B → Notify sales
```

#### Clearbit + Madkudu + Salesforce

```javascript
// Example workflow
1. Lead enters Salesforce
2. Webhook triggers Clearbit Enrichment
3. Enriched data triggers Madkudu API
4. Madkudu returns:
   - Fit Score: "Good" (85/100)
   - LTB: "High" (75/100)
   - Grade: "B"
5. Madkudu webhook updates Salesforce fields
6. LeanData routes based on Grade
```

### 5.7 Emerging Tools (2024-2026)

#### Cargo

**Capabilities:**
- Warehouse-native lead scoring
- LLM-powered scoring (GPT-4/Claude)
- Workflow automation
- Context assembly from multiple sources

**Why Interesting for SlideHeroes:**
- Can score based on presentation content being created
- LLM can understand consulting context
- Integrates with existing stack

**Sources:**
- Cargo lead scoring guide (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)
- Cargo LLM scoring (https://www.getcargo.ai/blog/llm-powered-lead-scoring-beyond-traditional-models)

---

## 6. Common Mistakes

### 6.1 Starting Too Complex

**The Mistake:**
Building an elaborate scoring model with dozens of attributes and ML before having data to support it.

**Consequences:**
- Model doesn't work—no historical patterns to learn from
- Complex model impossible to debug
- Sales team doesn't trust scores
- Wasted engineering time

**Right Approach:**
"Start by identifying 10 to 20 data points you know work, and use them to build a reliable minimum viable product (MVP)." - Cargo (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)

### 6.2 Targeting Too Broad

**The Mistake:**
ICP and scoring criteria too broad—trying to appeal to everyone.

**From AriseGTM:**
"One of the most significant mistakes is trying to appeal to an audience that needs to be narrower. This approach can lead to lower conversion rates and higher costs."

**Consequences:**
- Low conversion rates across all segments
- Sales overwhelmed with low-quality leads
- Marketing spend wasted on wrong audience
- Can't build momentum in any vertical

**Right Approach:**
"Focus on a specific niche or industry where your product or service is most likely in demand" - AriseGTM (https://arisegtm.com/blog/ideal-customer-profile-icp)

### 6.3 Ignoring Customer Feedback

**The Mistake:**
Building scoring model based solely on data/analytics without qualitative customer input.

**From AriseGTM:**
"Overlooking Customer Feedback: Existing customers are a valuable source of information when defining your ICP."

**Consequences:**
- Missing key attributes that matter to customers
- Scoring on proxy metrics instead of real drivers
- Model drifts from actual customer reality

**Right Approach:**
- Interview top 20 customers annually
- Ask: "What made you choose us? What were you looking for?"
- Incorporate qualitative insights into scoring

### 6.4 Scoring Without Decay

**The Mistake:**
Assigning points that never decrease, leading to inflated scores for old, inactive leads.

**Consequences:**
- Old leads still show high scores
- Sales wastes time on inactive prospects
- Can't distinguish current vs. past interest

**Right Approach:**
"Implement time decay model to ensure recency. Set half-life based on your sales cycle." - Ortto (https://ortto.com/learn/what-is-lead-scoring/)

### 6.5 Not Having Negative Scoring

**The Mistake:**
Only adding positive points, never subtracting for disqualifiers.

**From Reform:**
"Incorporating negative scoring for disengagement refines your model further by filtering out inactive leads."

**Consequences:**
- Leads that shouldn't qualify still score high
- Sales time wasted on disqualified prospects
- Can't filter out bad fits efficiently

**Right Approach:**
Include explicit disqualifiers:
- Wrong geography
- Competitor usage
- Job seekers (careers page visits)
- Personal email domains

### 6.6 Sales-Marketing Misalignment

**The Mistake:**
Marketing creates scoring without sales input, or sales ignores scores.

**From Reform:**
"Ensure both teams agree on what constitutes a hot lead to streamline the process."

**Consequences:**
- Sales rejects marketing-qualified leads
- Marketing frustrated that scores ignored
- No ROI on scoring investment
- Siloed organizations

**Right Approach:**
- Define ICP and scoring criteria jointly
- Agree on thresholds together
- Monthly review meetings
- Shared KPIs (e.g., "MQL to SQL rate")

### 6.7 Static Scoring Models

**The Mistake:**
Setting up scoring once and never updating it.

**Consequences:**
- Model drifts as market changes
- Outdated ICP criteria
- Scores lose predictive power
- Competitors outpace adaptation

**Right Approach:**
"Continuously evaluate your scoring model and adjust based on performance and feedback." - Reform (https://www.reform.app/blog/lead-scoring-thresholds-data-driven-best-practices)

### 6.8 Single Metric Obsession

**The Mistake:**
Focusing only on one score (e.g., total points) without understanding components.

**Consequences:**
- Can't diagnose why score is high/low
- Miss opportunities (high fit, low intent → educate)
- Can't refine individual components

**Right Approach:**
Track multiple dimensions:
- Fit score
- Intent score
- Combined grade
- Component breakdown

### 6.9 Not Validating Against Outcomes

**The Mistake:**
Never checking if high-scoring leads actually convert at higher rates.

**From Cargo:**
"Once you run your first scoring model, I strongly recommend asking the data team to do a report on the scoring attached to an account and see the related closing rate achieved to make sure there is evidence in correlating the score with a higher closing rate."

**Consequences:**
- No confidence model works
- Can't justify investment
- Don't know what to improve

**Right Approach:**
Monthly analysis:
- Score vs. conversion rate correlation
- Top-scoring leads: Did they close?
- Low-scoring leads that closed: What did we miss?

### 6.10 Over-Reliance on Predictive Too Early

**The Mistake:**
Implementing ML/predictive scoring with insufficient data.

**From Cargo:**
"The main limit for B2B SaaS is having enough data. The datasets are often too small to warrant anything reliable."

**Consequences:**
- ML model overfits on small dataset
- Poor predictions
- Black box no one understands
- Expensive for no gain

**Right Approach:**
Wait until:
- 500+ closed opportunities
- Consistent conversion patterns
- 50+ deals per month minimum

---

## 7. Case Studies

### 7.1 Heap (Early Stage → Mature)

**Evolution:**

**Early Stage:**
- Simple 2-factor model: Employee count + Industry
- Manual buckets: Low/Medium/High priority
- Salesforce rules-based routing by employee count tiers
  - SMB: <100 employees
  - Mid-market: 100-499 employees
  - Enterprise: 500+ employees

**Lessons:**
- Start simple with what you have
- Use routing tiers to segment sales effort
- Don't over-engineer early

**Source:** Clearbit (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)

### 7.2 Clearbit (3-Stage Evolution)

**Stage 1: Very Basic (Year 0-1)**
- No official scoring
- Sales spoke to wide variety of leads
- Manual filtering (Gmail addresses, spam)

**Stage 2: Medium (Year 3)**
- Point-based scoring in Salesforce Process Builder
- A/B/F groups (based on regression analysis of closed-won customers)
- Routing: High scores to AEs, low to SDRs
- Components:
  - Firmographics: Industry, business model, tech tags, revenue, employee range, country
  - Demographics: Sales/marketing team, leadership level
  - Survey: Use case question

**Stage 3: Advanced (Current)**
- LeanData for routing
- MadKudu ML for fit scoring (Low/Medium/Good/Very Good)
- Custom intent model for behavioral scoring
- Architecture:
  - Segment collects behavioral data
  - Stored in Redshift (data warehouse)
  - dbt transforms into master table
  - Census pushes to Salesforce and Customer.io
- Continuous calibration on when to send leads to sales

**Key Lessons:**
- Evolution takes years—don't rush to advanced
- Data warehouse foundation enables sophistication
- Fit and intent should be separate
- Never done—always calibrating

**Source:** Clearbit (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)

### 7.3 Proposify (Intermediate)

**Model:**
- Scores in Marketo (marketing automation)
- When threshold passed → Pushed to Salesforce for sales
- Hybrid model:
  - **Firmographics (via Clearbit):** Job title, industry, company size, annual revenue
  - **Behavioral:** Pricing page views, trial activations, feature usage
  - **Tracking:** Marketo + Segment

**Tech Stack:**
- Marketo (scoring)
- Salesforce (CRM)
- Clearbit (enrichment)
- Segment (analytics)

**Lesson:**
Combine explicit (firmographic) and implicit (behavioral) data for better predictions.

**Source:** Clearbit (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)

### 7.4 Work Management Platform (Advanced ML)

**Model:**
- Two separate ML models:
  1. **Intent Model:** Predicts likelihood to purchase based on in-product usage
  2. **Revenue Model:** Predicts high vs. low MRR

**Routing:**
- High-MRR → Sales (AE)
- Low-MRR → Self-serve track

**Data:**
- Firmographics via Clearbit Enrichment API
- Stored in Snowflake (data warehouse)
- Enrichment: Industry, company size

**Lesson:**
Different models for different outcomes (intent vs. revenue prediction).

**Source:** Clearbit (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)

### 7.5 LeanData (Account Scoring Platform)

**Model:**
- Account-level scoring (not just lead)
- Two dimensions:
  - **Fit Score:** Strong/Moderate/Weak based on historical data
  - **Intent Score:** e.g., "Decision" or "Purchase" stage based on website visits, branded searches

**Routing:**
- **Outbound:** Routed to SDR/AE based on score
- **Inbound:** Campaign-based routing
  - **P1 (High Intent):** Hand raises, AppExchange downloads, Drift chat → Response in 10 min
  - **P2 (Medium Intent):** Webinars, content downloads → Response in 48 hours

**Routing Logic:**
- P1/P2 → AE if in opportunity, CSM if customer, SDR otherwise

**Integration:**
- Clearbit for enrichment and additional contacts at account

**Lesson:**
Account-based scoring + intent signals + SLA-based routing = efficient handoffs.

**Source:** Clearbit (https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)

### 7.6 Turtl (Refinement Example)

**Problem:**
Leads were being passed to sales too early despite meeting thresholds—timing issues.

**Solution:**
- Changed from: Flat score for spending 60 seconds reading content
- Changed to: 15-second increments, +1 point each

**Result:**
- More accurate scoring
- Fewer premature handoffs
- Better timing alignment

**Lesson:**
Granularity matters—score depth of engagement, not just presence.

**Source:** Reform (https://www.reform.app/blog/lead-scoring-thresholds-data-driven-best-practices)

### 7.7 Revenue.io (Engagement-Based Routing)

**Approach:**
- Combined score determines **engagement strategy**, not just quality:
  - **1:M (one-to-many):** Low-value accounts, automated/low-touch
  - **1:F (one-to-few):** Average accounts, segmented outreach
  - **1:1:** High-value accounts, dedicated AE

**Lesson:**
Score should inform **how** to engage, not just whether to engage.

**Constraint:**
"Ensure you have enough capacity for each cohort. You don't want to overwhelm your reps with too many high-value accounts." - Cargo (referencing Revenue.io)

**Source:** Cargo (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)

### 7.8 Segment-Style Company (Real-Time Account Scoring)

**Model:**
- Clearbit Reveal identifies target accounts visiting site
- Tracks week-over-week activity changes
- Pushed to Salesforce as "surging account" alert

**Example:**
10 people from same account visit site in one week → Sales sees alert → Reaches out immediately

**Lesson:**
Account activity velocity (rate of change) is a strong signal.

**Source:** Clearbit + Madkudu (https://clearbit.com/resources/guides/MadKudu-prioritize-leads)

### 7.9 Cargo (LLM-Powered Scoring)

**Model:**
Uses GPT-4/Claude to score with reasoning:

```
Score Components (0-100):
1. ICP Fit (0-30)
2. Timing Signals (0-30)
3. Engagement Quality (0-25)
4. Stakeholder Level (0-15)
```

**Output:**
- Overall score
- Component breakdown with reasoning
- Recommended action
- Key talking points for sales

**Advantages:**
- Understands context, not just counts
- Processes unstructured data (news, LinkedIn posts)
- Explainable scores
- No training data needed

**Source:** Cargo (https://www.getcargo.ai/blog/llm-powered-lead-scoring-beyond-traditional-models)

---

## 8. Recommended Approach for SlideHeroes

### 8.1 Initial MVP Scoring Model (Months 1-3)

**Goal:** Simple, explainable, easy to iterate

**Attributes (10-15 total):**

**Fit Score (0-40):**
| Attribute | Points | Rationale |
|-----------|---------|-----------|
| Industry = Consulting/Strategy | +10 | Core ICP |
| Company size = 10-100 employees | +8 | Right size for outsourced help |
| Company size = 100-500 employees | +10 | Ideal size |
| Job title includes "Partner/Principal/Consultant" | +8 | Decision-maker |
| Tech includes PowerPoint/Keynote | +5 | Pain indicator |
| Tech includes Salesforce/HubSpot | +3 | Sales process maturity |
| Tech includes competitor (Beautiful.ai, etc.) | +8 | Replacement opportunity |
| Location = US/UK/Canada | +5 | Support coverage |
| Location = Excluded region | -10 | Can't support |
| Personal email domain | -15 | Not B2B |

**Intent Score (0-60):**
| Attribute | Points | Decay |
|-----------|---------|-------|
| Free trial signup | +15 | No decay |
| Created first presentation | +20 | No decay |
| Viewed pricing page | +10 | 7-day half-life |
| Requested demo | +15 | 7-day half-life |
| Downloaded case study | +8 | 14-day half-life |
| Attended webinar | +8 | 14-day half-life |
| Email opened | +3 | 7-day half-life |
| Email link clicked | +7 | 7-day half-life |
| Visited careers page | -20 | Immediate |
| Competitor page visit (researching) | +12 | 7-day half-life |
| Created >3 presentations in trial | +10 | No decay |

**Thresholds:**
- **Grade A:** 70+ - Immediate AE outreach (within 2 hours)
- **Grade B:** 55-69 - SDR outreach (within 24 hours)
- **Grade C:** 40-54 - Marketing nurture
- **Grade D:** <40 - Long-term nurture or disqualify

**Implementation:**
1. **Month 1:** Implement in HubSpot or Salesforce natively
2. **Month 2:** Add Clearbit enrichment for firmographics
3. **Month 3:** Analyze correlations, adjust points

### 8.2 Evolution Roadmap

**Months 4-6: Add Data Enrichment**
- Clearbit Enrichment for company data
- Auto-fill technographics
- Expand to 20-25 attributes

**Months 7-12: Refine and Optimize**
- Statistical analysis of score vs. conversion
- Add time decay explicitly
- Implement negative scoring more thoroughly
- A/B test different threshold levels

**Year 1+: Consider Advanced**
If criteria met:
- 500+ closed-won deals
- 1,000+ leads/month
- Sales team >3 reps

Then consider:
- Madkudu for predictive scoring
- Data warehouse architecture (BigQuery)
- Account-level scoring

### 8.3 Key Metrics to Track

**Weekly:**
- Score distribution (how many A/B/C/D)
- Conversion rate by score tier
- Sales feedback on score quality

**Monthly:**
- MQL to SQL conversion by score tier
- Sales cycle length by score tier
- Win rate by score tier
- Score drift (are scores rising/falling overall?)

**Quarterly:**
- ICP refinement interview
- Scoring model audit
- Competitor review
- Tech stack evolution

### 8.4 Critical Success Factors

1. **Start Simple:** Don't overengineer
2. **Iterate Fast:** Adjust weekly at first, then monthly
3. **Get Sales Buy-In:** Define ICP and thresholds together
4. **Measure Outcomes:** Validate scores against actual conversions
5. **Add Decay:** Don't let old signals persist
6. **Include Negatives:** Disqualify bad fits
7. **Separate Fit/Intent:** For different actions
8. **Be Patient:** Scoring takes 6+ months to mature

---

## 9. Quick Reference: Scoring by Attribute Type

### 9.1 Point Value Guidelines

| Impact | Point Range | Examples |
|---------|--------------|----------|
| Critical Disqualifier | -30 to -20 | Personal email, excluded geo |
| Strong Disqualifier | -15 to -10 | Competitor primary tool, wrong size |
| Critical Qualifier | +20 to +30 | Trial signup, pricing page visit |
| Strong Qualifier | +15 to +19 | Job title match, perfect industry |
| Medium Qualifier | +8 to +14 | Tech match, good size range |
| Weak Qualifier | +3 to +7 | Email open, secondary industry |
| Very Weak Qualifier | +1 to +2 | Generic page visit |

### 9.2 Common Weights by Score Type

| Score Type | Typical Weight | Rationale |
|-----------|----------------|-----------|
| Firmographic Fit | 30-40% | Static, high signal |
| Technographic | 15-25% | Compatibility, sophistication |
| Behavioral Intent | 25-35% | Dynamic, high signal |
| Demographic/Role | 10-20% | Decision authority |

### 9.3 Decay Half-Life by Activity Type

| Activity | Suggested Half-Life | Rationale |
|----------|---------------------|-----------|
| Trial activation/signup | None (or 90+ days) | Indicates fit |
| Created content/presentation | None (or 60+ days) | Product engagement |
| Pricing page visit | 7 days | High intent, short window |
| Demo request | 7 days | High intent, short window |
| Content download | 14 days | Research phase |
| Webinar attendance | 21 days | Interest, longer window |
| Email open/click | 7 days | Engagement, decays fast |

---

## 10. Resources and Further Reading

### Industry Sources

1. **Madkudu:** Predictive lead scoring platform (https://www.madkudu.com)
2. **Clearbit:** Data enrichment and ICP resources (https://clearbit.com)
3. **Cargo:** Warehouse-first scoring platform (https://www.getcargo.ai)
4. **Gartner:** ICP development framework (https://www.gartner.com/en/articles/the-framework-for-ideal-customer-profile-development)
5. **HubSpot:** Lead scoring documentation and best practices
6. **SaaStr:** B2B SaaS growth resources

### Practitioner Blogs

1. **UserMotion:** "Step-by-Step Guide: How to Identify Ideal Customer Profile (ICP)" (https://usermotion.com/blog/how-to-identify-ideal-customer-profile-icp)
2. **Nick Doyle:** "Figuring Out Your Ideal Customer Profile (ICP) in B2B" (https://nickdoyle.com/figuring-out-your-ideal-customer-profile-icp-in-b2b/)
3. **AriseGTM:** "Ideal Customer Profile (ICP) for B2B SaaS and Fintech" (https://arisegtm.com/blog/ideal-customer-profile-icp)
4. **Growform:** "How to Create a Lead Scoring Strategy for SaaS" (https://www.growform.co/lead-scoring-saas/)
5. **Reform:** "Lead Scoring Thresholds: Data-Driven Best Practices" (https://www.reform.app/blog/lead-scoring-thresholds-data-driven-best-practices)
6. **Ortto:** "Guide to Lead Scoring in SaaS & B2B" (https://ortto.com/learn/what-is-lead-scoring/)
7. **Refiner:** "The Ultimate Guide for SaaS Inbound Sales Teams" (https://refiner.io/blog/lead-scoring-saas/)
8. **Coefficient:** "SaaS Lead Scoring in AI Era" (https://coefficient.io/lead-scoring/saas-lead-scoring)
9. **CaptivateIQ:** "The Definitive Guide to Account Scoring" (https://www.captivateiq.com/blog/account-scoring)
10. **Lift AI:** "Top 6 Lead Scoring Models" (https://www.lift-ai.com/blog/top-6-lead-scoring-models-and-how-to-use-them)
11. **JustCall:** "Comprehensive Guide to SaaS Lead Scoring" (https://justcall.io/blog/saas-lead-scoring-guide.html)

### Tools Documentation

1. **Clearbit + Madkudu Integration:** "How to generate and prioritize leads" (https://clearbit.com/resources/guides/MadKudu-prioritize-leads)
2. **Madkudu Lead Grade Scoring:** (https://help.madkudu.com/docs/lead-grade-scoring)
3. **Cargo LLM Scoring:** "LLM-Powered Lead Scoring: Beyond Traditional Models" (https://www.getcargo.ai/blog/llm-powered-lead-scoring-beyond-traditional-models)
4. **Cargo B2B Scoring:** "The Right Approach to B2B Lead Scoring" (https://www.getcargo.ai/blog/the-right-approach-to-lead-scoring-in-b2b)

### Research Methodology Note

This research was compiled from publicly available sources across vendor documentation, practitioner blogs, and industry publications. Sources have been cited throughout. Recommendations are synthesized from best practices across multiple companies at different stages of maturity.

---

## Appendix: Sample Scoring Template for SlideHeroes

### A1. Lead Score Calculation Sheet (Example)

| Lead | Industry | Size | Title | Tech Stack | Pricing Page | Trial | Total Score | Grade |
|------|----------|-------|-------|-------------|---------------|-------|-------------|-------|
| Lead A | Consulting | 50 | Partner | PowerPoint, Salesforce | Yes (2x) | Yes | 85 | A |
| Lead B | Tech | 200 | Manager | Google Slides | Yes | No | 55 | B |
| Lead C | Retail | 25 | Analyst | PowerPoint | No | Yes | 42 | C |

### A2. Grade-Based Routing Rules

| Grade | Action | SLA | Owner |
|-------|--------|------|--------|
| A | Immediate outreach | Within 2 hours | AE |
| B | SDR sequence | Within 24 hours | SDR |
| C | Nurture campaign | Automated | Marketing |
| D | Long-term nurture | Quarterly review | Marketing |

### A3. Monthly Score Review Template

| Metric | This Month | Last Month | Change | Notes |
|--------|------------|-------------|--------|-------|
| % Grade A leads | 15% | 12% | +3% | Good, more high-quality |
| A-to-SQL conversion | 35% | 30% | +5% | Threshold calibrated well |
| B-to-SQL conversion | 20% | 18% | +2% | Slightly improved |
| Average score | 58 | 55 | +3 | Drift up, monitor |
| Sales feedback | Positive | Neutral | — | Happy with quality |

---

**End of Research Document**

*Prepared for SlideHeroes ICP scoring model development. Last updated: February 10, 2026*
