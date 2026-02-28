# Privacy Policy - RB2B Visitor Identification Disclosure

**Purpose:** Draft privacy policy language for RB2B visitor identification. This document provides the disclosure text that should be added to slideheroes.com's privacy policy before enabling RB2B tracking.

**Created:** 2026-02-27
**Task:** #586
**Status:** Ready for Mike review + implementation

---

## Section: Visitor Identification & Company Recognition

Add this section to the SlideHeroes Privacy Policy:

---

### How We Identify Visitors

**Company Recognition Technology**

We use a technology called RB2B to help us understand which organizations visit our website. When you browse slideheroes.com, we may be able to identify the company or organization associated with your visit using your IP address.

**What We Collect:**
- **Company Information:** Organization name, industry, company size, and publicly available business details
- **Visit Behavior:** Pages viewed, time on site, and navigation patterns (attributed to your organization, not you personally)
- **Referral Source:** How you found our website (search engine, link, etc.)

**How We Use This Information:**
- Understanding which types of organizations are interested in our services
- Improving our website content and user experience
- Personalizing outreach to companies that may benefit from SlideHeroes
- Analyzing trends in website traffic and engagement

**What We Do NOT Collect:**
- Individual personal names or email addresses (unless you provide them)
- Personal identification information from casual browsing
- Sensitive personal data

**Your Rights:**
If you prefer that we do not identify your organization's visits, you can:
- Opt out of tracking by [contacting us at privacy@slideheroes.com]
- Use a VPN or private browsing mode
- Clear your cookies

**Legal Basis:**
This processing is based on our legitimate business interests in understanding our website audience and improving our services. We do not sell or share this information with third parties for their marketing purposes.

---

## Additional Cookie Policy Language

Add to Cookie Policy:

| Cookie/Tracker | Purpose | Duration |
|----------------|---------|----------|
| RB2B Pixel | Company identification and visit analytics | 30 days |

---

## GDPR/PIPEDA Compliance Notes

### GDPR (EU Visitors)
- **Lawful basis:** Legitimate interest (Article 6(1)(f)) — understanding business audience
- **Data minimization:** Only company-level data, not individual PII
- **Right to object:** Users can opt out via email request
- **Data retention:** Visitor data retained for 12 months, then anonymized

### PIPEDA (Canadian Visitors)
- **Consent model:** Implied consent for business contact information
- **Purpose limitation:** Used only for business development and service improvement
- **Access rights:** Individuals can request information about their organization's data

---

## Implementation Checklist

- [ ] Add disclosure section to privacy policy page
- [ ] Update cookie policy table
- [ ] Add "Contact us to opt out" link with privacy@slideheroes.com
- [ ] Verify disclosure is visible before RB2B pixel loads
- [ ] Consider cookie consent banner integration (task #111)

---

## RB2B Dashboard Configuration

After privacy policy is updated:

1. Log into RB2B dashboard
2. Configure visitor identification settings
3. Set up Slack/email notifications for new identified companies
4. Enable BigQuery export integration
5. Configure daily/weekly digest preferences

---

## References

- RB2B Documentation: https://help.rb2b.com
- Task #453: Full RB2B implementation
- Task #111: Cloudflare Zaraz consent management
- GDPR Article 6(1)(f): Legitimate interests
- PIPEDA Principle 4.3: Consent
