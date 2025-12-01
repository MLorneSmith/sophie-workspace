#!/bin/bash
#
# Lighthouse Performance Audit - CLI wrapper for Claude Code
#
# Runs Lighthouse audits and outputs structured results for AI analysis.
# Requires: npm install -g lighthouse
#
# Usage:
#   lighthouse_audit.sh <url> [options]
#
# Options:
#   --output-dir <dir>    Output directory (default: /tmp/lighthouse)
#   --categories <list>   Comma-separated categories (default: performance,accessibility,best-practices)
#   --format <type>       Output format: json, html, both (default: both)
#   --quick               Fast audit with reduced accuracy
#   --summary             Print Core Web Vitals summary to stdout
#
# Examples:
#   lighthouse_audit.sh http://localhost:3000
#   lighthouse_audit.sh http://localhost:3000 --categories performance --quick
#   lighthouse_audit.sh http://localhost:3000 --summary --format json
#

set -e

# Default values
URL=""
OUTPUT_DIR="/tmp/lighthouse"
CATEGORIES="performance,accessibility,best-practices"
FORMAT="both"
QUICK=false
SUMMARY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --categories)
            CATEGORIES="$2"
            shift 2
            ;;
        --format)
            FORMAT="$2"
            shift 2
            ;;
        --quick)
            QUICK=true
            shift
            ;;
        --summary)
            SUMMARY=true
            shift
            ;;
        -h|--help)
            echo "Usage: lighthouse_audit.sh <url> [options]"
            echo ""
            echo "Options:"
            echo "  --output-dir <dir>    Output directory (default: /tmp/lighthouse)"
            echo "  --categories <list>   Categories: performance,accessibility,best-practices,seo,pwa"
            echo "  --format <type>       Output: json, html, both (default: both)"
            echo "  --quick               Fast audit with reduced accuracy"
            echo "  --summary             Print Core Web Vitals summary"
            echo ""
            echo "Examples:"
            echo "  lighthouse_audit.sh http://localhost:3000"
            echo "  lighthouse_audit.sh http://localhost:3000 --categories performance --summary"
            exit 0
            ;;
        *)
            if [[ -z "$URL" ]]; then
                URL="$1"
            else
                echo "Error: Unknown argument: $1"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate URL
if [[ -z "$URL" ]]; then
    echo "Error: URL is required"
    echo "Usage: lighthouse_audit.sh <url> [options]"
    exit 1
fi

# Check if lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo "Error: Lighthouse is not installed"
    echo "Install with: npm install -g lighthouse"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Build lighthouse command
LIGHTHOUSE_CMD="lighthouse \"$URL\" --chrome-flags=\"--headless --no-sandbox --disable-gpu\""

# Add categories
LIGHTHOUSE_CMD="$LIGHTHOUSE_CMD --only-categories=$CATEGORIES"

# Add output format
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
case $FORMAT in
    json)
        LIGHTHOUSE_CMD="$LIGHTHOUSE_CMD --output=json --output-path=\"$OUTPUT_DIR/report-$TIMESTAMP.json\""
        ;;
    html)
        LIGHTHOUSE_CMD="$LIGHTHOUSE_CMD --output=html --output-path=\"$OUTPUT_DIR/report-$TIMESTAMP.html\""
        ;;
    both)
        LIGHTHOUSE_CMD="$LIGHTHOUSE_CMD --output=json,html --output-path=\"$OUTPUT_DIR/report-$TIMESTAMP\""
        ;;
esac

# Add quick mode options
if [[ "$QUICK" == true ]]; then
    LIGHTHOUSE_CMD="$LIGHTHOUSE_CMD --throttling-method=provided --max-wait-for-load=15000"
fi

# Run lighthouse
echo "Running Lighthouse audit..."
echo "URL: $URL"
echo "Categories: $CATEGORIES"
echo "Output: $OUTPUT_DIR"
echo ""

eval $LIGHTHOUSE_CMD 2>/dev/null

# Output summary if requested
if [[ "$SUMMARY" == true ]]; then
    JSON_FILE="$OUTPUT_DIR/report-$TIMESTAMP.json"

    if [[ -f "$JSON_FILE" ]]; then
        echo ""
        echo "=== Core Web Vitals Summary ==="
        echo ""

        # Extract key metrics using jq if available
        if command -v jq &> /dev/null; then
            # Category scores
            echo "Category Scores:"
            jq -r '.categories | to_entries[] | "  \(.key): \(.value.score * 100 | floor)%"' "$JSON_FILE" 2>/dev/null || echo "  (Unable to parse scores)"

            echo ""
            echo "Core Web Vitals:"

            # LCP
            LCP=$(jq -r '.audits["largest-contentful-paint"].displayValue // "N/A"' "$JSON_FILE" 2>/dev/null)
            LCP_SCORE=$(jq -r '.audits["largest-contentful-paint"].score // 0' "$JSON_FILE" 2>/dev/null)
            echo "  LCP (Largest Contentful Paint): $LCP"

            # FID (or TBT as proxy)
            TBT=$(jq -r '.audits["total-blocking-time"].displayValue // "N/A"' "$JSON_FILE" 2>/dev/null)
            echo "  TBT (Total Blocking Time): $TBT"

            # CLS
            CLS=$(jq -r '.audits["cumulative-layout-shift"].displayValue // "N/A"' "$JSON_FILE" 2>/dev/null)
            echo "  CLS (Cumulative Layout Shift): $CLS"

            # FCP
            FCP=$(jq -r '.audits["first-contentful-paint"].displayValue // "N/A"' "$JSON_FILE" 2>/dev/null)
            echo "  FCP (First Contentful Paint): $FCP"

            # Speed Index
            SI=$(jq -r '.audits["speed-index"].displayValue // "N/A"' "$JSON_FILE" 2>/dev/null)
            echo "  Speed Index: $SI"

            echo ""
            echo "Top Opportunities:"
            jq -r '.audits | to_entries | map(select(.value.details.type == "opportunity" and .value.score != null and .value.score < 1)) | sort_by(.value.score) | .[0:5] | .[] | "  - \(.value.title): \(.value.displayValue // "N/A")"' "$JSON_FILE" 2>/dev/null || echo "  (No opportunities found)"

        else
            echo "(Install jq for detailed summary: apt install jq)"
            echo "JSON report saved to: $JSON_FILE"
        fi
    fi
fi

# Final output
echo ""
echo "=== Lighthouse Audit Complete ==="
echo "Reports saved to: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"/report-$TIMESTAMP* 2>/dev/null || true
