# Testimonial Gathering Campaign

**Purpose:** Process to gather authentic customer testimonials for the SlideHeroes website.

**Created:** 2026-02-27
**Task:** #168
**Status:** Ready for execution

---

## 1. Current State

### Existing Testimonials (8)
All are manual entries with generic content — **these need to be replaced with real customer testimonials.**

| Name | Company | Status |
|------|---------|--------|
| Sarah Chen | Tech Innovator | Placeholder |
| Marcus Rodriguez | Product Manager | Placeholder |
| Emily Watson | Marketing Director | Placeholder |
| David Park | Startup Founder | Placeholder |
| Lisa Thompson | Sales Executive | Placeholder |
| Michael Brown | Business Consultant | Placeholder |
| Rachel Kim | Creative Director | Placeholder |
| James Wilson | Education Specialist | Placeholder |

---

## 2. Target Testimonial Sources

### A. Course Alumni (Seneca)
- **Source:** Thinkific enrollments
- **Target:** 5-10 testimonials
- **Ask:** "What did you learn that transformed your presentations?"

### B. Corporate Training Clients
- **Source:** Training contracts, B2B customers
- **Target:** 3-5 testimonials
- **Ask:** "How did the training impact your team's presentation effectiveness?"

### C. Product Beta Users (Future)
- **Source:** Early SaaS adopters
- **Target:** 5-10 testimonials
- **Ask:** "How does the AI-powered presentation creation save you time?"

---

## 3. Testimonial Request Process

### Email Template #1: Course Alumni

**Subject:** Quick favor? Your feedback would help others

```
Hi [First Name],

I hope you're doing well! I noticed you completed the SlideHeroes 
course [X months ago] — thank you for being part of our community.

I'm reaching out because we're looking to showcase real results 
from our students. Would you be willing to share a brief testimonial 
about your experience?

**What would help:**
- 2-3 sentences about what changed in your presentations
- Your name and company (or just industry if you prefer)
- Optional: A headshot for the website

No pressure at all — but if you have a moment, reply to this email 
with your thoughts. I'd be happy to draft something based on your 
feedback if that's easier.

Thanks for considering!
[Signature]
```

### Email Template #2: Corporate Clients

**Subject:** Your SlideHeroes experience — would you recommend us?

```
Hi [First Name],

I wanted to follow up on the presentation training we did with 
[Company Name]. Your team's participation was valuable, and I'd 
love to hear how things are going.

Would you be open to providing a brief testimonial about the 
training's impact? This helps other teams understand what to expect.

**What would be helpful:**
- What challenge were you trying to solve?
- What changed after the training?
- Would you recommend SlideHeroes to other organizations?

Happy to schedule a quick 10-minute call if you'd prefer to share 
verbally — I can write up the testimonial for your approval.

Thanks for considering!
[Signature]
```

### Email Template #3: Follow-up (No Response)

**Subject:** Re: Quick favor? Your feedback would help others

```
Hi [First Name],

Just following up on my previous email. No worries if you're busy — 
I know these requests can fall through the cracks.

If you do have 2 minutes to share a quick thought about your 
SlideHeroes experience, I'd really appreciate it. Even a single 
sentence helps!

Reply whenever works for you.
[Signature]
```

---

## 4. Testimonial Collection Methods

### Method A: Email Request (Primary)
- Send via Loops with personalization
- Track opens/clicks to identify engaged recipients
- Follow up once after 7 days

### Method B: Post-Purchase Survey
- Add testimonial request to post-purchase flow
- Include in course completion email
- Add to corporate training wrap-up

### Method C: Video Testimonials (Premium)
- Offer to record 30-second video testimonials
- Use Loom or Zoom recording
- Higher impact for landing pages

### Method D: LinkedIn Recommendations
- Request LinkedIn recommendations
- Screenshot and feature on website
- Cross-posts add credibility

---

## 5. Testimonial Criteria

### Must Have
- Real person's name (first name minimum)
- Specific outcome or benefit mentioned
- Authentic voice (not marketing-speak)

### Nice to Have
- Company name and title
- Headshot photo
- Video testimonial
- Quantifiable result ("saved 5 hours per presentation")

### Avoid
- Generic praise without specifics
- Anonymous testimonials
- Overly promotional language
- Testimonials from employees/partners (disclose if used)

---

## 6. Testimonial Usage

### Website Placement
| Location | Type | Count |
|----------|------|-------|
| Homepage hero | Video or premium text | 1-2 |
| Social proof section | Text + photo | 6-8 |
| Pricing page | ROI-focused | 3-4 |
| Course landing page | Learning-focused | 4-6 |
| About page | Story-focused | 2-3 |

### Legal/Compliance
- Get explicit permission to use on website
- Include in email: "By providing this testimonial, you consent to..."
- Allow opt-out at any time
- Keep records of permissions

---

## 7. Incentives (Optional)

### What to Offer
- Extended trial of new SaaS product
- Free consultation call
- Discount on future purchases
- Early access to new features

### What NOT to Offer
- Cash payments (feels inauthentic)
- Significant discounts (looks like purchase)
- Free products (changes motivation)

---

## 8. Execution Timeline

### Week 1: Preparation
- [ ] Identify top 20 customers by engagement
- [ ] Identify top 10 corporate clients
- [ ] Set up testimonial request sequence in Loops

### Week 2: First Wave
- [ ] Send testimonial requests to course alumni
- [ ] Send requests to corporate clients
- [ ] Monitor responses

### Week 3: Follow-up
- [ ] Send follow-up to non-responders
- [ ] Process received testimonials
- [ ] Request edits/approvals

### Week 4: Implementation
- [ ] Add approved testimonials to website
- [ ] Update testimonials in database
- [ ] Remove placeholder testimonials

---

## 9. Testimonial Storage

### Database Fields
```sql
-- Update testimonials table
UPDATE staging.testimonials
SET 
  customer_name = '[Real Name]',
  customer_company_name = '[Real Company]',
  content = '[Real Testimonial]',
  source = 'customer_request',
  status = 'approved'
WHERE id = '[id]';
```

### Media Assets
- Headshots: `/public/images/testimonials/[name].webp`
- Videos: Upload to YouTube/Vimeo, embed URL
- Consent forms: Store in `/docs/testimonials/consent/`

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Request sent | 30 |
| Response rate | 30%+ |
| Approved testimonials | 10+ |
| Video testimonials | 3+ |
| Homepage conversion lift | 10%+ |

---

## 11. Sample Testimonials to Inspire

### Good Examples

> "Before SlideHeroes, I spent 4+ hours on every deck. Now I create 
> better presentations in under an hour. The AI suggestions for 
> structure alone are worth it." — Sarah M., Product Manager at Stripe

> "Our consulting team's presentations went from 'good enough' to 
> 'clients specifically mention how impressed they are.' The training 
> paid for itself within the first month." — David L., Partner at 
> McKinsey & Company

> "I used to dread creating slides. Now it's actually enjoyable. 
> The templates and AI help me focus on the story, not the formatting." 
> — Jennifer K., Startup Founder

### Avoid These Patterns

❌ "SlideHeroes is the best presentation tool ever!" (Generic)
❌ "I love this product so much!" (No specifics)
❌ "Amazing!!!" (Too short)

---

## 12. Next Steps

1. **Mike to identify** top customers from Thinkific/Stripe data
2. **Create** testimonial request sequence in Loops
3. **Send** first wave of requests
4. **Process** responses and add to website
5. **Remove** placeholder testimonials
