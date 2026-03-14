# HST Tax Filing Automation Evaluation

**Task:** Evaluate whether automated HST tax filing would save money or be better than the current accountant setup  
**Decision Required:** Automate vs keep accountant vs hybrid approach  
**Compiled:** February 2026

---

## Executive Summary

**Recommendation: Hybrid Approach**

Keep the accountant for year-end tax planning and corporate filings, but automate GST/HST returns using Xero's built-in reporting + CRA NetFile/My Business Account. This saves $400-1,000+ annually while maintaining professional oversight for complex matters.

---

## Option Analysis

### Option A: Full Accountant (Current Approach)

**Costs:**
- GST/HST return preparation: $100-400 per return
- Quarterly filing (4x/year): $400-1,600+/year
- Monthly filing (12x/year): $1,200-4,800+/year

**Pros:**
- Professional catches errors and missed ITCs
- Handles CRA correspondence
- Strategic tax planning advice

**Cons:**
- Higher cost for routine compliance
- Delays in filing (depends on accountant availability)
- Still need to provide organized records

---

### Option B: Full Automation (DIY with Xero)

**What Xero Does:**
- Automatically calculates GST/HST on transactions
- Tracks Input Tax Credits (ITCs) from expenses
- Generates GST/HST Return Reports (mapped to CRA line numbers)
- Hubdoc captures receipts automatically
- Bank connections sync transactions daily

**CRA Filing Methods:**
1. **NetFile GST/HST** — File directly through CRA My Business Account (free)
2. **GST/HST Internet File Transfer (GIFT)** — CRA-certified software uploads return
3. **EDI** — Electronic Data Interchange for high-volume filers

**Costs:**
- Xero Standard Plan: $55 CAD/month = $660/year + HST (~$86) = **$746/year**
- CRA NetFile: Free
- Time: 30-60 minutes per filing (quarterly = 2-4 hours/year)

**Pros:**
- Significant cost savings ($400-1,200+/year vs accountant for filings alone)
- Real-time visibility into HST liability
- Faster filing (same day vs waiting for accountant)
- Bank syncing reduces data entry errors

**Cons:**
- Requires basic understanding of HST rules
- No professional review before filing
- Must handle CRA queries yourself
- Risk of missing ITCs on unusual transactions

---

### Option C: Hybrid Approach (Recommended)

**Structure:**
1. **Use Xero for day-to-day HST tracking** — All transactions coded with tax rates, ITCs captured automatically
2. **File GST/HST returns yourself via CRA NetFile** — Xero generates the report, you submit through My Business Account
3. **Keep accountant for:** 
   - Annual tax planning
   - Corporate income tax return (T2)
   - Complex questions (capital assets, real property, exports)
   - CRA audits or reassessments

**Cost Breakdown:**
| Item | Annual Cost |
|------|-------------|
| Xero Standard | $746 (already paying this) |
| CRA NetFile | $0 |
| Filing time (4 hrs × $50/hr opportunity cost) | $200 |
| Accountant (year-end only) | $500-1,500 |
| **Total** | **$1,446-2,446** |

**Savings vs Full Accountant:**
- If accountant charges $200/return quarterly: $800/year saved
- If accountant charges $300/return quarterly: $1,200/year saved

---

## SlideHeroes Context

Given SlideHeroes' current situation:
- **SaaS business** — Relatively simple HST (services taxable at 13% Ontario HST)
- **Digital products** — Clear GST/HST treatment
- **Low transaction volume** — Manageable to review manually
- **No physical goods or real property** — Avoids complex ITC rules
- **Already using Xero** — HST data is already being tracked

**Assessment:** SlideHeroes is an ideal candidate for DIY HST filing. The business model is straightforward with no complex edge cases.

---

## Implementation Steps

### Immediate (Week 1)
1. **Verify Xero HST Setup**
   - Confirm correct tax rates on all revenue categories (13% HST on most services)
   - Review expense categories for correct ITC coding
   - Ensure bank feeds are properly reconciled

2. **Set Up CRA My Business Account** (if not already done)
   - Register at canada.ca/my-business-account
   - Link GST/HST account

3. **Review Current Filing Frequency**
   - Annual: <$1.5M revenue
   - Quarterly: $1.5M-$6M revenue
   - Monthly: >$6M revenue

### First Filing Cycle
1. Generate GST/HST Return Report in Xero
2. Cross-check totals against Xero reports
3. File through CRA NetFile
4. Save confirmation number

### Optional: Accountant Review
For the first 1-2 filings, have accountant review before submitting to build confidence.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Missing ITCs | Review Hubdoc receipts monthly; run "uncategorized expenses" report |
| Filing errors | Use Xero's GST/HST Summary report to double-check before submitting |
| CRA audit | Keep all Hubdoc receipts; ensure bank feeds match deposits |
| Missed deadline | Set calendar reminders 1 week before due date |
| Complex transaction | Flag for accountant review (e.g., real property, vehicle purchases) |

---

## Decision Matrix

| Scenario | Recommendation |
|----------|----------------|
| <$50K annual revenue, simple business | **DIY with Xero** (save $400-800/year) |
| $50K-$500K revenue, SaaS/services | **Hybrid** (DIY filing, accountant for year-end) |
| $500K+ revenue, complex operations | **Consider keeping accountant** for all filings |
| International sales, multi-province | **Accountant recommended** (GST/HST place of supply rules) |

---

## Conclusion

For SlideHeroes, the **hybrid approach** is recommended:

1. ✅ Continue using Xero for HST tracking (already paid for)
2. ✅ File GST/HST returns yourself via CRA NetFile (~30 min/quarter)
3. ✅ Keep accountant for annual T2 and tax planning
4. ✅ Optionally have accountant review your first DIY filing

**Projected Annual Savings: $800-1,200**

This approach gets the best of both worlds: automated tracking reduces data entry and errors, DIY filing saves money on routine compliance, and professional oversight remains available for complex matters.

---

## References

- [Xero Canada GST/HST Features](https://www.xero.com/ca/accounting-software/calculate-sales-tax/)
- [CRA GST/HST NetFile](https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/gst-hst-netfile.html)
- [CRA Certified Software for GIFT](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/calculate-prepare-report/software-gst-hst-internet-file-transfer.html)
- LedgerLogic Xero Pricing Canada (ledgerlogic.ca)
