#!/bin/bash

# Supabase External Health Monitor
# Provides health status for Supabase containers without native health checks
# Can be integrated with docker-health-wrapper.sh

set -uo pipefail

# Function to check PostgREST health via admin endpoint
check_postgrest_health() {
    local container_name="supabase_rest_2025slideheroes-db"

    # Check if container is running
    if ! docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
        echo "stopped"
        return 1
    fi

    # Check PostgREST via Kong gateway (accessible endpoint)
    if curl -s -f -o /dev/null "http://localhost:54521/rest/v1/" 2>/dev/null; then
        echo "healthy"
        return 0
    else
        # Fallback to process check
        if docker top "$container_name" 2>/dev/null | grep -q "postgrest"; then
            echo "degraded"  # Process running but API not accessible via Kong
            return 0
        else
            echo "unhealthy"
            return 1
        fi
    fi
}

# Function to check Edge Runtime health
check_edge_runtime_health() {
    local container_name="supabase_edge_runtime_2025slideheroes-db"

    # Check if container is running
    if ! docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
        echo "stopped"
        return 1
    fi

    # Check if Deno process is running (no exposed health endpoint)
    if docker top "$container_name" 2>/dev/null | grep -q "deno"; then
        # Check container resource usage as a health indicator
        local cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" "$container_name" 2>/dev/null | tr -d '%')
        if [ -n "$cpu_usage" ] && [ $(echo "$cpu_usage < 90" | bc -l 2>/dev/null || echo "1") -eq 1 ]; then
            echo "healthy"
            return 0
        else
            echo "degraded"  # High CPU usage
            return 0
        fi
    else
        echo "unhealthy"
        return 1
    fi
}

# Function to output status in JSON format
output_json() {
    local postgrest_status=$(check_postgrest_health)
    local edge_runtime_status=$(check_edge_runtime_health)

    cat <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "containers": [
    {
      "name": "supabase_rest_2025slideheroes-db",
      "type": "PostgREST",
      "status": "$postgrest_status",
      "health_check_method": "kong_gateway",
      "endpoint": "http://localhost:54521/rest/v1/"
    },
    {
      "name": "supabase_edge_runtime_2025slideheroes-db",
      "type": "Edge Runtime",
      "status": "$edge_runtime_status",
      "health_check_method": "process_monitor",
      "process": "deno"
    }
  ]
}
EOF
}

# Function to create virtual health check entries for Docker
create_virtual_healthcheck() {
    local container_name="$1"
    local status="$2"

    # This would be used by docker-health-wrapper.sh
    echo "${container_name}:${status}"
}

# Main execution
case "${1:-status}" in
    "status")
        echo "=== Supabase Container Health Status ==="
        echo ""
        echo "PostgREST (supabase_rest_2025slideheroes-db):"
        postgrest_status=$(check_postgrest_health)
        echo "  Status: $postgrest_status"
        echo "  Kong gateway endpoint: http://localhost:54521/rest/v1/"

        echo ""
        echo "Edge Runtime (supabase_edge_runtime_2025slideheroes-db):"
        edge_runtime_status=$(check_edge_runtime_health)
        echo "  Status: $edge_runtime_status"
        echo "  Process: deno"
        ;;

    "json")
        output_json
        ;;

    "check-postgrest")
        check_postgrest_health
        ;;

    "check-edge-runtime")
        check_edge_runtime_health
        ;;

    "virtual-health")
        # Output format compatible with docker-health-wrapper.sh
        create_virtual_healthcheck "supabase_rest_2025slideheroes-db" "$(check_postgrest_health)"
        create_virtual_healthcheck "supabase_edge_runtime_2025slideheroes-db" "$(check_edge_runtime_health)"
        ;;

    "monitor")
        # Continuous monitoring mode
        echo "Starting continuous monitoring (Ctrl+C to stop)..."
        while true; do
            clear
            echo "=== Supabase Health Monitor - $(date) ==="
            echo ""

            postgrest_status=$(check_postgrest_health)
            edge_runtime_status=$(check_edge_runtime_health)

            # Color codes
            RED='\033[0;31m'
            GREEN='\033[0;32m'
            YELLOW='\033[1;33m'
            NC='\033[0m'

            # PostgREST status
            case "$postgrest_status" in
                "healthy") echo -e "${GREEN}✓${NC} PostgREST: Healthy" ;;
                "degraded") echo -e "${YELLOW}⚠${NC} PostgREST: Degraded (admin endpoint down)" ;;
                "unhealthy") echo -e "${RED}✗${NC} PostgREST: Unhealthy" ;;
                "stopped") echo -e "${RED}✗${NC} PostgREST: Stopped" ;;
            esac

            # Edge Runtime status
            case "$edge_runtime_status" in
                "healthy") echo -e "${GREEN}✓${NC} Edge Runtime: Healthy" ;;
                "degraded") echo -e "${YELLOW}⚠${NC} Edge Runtime: Degraded (high CPU)" ;;
                "unhealthy") echo -e "${RED}✗${NC} Edge Runtime: Unhealthy" ;;
                "stopped") echo -e "${RED}✗${NC} Edge Runtime: Stopped" ;;
            esac

            sleep 5
        done
        ;;

    *)
        echo "Usage: $0 [status|json|check-postgrest|check-edge-runtime|virtual-health|monitor]"
        echo ""
        echo "Commands:"
        echo "  status          - Show health status of Supabase containers"
        echo "  json            - Output status in JSON format"
        echo "  check-postgrest - Check PostgREST health only"
        echo "  check-edge-runtime - Check Edge Runtime health only"
        echo "  virtual-health  - Output format for docker-health-wrapper integration"
        echo "  monitor         - Continuous monitoring mode"
        exit 1
        ;;
esac