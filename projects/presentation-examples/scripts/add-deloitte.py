#!/usr/bin/env python3
"""
Add Deloitte presentations to catalog from Analyst Academy
"""

import json
from pathlib import Path

CATALOG_PATH = Path(__file__).parent.parent / "sources" / "catalog.json"

# Deloitte presentations extracted from Analyst Academy
DELOITTE_PRESENTATIONS = [
    {
        "title": "SEA CFO Forum Southeast Asia Business Outlook",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/sg/Documents/cxo-programs/sea-cfo-agendo-forum-jan-2022-presentation-slides.pdf",
        "type": "industry"
    },
    {
        "title": "The Shopping Centre Handbook 4.0",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/es/Documents/financial-advisory/Deloitte-ES-Financial-Advisory-The-Shopping-center-Handbook-2019.pdf",
        "type": "industry"
    },
    {
        "title": "Insights from the leading edge of generative AI adoption",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/consulting/us-state-of-gen-ai-report.pdf",
        "type": "industry"
    },
    {
        "title": "Global Business Services Performance improvement",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/process-and-operations/us-operations-global-business-services.pdf",
        "type": "industry"
    },
    {
        "title": "Global Shared Services 2017 Survey Report",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/process-and-operations/us-global-shared-services-report.pdf",
        "type": "industry"
    },
    {
        "title": "Digital Finance Seeing is Believing",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/cn/Documents/audit/deloitte-cn-assurance-digital-finance-seeing-is-believing-20210707.pdf",
        "type": "industry"
    },
    {
        "title": "Ground Station Life Cycle Assessment",
        "url": "https://indico.esa.int/event/321/contributions/6357/attachments/4332/6535/20210920%20ESA_CSID%202021_GSt%20LCA_vf.pdf",
        "type": "client"
    },
    {
        "title": "Doing business in the Philippines 2021",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/ph/Documents/finance/ph-fa-doing-business-in-philippines-2021.pdf",
        "type": "industry"
    },
    {
        "title": "AI transformation: Four key actions powering value from AI",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/deloitte-analytics/us-ai-institute-state-of-ai-fifth-edition.pdf",
        "type": "industry"
    },
    {
        "title": "The CMO Survey Marketing in a Post Covid Era",
        "url": "https://cmosurvey.org/wp-content/uploads/2022/09/The_CMO_Survey-Highlights_and_Insights_Report-September_2022.pdf",
        "type": "industry"
    },
    {
        "title": "Fletcher Building – economic uncertainty analysis",
        "url": "https://fletcherbuilding.com/assets/4-investor-centre/other-documents/fletcher-building-economic-uncertainty-analysis-deloitte-report.pdf",
        "type": "client"
    },
    {
        "title": "Trends & AI in the Contact Center",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/process-and-operations/us-consulting-trends-and-ai-in-contact-center.pdf",
        "type": "industry"
    },
    {
        "title": "2023 Global Shared Services and Outsourcing Survey",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/process-and-operations/us-2023-global-shared-services-and-outsourcing-survey-executive-summary.pdf",
        "type": "industry"
    },
    {
        "title": "Digital Consumer Trends 2023",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/uk/Documents/technology-media-telecommunications/deloitte-uk-digital-consumer-trends-2023-deck.pdf",
        "type": "industry"
    },
    {
        "title": "Global Human Capital Trends 2023: New fundamentals for a boundaryless world",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/ua/Documents/human-capital/2023-human-capital-trends-presentation_en.pdf",
        "type": "industry"
    },
    {
        "title": "Private company outlook: Productivity",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/deloitte-private/us-productivity-private-company-march-2024.pdf",
        "type": "industry"
    },
    {
        "title": "Building a Future-Ready Investment Firm",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/de/Documents/financial-services/Future-Ready-Investment-Firm-eBook_Final-1.pdf",
        "type": "industry"
    },
    {
        "title": "The Deloitte Global Millennial Survey 2020",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/global/Documents/About-Deloitte/deloitte-2020-millennial-survey.pdf",
        "type": "industry"
    },
    {
        "title": "TrendRadar: The Future Consumer",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/ch/Documents/consumer-business/deloitte-ch-en-trendradar-future-consumer.pdf",
        "type": "industry"
    },
    {
        "title": "2023 Global Marketing Trends",
        "url": "https://www2.deloitte.com/content/dam/insights/articles/us175825_gmt2023/pdf/DI_GMT-2023.pdf",
        "type": "industry"
    },
    {
        "title": "Global 2024 Gen Z and Millennial Survey: Netherlands",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/nl/Documents/humancapital/deloitte-nl-hc-2024genzmillennialsurvey-countryreport.pdf",
        "type": "industry"
    },
    {
        "title": "The 2016 Deloitte Millennial Survey",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/global/Documents/About-Deloitte/gx-millenial-survey-2016-exec-summary.pdf",
        "type": "industry"
    },
    {
        "title": "The 2017 Deloitte Millennial Survey",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/global/Documents/About-Deloitte/gx-deloitte-millennial-survey-2017-executive-summary.pdf",
        "type": "industry"
    },
    {
        "title": "The Logistics Property Handbook 4.0",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/es/Documents/financial-advisory/Deloitte-ES-FA-logistic-property-handbook-2019.pdf",
        "type": "industry"
    },
    {
        "title": "The Hotel Property Handbook 4.0",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/es/Documents/financial-advisory/Deloitte-ES-Financial-Advisory-Hotel-Property-4-0-Executive-Summary.pdf",
        "type": "industry"
    },
    {
        "title": "Tested, Trusted, Transformed: Corporate Affairs Function",
        "url": "https://www.deloitte.com/content/dam/assets-zone2/uk/en/docs/services/risk-advisory/2023/deloitte-uk-del-ca-report-interactive-2023.pdf",
        "type": "industry"
    },
    {
        "title": "VC Human Capital Survey 2023",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/audit/us-audit-human-capital-survey-report-2023.pdf",
        "type": "industry"
    },
    {
        "title": "Consumer industry's journey towards digital maturity",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/sg/Documents/consumer-business/sea-cb-consumer-industry-journey-towards-digital-maturity.pdf",
        "type": "industry"
    },
    {
        "title": "Foodservice Market Monitor 2023",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/it/Documents/consumer-business/deloitte-foodservice-market-monitor-2023.pdf",
        "type": "industry"
    },
    {
        "title": "Preparing the workforce for ethical, responsible, and trustworthy AI",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/about-deloitte/us-deloitte-preparing-the-workforce-for-ethical-ai.pdf",
        "type": "industry"
    },
    {
        "title": "Now decides next: Getting real about Generative AI",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/consulting/us-state-of-gen-ai-report-q2.pdf",
        "type": "industry"
    },
    {
        "title": "Global Treasury Survey 2022",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/risk/us-deloitte-global-treasury-survey-2022.pdf",
        "type": "industry"
    },
    {
        "title": "The future of M&A 2022 Trends Survey",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/mergers-acqisitions/us-deloitte-2022-mna-trends-report.pdf",
        "type": "industry"
    },
    {
        "title": "Women @ Work 2022: A Global Outlook",
        "url": "https://www2.deloitte.com/content/dam/insights/articles/glob-175228_global-women-%40-work/DI_Global-Women-%40-Work.pdf",
        "type": "industry"
    },
    {
        "title": "The Metaverse in Asia: Strategies for Economic Impact",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/sg/Documents/center-for-the-edge/sg-metaverse-in-asia-deloitte-center-for-the-edge-nov22.pdf",
        "type": "industry"
    },
    {
        "title": "2022 Global Tax Survey: Beyond BEPS",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/global/Documents/Tax/gx-beps-global-survey-summary-results-2022.pdf",
        "type": "industry"
    },
    {
        "title": "2022 Japan Consumer Survey on Next-Generation Automobiles",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/tw/Documents/consumer-business/2022-japan-consumeeer-survey-on-next-generation-automobiles-en.pdf",
        "type": "industry"
    },
    {
        "title": "2021 Global Shared Services and Outsourcing Survey",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/es/Documents/operaciones/Deloitte-es-operations-encuesta-servicios-compartidos-y-outsourcing-2021.pdf",
        "type": "industry"
    },
    {
        "title": "Global Fashion & Luxury Private Equity Survey 2021",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/it/Documents/finance/FashionLuxuryPrivateEquityAndInvestorsSurvey2021_Deloitte.pdf",
        "type": "industry"
    },
    {
        "title": "2019 Holiday Survey of Consumers",
        "url": "https://www2.deloitte.com/content/dam/insights/us/articles/6382_2019-holiday-survey/DEL_Holiday19_ConsumerSurveyFindings.pdf",
        "type": "industry"
    },
    {
        "title": "Consumer views on autonomous and electric powertrain - Asia Pacific",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/global/Documents/Consumer-Business/2018-global-automotive-consumer-study-asia-pacific-highlights.pdf",
        "type": "industry"
    },
    {
        "title": "Third-party governance and risk management: The threats are real",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/global/Documents/Risk/gx-gers-TPGRM.pdf",
        "type": "industry"
    },
    {
        "title": "EMEA Digital Banking Maturity 2018",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/global/Documents/About-Deloitte/central-europe/ce-digital-banking-maturity-study-emea.pdf",
        "type": "industry"
    },
    {
        "title": "Save-to-transform: Global Cost Survey 2019",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/process-and-operations/us-global-cost-survey-2019.pdf",
        "type": "industry"
    },
    {
        "title": "Global Contact Center Survey 2017",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/us/Documents/strategy/us-con-2017-global-contact-center-survey.pdf",
        "type": "industry"
    },
    {
        "title": "High-Impact Leadership Master Deck",
        "url": "https://www2.deloitte.com/content/dam/Deloitte/ca/Documents/audit/ca-audit-abm-scotia-high-impact-leadership.pdf",
        "type": "training"
    },
]

def main():
    # Load existing catalog
    with open(CATALOG_PATH) as f:
        catalog = json.load(f)
    
    # Ensure deloitte key exists
    if "deloitte" not in catalog["presentations"]:
        catalog["presentations"]["deloitte"] = []
    
    # Check for duplicates
    existing_urls = set()
    for source, presentations in catalog["presentations"].items():
        for p in presentations:
            existing_urls.add(p.get("url", ""))
    
    # Add Deloitte presentations
    added = 0
    skipped = 0
    for pres in DELOITTE_PRESENTATIONS:
        if pres["url"] in existing_urls:
            skipped += 1
            continue
        catalog["presentations"]["deloitte"].append(pres)
        added += 1
    
    # Update metadata
    catalog["metadata"]["total_presentations"] = sum(
        len(p) for p in catalog["presentations"].values()
    )
    catalog["metadata"]["sources"] = "Analyst Academy + SEC.gov + Slideworks.io + Plus AI"
    
    # Save updated catalog
    with open(CATALOG_PATH, 'w') as f:
        json.dump(catalog, f, indent=2)
    
    print(f"Added {added} Deloitte presentations")
    print(f"Skipped {skipped} duplicates")
    print(f"Total in catalog: {catalog['metadata']['total_presentations']}")

if __name__ == "__main__":
    main()
