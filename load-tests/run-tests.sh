#!/bin/bash

# Load testing script for SlideHeroes
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
K6_BIN="${K6_BIN:-../.bin/k6}"
BASE_URL="${K6_API_URL:-https://staging.slideheroes.com}"
REPORTS_DIR="reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to run a test scenario
run_test() {
    local test_name=$1
    local scenario_file=$2
    local output_file="${REPORTS_DIR}/${test_name}_${TIMESTAMP}.json"
    
    print_status "Running ${test_name} test..."
    
    if $K6_BIN run \
        --out json="${output_file}" \
        --summary-export="${REPORTS_DIR}/${test_name}_${TIMESTAMP}_summary.json" \
        "${scenario_file}"; then
        print_status "✓ ${test_name} test completed successfully"
        return 0
    else
        print_error "✗ ${test_name} test failed"
        return 1
    fi
}

# Function to generate HTML report
generate_html_report() {
    local test_name=$1
    local summary_file="${REPORTS_DIR}/${test_name}_${TIMESTAMP}_summary.json"
    local html_file="${REPORTS_DIR}/${test_name}_${TIMESTAMP}.html"
    
    if [ -f "$summary_file" ]; then
        print_status "Generating HTML report for ${test_name}..."
        
        # Create a simple HTML report
        cat > "$html_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>SlideHeroes Load Test Report - ${test_name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; }
        .pass { color: green; }
        .fail { color: red; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
    </style>
</head>
<body>
    <h1>Load Test Report: ${test_name}</h1>
    <p>Generated at: $(date)</p>
    <p>Target URL: ${BASE_URL}</p>
    
    <h2>Test Summary</h2>
    <pre id="summary"></pre>
    
    <script>
        fetch('${test_name}_${TIMESTAMP}_summary.json')
            .then(response => response.json())
            .then(data => {
                document.getElementById('summary').textContent = JSON.stringify(data, null, 2);
            });
    </script>
</body>
</html>
EOF
        print_status "HTML report generated: ${html_file}"
    fi
}

# Main execution
main() {
    print_status "Starting SlideHeroes load testing suite"
    print_status "Target URL: ${BASE_URL}"
    
    # Create reports directory if it doesn't exist
    mkdir -p "$REPORTS_DIR"
    
    # Check if k6 is available
    if [ ! -f "$K6_BIN" ]; then
        print_error "k6 binary not found at $K6_BIN"
        print_status "Please install k6 or set K6_BIN environment variable"
        exit 1
    fi
    
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        print_status "Running all test scenarios..."
        TESTS=("login-flow" "dashboard-load" "user-journey")
    else
        TESTS=("$@")
    fi
    
    # Run selected tests
    FAILED_TESTS=0
    for test in "${TESTS[@]}"; do
        case $test in
            "login-flow")
                run_test "login-flow" "scenarios/login-flow.js" || ((FAILED_TESTS++))
                ;;
            "dashboard-load")
                run_test "dashboard-load" "scenarios/dashboard-load.js" || ((FAILED_TESTS++))
                ;;
            "user-journey")
                run_test "user-journey" "scenarios/user-journey.js" || ((FAILED_TESTS++))
                ;;
            *)
                print_warning "Unknown test: $test"
                ;;
        esac
        
        # Generate HTML report for the test
        generate_html_report "${test}"
        
        # Add delay between tests
        if [ "$test" != "${TESTS[-1]}" ]; then
            print_status "Waiting 30 seconds before next test..."
            sleep 30
        fi
    done
    
    # Summary
    print_status "Load testing completed!"
    print_status "Reports saved in: ${REPORTS_DIR}/"
    
    if [ $FAILED_TESTS -gt 0 ]; then
        print_error "$FAILED_TESTS test(s) failed"
        exit 1
    else
        print_status "All tests passed successfully"
    fi
}

# Run main function
main "$@"