#!/usr/bin/env python3
"""
Add Bain presentations to catalog from Plus AI curated list
"""

import json
from pathlib import Path

CATALOG_PATH = Path(__file__).parent.parent / "sources" / "catalog.json"

# Bain presentations extracted from plusai.com blog
BAIN_PRESENTATIONS = [
    # Industry Overview
    {
        "title": "2011 China Luxury Market Study",
        "url": "https://media.bain.com/Images/2011%20Bain%20China%20Luxury%20Market%20Study.pdf",
        "type": "industry"
    },
    
    # Strategy and Operations
    {
        "title": "Achieving Operational Excellence at UC Berkeley - Diagnostic Report (2010)",
        "url": "http://oe.berkeley.edu/sites/default/files/diagnostic%20report%20bain%20uc%20berkeley.pdf",
        "type": "client"
    },
    {
        "title": "Engaging your organization to deliver results (2019)",
        "url": "https://chicago.iabc.com/wp-content/uploads/2019/10/Bain-Presentation-Deck.pdf",
        "type": "industry"
    },
    
    # Problem-solving and Case Studies
    {
        "title": "Introduction to Bain & Company / Report on resilience (2021)",
        "url": "https://amcham.dk/wp-content/uploads/2021/04/20200412-Resilience-AmCham-presentation-vSHARED.pdf",
        "type": "industry"
    },
]

# Additional Bain presentations from other sources
ADDITIONAL_BAIN = [
    {
        "title": "Global Diamond Industry Report 2017",
        "url": "http://www.bain.com/Images/bain_diamond_report_2017_pages.pdf",
        "type": "industry"
    },
    {
        "title": "Global Diamond Industry Report 2018",
        "url": "https://www.bain.com/contentassets/90de22c8b4b44c6cbb1d1ee93e74a1fa/bain_report_global_diamond_industry_report_2018.pdf",
        "type": "industry"
    },
    {
        "title": "Global Diamond Industry Report 2019",
        "url": "https://www.bain.com/globalassets/noindex/2019/bain_report_global_diamond_industry_report_2019.pdf",
        "type": "industry"
    },
    {
        "title": "Bain Retail Holiday Newsletter 2019",
        "url": "https://www.bain.com/globalassets/noindex/2019/bain_brief_2019_retail_holiday_newsletter.pdf",
        "type": "industry"
    },
    {
        "title": "Front Line of Healthcare Report 2018",
        "url": "https://www.bain.com/contentassets/b1a3a26c15f048a68c2bd8d5e7bebd1b/bain_report_front_line_of_healthcare_report_2018.pdf",
        "type": "industry"
    },
    {
        "title": "Global Private Equity Report 2020",
        "url": "https://www.bain.com/globalassets/noindex/2020/bain_report_global_private_equity_report_2020.pdf",
        "type": "industry"
    },
    {
        "title": "Asia-Pacific Private Equity Report 2020",
        "url": "https://www.bain.com/globalassets/noindex/2020/bain_report_asia-pacific_private_equity_report_2020.pdf",
        "type": "industry"
    },
    {
        "title": "Building a Winning Digital Bank",
        "url": "https://www.bain.com/contentassets/1ed41c72ece041eb92b41ec65df4c0d6/bain_brief_building_a_winning_digital_bank.pdf",
        "type": "industry"
    },
    {
        "title": "Age of Customer Advocacy",
        "url": "https://www.bain.com/contentassets/9cc11f9fd0d14b0f91c2d3d24c96d1c5/bain_report_age_of_advocacy.pdf",
        "type": "industry"
    },
]

def main():
    # Load existing catalog
    with open(CATALOG_PATH) as f:
        catalog = json.load(f)
    
    # Ensure bain key exists
    if "bain" not in catalog["presentations"]:
        catalog["presentations"]["bain"] = []
    
    # Check for duplicates
    existing_urls = set()
    for source, presentations in catalog["presentations"].items():
        for p in presentations:
            existing_urls.add(p.get("url", ""))
    
    # Combine all presentations
    all_bain = BAIN_PRESENTATIONS + ADDITIONAL_BAIN
    
    # Add Bain presentations
    added = 0
    skipped = 0
    for pres in all_bain:
        if pres["url"] in existing_urls:
            skipped += 1
            continue
        catalog["presentations"]["bain"].append(pres)
        added += 1
    
    # Update metadata
    catalog["metadata"]["total_presentations"] = sum(
        len(p) for p in catalog["presentations"].values()
    )
    catalog["metadata"]["sources"] = "Analyst Academy + SEC.gov + Slideworks.io + Plus AI"
    
    # Save updated catalog
    with open(CATALOG_PATH, 'w') as f:
        json.dump(catalog, f, indent=2)
    
    print(f"Added {added} Bain presentations")
    print(f"Skipped {skipped} duplicates")
    print(f"Total in catalog: {catalog['metadata']['total_presentations']}")

if __name__ == "__main__":
    main()
