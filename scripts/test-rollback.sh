#!/bin/bash

# Script to test auto-rollback functionality locally
# This simulates the rollback workflow conditions

set -e

echo "🧪 Testing Auto-Rollback Functionality"
echo "======================================="

# Check if required tools are available
command -v curl >/dev/null 2>&1 || { echo "❌ curl is required but not installed."; exit 1; }
command -v bc >/dev/null 2>&1 || { echo "❌ bc is required but not installed."; exit 1; }

# Configuration
DEPLOYMENT_URL="${1:-http://localhost:3000}"
HEALTH_ENDPOINT="/healthcheck"
ERROR_THRESHOLD=0.05
MONITOR_DURATION=30 # seconds (reduced for testing)

echo "📋 Test Configuration:"
echo "  - Deployment URL: $DEPLOYMENT_URL"
echo "  - Health Endpoint: $HEALTH_ENDPOINT"
echo "  - Error Threshold: $ERROR_THRESHOLD (5%)"
echo "  - Monitor Duration: $MONITOR_DURATION seconds"
echo ""

# Test 1: Health Check
echo "🔍 Test 1: Health Check"
echo "------------------------"
health_response=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$HEALTH_ENDPOINT" || echo "000")
if [ "$health_response" = "200" ]; then
    echo "✅ Health check passed (HTTP $health_response)"
    health_status="healthy"
else
    echo "❌ Health check failed (HTTP $health_response)"
    health_status="unhealthy"
fi
echo ""

# Test 2: Smoke Tests Simulation
echo "🔥 Test 2: Smoke Tests Simulation"
echo "----------------------------------"
smoke_status="passed"
critical_endpoints=("/" "/auth/sign-in" "/auth/sign-up")

for endpoint in "${critical_endpoints[@]}"; do
    echo "  Testing: $endpoint"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$endpoint" || echo "000")
    if [ "$response" != "200" ] && [ "$response" != "404" ]; then
        echo "    ❌ Failed (HTTP $response)"
        smoke_status="failed"
    else
        echo "    ✅ Passed (HTTP $response)"
    fi
done

echo "Smoke tests result: $smoke_status"
echo ""

# Test 3: Error Rate Monitoring
echo "📊 Test 3: Error Rate Monitoring"
echo "---------------------------------"
echo "Monitoring for $MONITOR_DURATION seconds..."

end_time=$(($(date +%s) + MONITOR_DURATION))
total_requests=0
error_requests=0

while [ $(date +%s) -lt $end_time ]; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$HEALTH_ENDPOINT" || echo "000")
    total_requests=$((total_requests + 1))
    
    if [ "$response" != "200" ]; then
        error_requests=$((error_requests + 1))
        echo "  ❌ Error detected (HTTP $response)"
    else
        echo "  ✅ Request OK (HTTP $response)"
    fi
    
    sleep 2
done

if [ $total_requests -gt 0 ]; then
    error_rate=$(echo "scale=4; $error_requests / $total_requests" | bc)
    error_percentage=$(echo "scale=2; $error_rate * 100" | bc)
    echo ""
    echo "📈 Monitoring Results:"
    echo "  - Total requests: $total_requests"
    echo "  - Error requests: $error_requests"
    echo "  - Error rate: $error_rate ($error_percentage%)"
    
    if (( $(echo "$error_rate > $ERROR_THRESHOLD" | bc -l) )); then
        echo "  ❌ Error rate exceeds threshold ($ERROR_THRESHOLD)"
        should_rollback="true"
    else
        echo "  ✅ Error rate within threshold ($ERROR_THRESHOLD)"
        should_rollback="false"
    fi
else
    echo "  ⚠️  No requests made during monitoring"
    error_rate=0
    should_rollback="false"
fi
echo ""

# Test 4: Rollback Decision
echo "🔄 Test 4: Rollback Decision"
echo "----------------------------"
rollback_needed="false"
rollback_reasons=()

if [ "$health_status" = "unhealthy" ]; then
    rollback_needed="true"
    rollback_reasons+=("Health check failed")
fi

if [ "$smoke_status" = "failed" ]; then
    rollback_needed="true"
    rollback_reasons+=("Smoke tests failed")
fi

if [ "$should_rollback" = "true" ]; then
    rollback_needed="true"
    rollback_reasons+=("Error rate exceeded threshold")
fi

if [ "$rollback_needed" = "true" ]; then
    echo "🚨 ROLLBACK REQUIRED"
    echo "Reasons:"
    for reason in "${rollback_reasons[@]}"; do
        echo "  - $reason"
    done
    echo ""
    echo "Would execute rollback steps:"
    echo "  1. Get current deployment ID"
    echo "  2. Get previous deployment ID"
    echo "  3. Promote previous deployment"
    echo "  4. Notify team of rollback"
    rollback_exit_code=1
else
    echo "✅ DEPLOYMENT SUCCESSFUL"
    echo "All checks passed - no rollback needed"
    rollback_exit_code=0
fi

echo ""
echo "🏁 Test Summary"
echo "==============="
echo "Health Check: $health_status"
echo "Smoke Tests: $smoke_status"
echo "Error Rate: $error_percentage% (threshold: $(echo "$ERROR_THRESHOLD * 100" | bc)%)"
echo "Rollback Needed: $rollback_needed"
echo ""

if [ "$rollback_needed" = "true" ]; then
    echo "❌ Auto-rollback would be triggered in production"
else
    echo "✅ Deployment would be considered successful"
fi

exit $rollback_exit_code