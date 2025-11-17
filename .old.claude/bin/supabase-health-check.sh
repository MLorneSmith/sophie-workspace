#!/bin/bash

# Supabase Container Health Check Script
# This script performs external health checks for Supabase containers that don't have built-in health checks
# It can be integrated with docker-health monitoring system

set -uo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Health check results
TOTAL_CONTAINERS=0
HEALTHY_CONTAINERS=0
UNHEALTHY_CONTAINERS=0
UNKNOWN_CONTAINERS=0

# Function to check container health
check_container_health() {
    local container_name="$1"
    local check_type="$2"
    local check_target="$3"

    TOTAL_CONTAINERS=$((TOTAL_CONTAINERS + 1))

    # First check if container is running
    if ! docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
        echo -e "${RED}✗${NC} $container_name: Container not running"
        UNHEALTHY_CONTAINERS=$((UNHEALTHY_CONTAINERS + 1))
        return 1
    fi

    # Perform health check based on type
    case "$check_type" in
        "http")
            # HTTP endpoint check
            if curl -f -s -o /dev/null -w "%{http_code}" "$check_target" | grep -q "200"; then
                echo -e "${GREEN}✓${NC} $container_name: Healthy (HTTP check passed)"
                HEALTHY_CONTAINERS=$((HEALTHY_CONTAINERS + 1))
                return 0
            else
                echo -e "${RED}✗${NC} $container_name: Unhealthy (HTTP check failed)"
                UNHEALTHY_CONTAINERS=$((UNHEALTHY_CONTAINERS + 1))
                return 1
            fi
            ;;
        "tcp")
            # TCP port check
            local host="${check_target%:*}"
            local port="${check_target#*:}"
            if nc -z -w 2 "$host" "$port" 2>/dev/null; then
                echo -e "${GREEN}✓${NC} $container_name: Healthy (TCP port $port open)"
                HEALTHY_CONTAINERS=$((HEALTHY_CONTAINERS + 1))
                return 0
            else
                echo -e "${RED}✗${NC} $container_name: Unhealthy (TCP port $port closed)"
                UNHEALTHY_CONTAINERS=$((UNHEALTHY_CONTAINERS + 1))
                return 1
            fi
            ;;
        "docker")
            # Check Docker's built-in health status
            local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
            case "$health_status" in
                "healthy")
                    echo -e "${GREEN}✓${NC} $container_name: Healthy (Docker health check)"
                    HEALTHY_CONTAINERS=$((HEALTHY_CONTAINERS + 1))
                    return 0
                    ;;
                "unhealthy")
                    echo -e "${RED}✗${NC} $container_name: Unhealthy (Docker health check)"
                    UNHEALTHY_CONTAINERS=$((UNHEALTHY_CONTAINERS + 1))
                    return 1
                    ;;
                "starting")
                    echo -e "${YELLOW}⟳${NC} $container_name: Starting (Docker health check)"
                    UNKNOWN_CONTAINERS=$((UNKNOWN_CONTAINERS + 1))
                    return 2
                    ;;
                *)
                    # No health check configured, check if running
                    echo -e "${YELLOW}?${NC} $container_name: No health check configured (container running)"
                    UNKNOWN_CONTAINERS=$((UNKNOWN_CONTAINERS + 1))
                    return 2
                    ;;
            esac
            ;;
        *)
            echo -e "${YELLOW}?${NC} $container_name: Unknown check type"
            UNKNOWN_CONTAINERS=$((UNKNOWN_CONTAINERS + 1))
            return 2
            ;;
    esac
}

# Function to check PostgREST admin server health
check_postgrest_health() {
    local container_name="supabase_rest_2025slideheroes-db"
    TOTAL_CONTAINERS=$((TOTAL_CONTAINERS + 1))

    if ! docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
        echo -e "${RED}✗${NC} $container_name: Container not running"
        UNHEALTHY_CONTAINERS=$((UNHEALTHY_CONTAINERS + 1))
        return 1
    fi

    # Since PostgREST container doesn't have shell tools, we check if container is running
    # and the process is alive
    local container_state=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null)
    if [ "$container_state" = "running" ]; then
        # Check if the PostgREST process is running
        if docker top "$container_name" | grep -q "postgrest"; then
            echo -e "${GREEN}✓${NC} $container_name: Healthy (PostgREST process running)"
            HEALTHY_CONTAINERS=$((HEALTHY_CONTAINERS + 1))
            return 0
        else
            echo -e "${RED}✗${NC} $container_name: Unhealthy (PostgREST process not found)"
            UNHEALTHY_CONTAINERS=$((UNHEALTHY_CONTAINERS + 1))
            return 1
        fi
    else
        echo -e "${RED}✗${NC} $container_name: Unhealthy (Container not running)"
        UNHEALTHY_CONTAINERS=$((UNHEALTHY_CONTAINERS + 1))
        return 1
    fi
}

# Function to check Edge Runtime health
check_edge_runtime_health() {
    local container_name="supabase_edge_runtime_2025slideheroes-db"
    TOTAL_CONTAINERS=$((TOTAL_CONTAINERS + 1))

    if ! docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
        echo -e "${RED}✗${NC} $container_name: Container not running"
        UNHEALTHY_CONTAINERS=$((UNHEALTHY_CONTAINERS + 1))
        return 1
    fi

    # Check if container is running and process is alive
    local container_state=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null)
    if [ "$container_state" = "running" ]; then
        # Check if the Deno process is running
        if docker top "$container_name" | grep -q "deno"; then
            echo -e "${GREEN}✓${NC} $container_name: Healthy (Deno process running)"
            HEALTHY_CONTAINERS=$((HEALTHY_CONTAINERS + 1))
            return 0
        else
            echo -e "${RED}✗${NC} $container_name: Unhealthy (Deno process not found)"
            UNHEALTHY_CONTAINERS=$((UNHEALTHY_CONTAINERS + 1))
            return 1
        fi
    else
        echo -e "${RED}✗${NC} $container_name: Unhealthy (Container not running)"
        UNHEALTHY_CONTAINERS=$((UNHEALTHY_CONTAINERS + 1))
        return 1
    fi
}

# Main health check execution
echo "========================================="
echo "   Supabase Container Health Check"
echo "========================================="
echo ""

# Check Supabase containers with built-in health checks
echo "Checking Supabase containers with Docker health checks:"
check_container_health "supabase_db_2025slideheroes-db" "docker" ""
check_container_health "supabase_auth_2025slideheroes-db" "docker" ""
check_container_health "supabase_storage_2025slideheroes-db" "docker" ""
check_container_health "supabase_realtime_2025slideheroes-db" "docker" ""
check_container_health "supabase_kong_2025slideheroes-db" "docker" ""
check_container_health "supabase_studio_2025slideheroes-db" "docker" ""
check_container_health "supabase_pg_meta_2025slideheroes-db" "docker" ""
check_container_health "supabase_inbucket_2025slideheroes-db" "docker" ""
check_container_health "supabase_analytics_2025slideheroes-db" "docker" ""
check_container_health "supabase_vector_2025slideheroes-db" "docker" ""

echo ""
echo "Checking containers without Docker health checks:"
# Check PostgREST (special check for admin server)
check_postgrest_health

# Check Edge Runtime (process check)
check_edge_runtime_health

echo ""
echo "Checking application containers:"
# Check test containers
check_container_health "slideheroes-app-test" "docker" ""
check_container_health "slideheroes-payload-test" "docker" ""

echo ""
echo "Checking other containers:"
# Check ccmp-dashboard
check_container_health "ccmp-dashboard" "docker" ""

# Check docs-mcp-server
check_container_health "docs-mcp-server" "docker" ""

echo ""
echo "========================================="
echo "Health Check Summary:"
echo "========================================="
echo "Total containers checked: $TOTAL_CONTAINERS"
echo -e "${GREEN}Healthy:${NC} $HEALTHY_CONTAINERS"
echo -e "${RED}Unhealthy:${NC} $UNHEALTHY_CONTAINERS"
echo -e "${YELLOW}Unknown/Starting:${NC} $UNKNOWN_CONTAINERS"

# Calculate percentage
if [ "$TOTAL_CONTAINERS" -gt 0 ]; then
    HEALTH_PERCENTAGE=$(( (HEALTHY_CONTAINERS * 100) / TOTAL_CONTAINERS ))
    echo ""
    echo "Health percentage: ${HEALTH_PERCENTAGE}% ($HEALTHY_CONTAINERS/$TOTAL_CONTAINERS)"
fi

# Exit code based on health status
if [ "$UNHEALTHY_CONTAINERS" -gt 0 ]; then
    exit 1
else
    exit 0
fi