#!/usr/bin/env python3
"""
Add McKinsey presentations to catalog from Slideworks curated list
"""

import json
from pathlib import Path

CATALOG_PATH = Path(__file__).parent.parent / "sources" / "catalog.json"

# McKinsey presentations extracted from Slideworks.io
# Source: https://slideworks.io/resources/47-real-mckinsey-presentations
MCKINSEY_PRESENTATIONS = [
    # Client Projects
    {
        "title": "Helping Global Health Partnerships to increase their impact: Stop TB Partnership (2009)",
        "url": "https://stoptb.org/assets/documents/about/cb/meetings/17/2.09-03%20Strengthening%20Performance%20Management%20in%20the%20Partnership/2.09-03.1%20Helping%20Global%20Health%20Partnerships%20to%20Increase%20their%20Impact.pdf",
        "type": "client"
    },
    {
        "title": "USPS: Future Business Model (2010)",
        "url": "https://about.usps.com/future-postal-service/mckinsey-usps-future-bus-model2.pdf",
        "type": "client"
    },
    {
        "title": "USPS: Envisioning America's Future Postal Service (2010)",
        "url": "https://about.usps.com/future-postal-service/mckinsey-march-2nd-presentation2.pdf",
        "type": "client"
    },
    {
        "title": "USPS: Selected Slides (2010)",
        "url": "https://about.usps.com/future-postal-service/mckinsey-selected-slides.pdf",
        "type": "client"
    },
    {
        "title": "Capturing the full electricity efficiency potential of the U.K. (2012)",
        "url": "https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/65626/7035-capturing-full-elec-eff-potential-edr.pdf",
        "type": "client"
    },
    {
        "title": "Modelling the potential of digitally-enabled processes in the NHS (2014)",
        "url": "https://www.digitalhealth.net/includes/images/news0254/PDF/overview-evidence-review-of-data-and-information.pdf",
        "type": "client"
    },
    {
        "title": "Refueling the innovation engine in vaccines (2016)",
        "url": "https://www.hhs.gov/sites/default/files/Azimi_McKinsey_Vaccine_Innovation_Findings-remediated.pdf",
        "type": "client"
    },
    {
        "title": "Transportation and Warehousing Sector Analysis (2020)",
        "url": "https://www.federalcitycouncil.org/wp-content/uploads/2020/12/McKinsey_Transportation.pdf",
        "type": "client"
    },
    {
        "title": "Chilean Hydrogen Pathway: Final report (2020)",
        "url": "https://energia.gob.cl/sites/default/files/estudio_base_para_la_elaboracion_de_la_estrategia_nacional_para_el_desarrollo_de_hidrogeno_verde_en_chile.pdf",
        "type": "client"
    },
    {
        "title": "MTA: Financial Impact Assessment on 2020 Revenue of COVID-19",
        "url": "https://new.mta.info/document/16951",
        "type": "client"
    },
    
    # Industry Reports
    {
        "title": "The changed agenda in the global sourcing industry (2009)",
        "url": "https://web-archive.oecd.org/2012-06-14/112202-44083521.pdf",
        "type": "industry"
    },
    {
        "title": "What Makes Private Sector Partnership Works (2011)",
        "url": "https://www.mcgill.ca/globalfoodsecurity/files/globalfoodsecurity/kathrynyoung.pdf",
        "type": "industry"
    },
    {
        "title": "The Internet of Things and Big Data: Opportunities for Value Creation (2013)",
        "url": "https://www.cisco.com/assets/sol/dc/iot_and_big_data.pdf",
        "type": "industry"
    },
    {
        "title": "Laying the foundations for a financially sound industry - Steel (2013)",
        "url": "https://web-archive.oecd.org/2013-12-16/260684-Laying%20the%20foundations%20for%20a%20financially%20sound%20industry%20-%20OECD.pdf",
        "type": "industry"
    },
    {
        "title": "Insurance trends and growth opportunities for Poland (2015)",
        "url": "https://piu.org.pl/public/upload/ibrowser/III%20Kongres%20prezentacje/2014.05.04%20Polish%20Insurance%20Association%20-%20final.pdf",
        "type": "industry"
    },
    {
        "title": "Challenges in Mining: Scarcity or Opportunity? (2015)",
        "url": "https://worldmaterialsforum.com/files/downloads/5-Rare_20Raw_20Material_20Issues.pdf",
        "type": "industry"
    },
    {
        "title": "How will IoT, mobile internet, data analytics and cloud transform public services by 2030? (2015)",
        "url": "https://www.alexanderjarvis.com/wp-content/uploads/2021/12/McKinsey-How-will-Internet-of-Things-mobile-internet-data-analytics-and-cloud-transform-public-services-by-2030.pdf",
        "type": "industry"
    },
    {
        "title": "Using Artificial Intelligence to prevent healthcare errors (2017)",
        "url": "https://www.bundesgesundheitsministerium.de/fileadmin/Dateien/3_Downloads/P/Patientensicherheit/WS3-2017/01_WS3_Henke_20170328_Using_AI_to_prevent_healthcare_errors_from_occuring.pdf",
        "type": "industry"
    },
    {
        "title": "Digital Luxury Experience 2017",
        "url": "https://altagamma.it/media/source/20170525_DLE%202017_Shareablepres_1.pdf",
        "type": "industry"
    },
    {
        "title": "Technology's role in mineral criticality (2017)",
        "url": "https://worldmaterialsforum.com/files/Presentations2017/PlenarySession1/WMF2017-McKinsey-Franck-Bekeart.pdf",
        "type": "industry"
    },
    {
        "title": "The future energy landscape: Global trends and the Netherlands (2017)",
        "url": "https://www.alexanderjarvis.com/wp-content/uploads/2021/12/McKinsey-The-future-energy-landscape-Global-trends-and-a-closer-look-at-the-Netherlands-.pdf",
        "type": "industry"
    },
    {
        "title": "European Banking Summit 2018",
        "url": "https://www.ebf.eu/wp-content/uploads/2018/10/European-Banking-Summit-2018-Max-Floetotto.pdf",
        "type": "industry"
    },
    {
        "title": "Current perspectives on Medical Affairs in Japan (2018)",
        "url": "https://static1.squarespace.com/static/5966db90f9a61efb4cd0dc89/t/5a9750338165f5deb7607a69/1519865953798/Minyoung+Kim.pdf",
        "type": "industry"
    },
    {
        "title": "Investment and Industrial Policy: A Perspective on the Future (2018)",
        "url": "https://unctad.org/system/files/non-official-document/tdb65pt2_item5_presentation_LKrstic_en.pdf",
        "type": "industry"
    },
    {
        "title": "Moving Laggards to Early Adopters (Maybe even innovators) (2018)",
        "url": "https://polytechnic.purdue.edu/sites/default/files/files/Krish%20-%20Moving%20Laggards%20to%20Early%20Adopters%2C%20NcKinsey%20%26%20Co.pdf",
        "type": "industry"
    },
    {
        "title": "SDG Guide for Business Leaders (2019)",
        "url": "https://vl.dk/wp-content/uploads/2019/06/McKinsey-SDG-Practical-Guide.pdf",
        "type": "industry"
    },
    {
        "title": "Global Hydrogen Flows (2022)",
        "url": "https://hydrogencouncil.com/wp-content/uploads/2022/10/Global-Hydrogen-Flows.pdf",
        "type": "industry"
    },
    {
        "title": "McKinsey Technology Trends Outlook 2022",
        "url": "https://www.mckinsey.com/~/media/mckinsey/business%20functions/mckinsey%20digital/our%20insights/the%20top%20trends%20in%20tech%202022/mckinsey-tech-trends-outlook-2022-full-report.pdf",
        "type": "industry"
    },
    {
        "title": "Global Economics Intelligence - Global Summary Report (2023)",
        "url": "https://www.mckinsey.com/~/media/mckinsey/business%20functions/strategy%20and%20corporate%20finance/our%20insights/global%20economics%20intelligence%20executive%20summary%20april%202023/gei-global-summary-april-2023.pdf",
        "type": "industry"
    },
    
    # MGI Reports
    {
        "title": "Context for Global Growth and Development (MGI 2014)",
        "url": "https://www.un.org/esa/ffd/wp-content/uploads/2014/11/gc-Presentation_Manyika_10Nov14.pdf",
        "type": "mgi"
    },
    {
        "title": "From poverty to empowerment: India's imperative (MGI 2014)",
        "url": "https://icrier.org/pdf/mgi_poverty_v2.pdf",
        "type": "mgi"
    },
    {
        "title": "A blueprint for addressing the global affordable housing challenge (MGI 2015)",
        "url": "https://www.fiic.la/Documentos/Congreso%20CAMACOL%202015/MGI%20AH%20Camacol_Jan%20Mischke.pdf",
        "type": "mgi"
    },
    {
        "title": "Reinventing Construction: A Route To Higher Productivity (MGI 2017)",
        "url": "https://ec.europa.eu/docsroom/documents/24763/attachments/3/translations/en/renditions/native",
        "type": "mgi"
    },
    {
        "title": "Outperformers: High-growth emerging economies (MGI 2018)",
        "url": "https://www.piie.com/sites/default/files/documents/madgavkar20181017ppt.pdf",
        "type": "mgi"
    },
    
    # Training/Misc
    {
        "title": "Persuasive problem solving in 7 steps: Training session (2011)",
        "url": "https://www.scribd.com/document/465196081/2011-1011-PS-Training-Presentation",
        "type": "training"
    },
    {
        "title": "How companies can capture the veteran opportunity (2012)",
        "url": "https://toolkit.vets.syr.edu/wp-content/uploads/2012/11/Presentation-1-20120911-Veteran-opportunity.pdf",
        "type": "training"
    }
]

def main():
    # Load existing catalog
    with open(CATALOG_PATH) as f:
        catalog = json.load(f)
    
    # Check for duplicates
    existing_urls = set()
    for source, presentations in catalog["presentations"].items():
        for p in presentations:
            existing_urls.add(p.get("url", ""))
    
    # Add McKinsey presentations
    added = 0
    skipped = 0
    for pres in MCKINSEY_PRESENTATIONS:
        if pres["url"] in existing_urls:
            skipped += 1
            continue
        catalog["presentations"]["mckinsey"].append(pres)
        added += 1
    
    # Update metadata
    catalog["metadata"]["total_presentations"] = sum(
        len(p) for p in catalog["presentations"].values()
    )
    catalog["metadata"]["sources"] = "Analyst Academy + SEC.gov + Slideworks.io"
    
    # Save updated catalog
    with open(CATALOG_PATH, 'w') as f:
        json.dump(catalog, f, indent=2)
    
    print(f"Added {added} McKinsey presentations")
    print(f"Skipped {skipped} duplicates")
    print(f"Total in catalog: {catalog['metadata']['total_presentations']}")

if __name__ == "__main__":
    main()
