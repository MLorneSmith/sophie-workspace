#!/usr/bin/env python3
"""
Extract presentation links from Analyst Academy and categorize by firm.
"""

import json
import re
import sys
from pathlib import Path
from datetime import datetime

# Sample data extracted from web fetch - in production, this would scrape the page
# These are real links from the Analyst Academy page

PRESENTATIONS = {
    "bcg": [
        {"title": "Reshaping NYCHA support functions", "url": "https://www1.nyc.gov/assets/nycha/downloads/pdf/BCG-report-NYCHA-Key-Findings-and-Recommendations-8-15-12vFinal.pdf"},
        {"title": "Loose Dogs in Dallas: Strategic Recommendations", "url": "https://dallascityhall.com/government/Council%20Meeting%20Documents/loose-dogs-in-dallas-strategic-recommendations-to-improve-public-safety-and-animal-welfare_combined_083016.pdf"},
        {"title": "Melbourne as a Global Cultural Destination", "url": "https://creative.vic.gov.au/resources/melbourne-as-a-global-cultural-destination"},
        {"title": "The Open Education Resources ecosystem", "url": "https://www.hewlett.org/wp-content/uploads/2016/08/The%20Open%20Educational%20Resources%20Ecosystem.pdf"},
        {"title": "True-Luxury Global Consumer Insight (7th Edition)", "url": "https://web-assets.bcg.com/f2/f1/002816bc4aca91276243c72ee57d/bcgxaltagamma-true-luxury-global-consumer-insight-2021.pdf"},
        {"title": "Evaluating NYC media sector development", "url": "http://www.nyc.gov/html/film/downloads/pdf/Media_in_NYC_2012.pdf"},
        {"title": "The Electric Car Tipping Point", "url": "https://www.slideshare.net/TheBostonConsultingGroup/the-electric-car-tipping-point-81666290"},
        {"title": "Projecting US Mail volumes to 2020", "url": "https://about.usps.com/future-postal-service/bcg-detailedpresentation.pdf"},
        {"title": "Next Generation Manufacturing (2016)", "url": "https://media-publications.bcg.com/BCG-CII-Report-Next-Gen-Mfg-Nov-2016.PDF"},
        {"title": "COVID-19 BCG Perspectives: Global Restart", "url": "https://media-publications.bcg.com/BCG-COVID-19-BCG-Perspectives-Version13.pdf"},
        {"title": "BCG Investor Perspective Series: Pulse Check #21", "url": "https://web-assets.bcg.com/58/ed/0c59f92f40059f65c55a77289af0/investor-pulse-21-slideshow-221025.pdf"},
        {"title": "BCG Executive Perspectives: Future of Sales and Marketing", "url": "https://media-publications.bcg.com/BCG-Executive-Perspectives-2022-Future-of-Marketing-and-Sales.pdf"},
        {"title": "BCG Executive Perspectives: Race for Innovation", "url": "https://media-publications.bcg.com/BCG-Executive-Perspectives-Race-for-Innovation.pdf"},
        {"title": "Digital consumer spending in India: $100Bn opportunity", "url": "https://think.storage.googleapis.com/docs/digital-consumer-spending-in-india-launch-presentation.pdf"},
        {"title": "Economic Impact of Ford and F-Series", "url": "https://media.ford.com/content/dam/fordmedia/North%20America/US/2020/09/17/Boston-Consulting-Group-Report.pdf"},
        {"title": "Path to digital marketing maturity", "url": "https://think.storage.googleapis.com/docs/BCG-Google-AUNZ-Digital-Marketing-Maturity-Report.pdf"},
        {"title": "2019 True-Luxury Global Consumer Insight", "url": "https://media-publications.bcg.com/france/True-Luxury%20Global%20Consumer%20Insight%202019%20-%20Plenary%20-%20vMedia.pdf"},
        {"title": "Out @ Work Barometer", "url": "https://media-publications.bcg.com/pdf/out-at-work-barometer.pdf"},
        {"title": "Evolving State of Digital Transformation", "url": "https://web-assets.bcg.com/1f/a3/c14cefc747b695e28155f732a556/bcg-the-evolving-state-of-digital-transformation-slideshow-sept-2020.pdf"},
        {"title": "NY COVID-19 Economic Impact Assessment", "url": "https://www.budget.ny.gov/pubs/archive/fy21/ny-covid19-economic-impact-prelim.pdf"},
        {"title": "How COVID-19 Changed the Consumer", "url": "https://media-publications.bcg.com/BCG-Executive-Perspectives-How-Covid-Changed-the-Consumer.pdf"},
        {"title": "Climate Change: BCG Perspectives and Offerings", "url": "https://www.spe-london.org/wp-content/uploads/2020/03/SPE-presentation-v1-for-distribution.pdf"},
        {"title": "AI at Work: What People Are Saying", "url": "https://web-assets.bcg.com/8c/26/b80dfaa64b1d92bed7b64d2e19dd/ai-at-work-what-people-are-saying.pdf"},
        {"title": "CEO Outlook: Caution, Optimism, and Road Ahead", "url": "https://media-publications.bcg.com/BCG-Executive-Perspectives-CEO-Outlook-Survey-March-2023.pdf"},
        {"title": "CEO's Guide to Costs and Growth", "url": "https://media-publications.bcg.com/BCG-Executive-Perspectives-CEOs-Guide-to-Costs-and-Growth.pdf"},
    ],
    "mckinsey": [
        # These would be extracted from the full page - placeholder for now
    ],
    "bain": [
        # These would be extracted from the full page - placeholder for now
    ],
    "sec_filings": [
        {"title": "Investor Presentation March 2024", "url": "https://www.sec.gov/Archives/edgar/data/765880/000110465924029669/tm247564d2_ex99-1.pdf", "company": "Unknown"},
        {"title": "Investor Presentation September 2024", "url": "https://www.sec.gov/Archives/edgar/data/1844971/000162828024039789/gree_investorpresentationx.pdf", "company": "GREE"},
        {"title": "Investor Presentation March 2025", "url": "https://www.sec.gov/Archives/edgar/data/1529628/000152962825000061/investorpresentation-march.pdf", "company": "Unknown"},
        {"title": "Investor Presentation Q1 FY2024", "url": "https://www.sec.gov/Archives/edgar/data/78749/000095017023043685/agys-ex99_1.pdf", "company": "AGYS"},
        {"title": "Investor Presentation January 2025", "url": "https://www.sec.gov/Archives/edgar/data/799288/000095017025004517/le-ex99_1.pdf", "company": "Unknown"},
    ]
}

def main():
    output_dir = Path(__file__).parent.parent / "sources"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Count totals
    total = sum(len(v) for v in PRESENTATIONS.values())
    
    catalog = {
        "metadata": {
            "source": "Analyst Academy + SEC.gov",
            "extracted_at": datetime.now().isoformat(),
            "total_presentations": total,
        },
        "presentations": PRESENTATIONS
    }
    
    output_file = output_dir / "catalog.json"
    with open(output_file, "w") as f:
        json.dump(catalog, f, indent=2)
    
    print(f"✅ Extracted {total} presentations to {output_file}")
    print(f"   - BCG: {len(PRESENTATIONS['bcg'])}")
    print(f"   - McKinsey: {len(PRESENTATIONS['mckinsey'])}")
    print(f"   - Bain: {len(PRESENTATIONS['bain'])}")
    print(f"   - SEC filings: {len(PRESENTATIONS['sec_filings'])}")

if __name__ == "__main__":
    main()
