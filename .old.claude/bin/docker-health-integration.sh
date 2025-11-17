#!/bin/bash

# Docker Health Integration Script
# Integrates custom health checks with the docker-health-wrapper monitoring system

# Function to get health status for containers without native health checks
get_external_health_status() {
    local container_name="$1"

    case "$container_name" in
        "supabase_rest_2025slideheroes-db")
            # Check if PostgREST process is running
            if docker top "$container_name" 2>/dev/null | grep -q "postgrest"; then
                echo "healthy"
            else
                echo "unhealthy"
            fi
            ;;
        "supabase_edge_runtime_2025slideheroes-db")
            # Check if Deno process is running
            if docker top "$container_name" 2>/dev/null | grep -q "deno"; then
                echo "healthy"
            else
                echo "unhealthy"
            fi
            ;;
        *)
            # Unknown container, return unknown status
            echo "unknown"
            ;;
    esac
}

# Main function to output consolidated health status
output_health_status() {
    local total=0
    local healthy=0
    local unhealthy=0
    local unknown=0

    # Get all running containers
    for container in $(docker ps --format "{{.Names}}"); do
        total=$((total + 1))

        # First check if container has native health check
        health_status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container" 2>/dev/null)

        if [ "$health_status" = "none" ]; then
            # No native health check, use external check
            health_status=$(get_external_health_status "$container")
        fi

        case "$health_status" in
            "healthy")
                healthy=$((healthy + 1))
                echo "$container: healthy"
                ;;
            "unhealthy")
                unhealthy=$((unhealthy + 1))
                echo "$container: unhealthy"
                ;;
            "starting")
                unknown=$((unknown + 1))
                echo "$container: starting"
                ;;
            *)
                unknown=$((unknown + 1))
                echo "$container: unknown"
                ;;
        esac
    done

    echo ""
    echo "=== Summary ==="
    echo "Total: $total"
    echo "Healthy: $healthy"
    echo "Unhealthy: $unhealthy"
    echo "Unknown/Starting: $unknown"
    echo "Health Percentage: $(( (healthy * 100) / total ))%"
}

# Check command line arguments
case "${1:-status}" in
    "status")
        output_health_status
        ;;
    "json")
        # Output JSON format for integration
        echo "{"
        echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
        echo "  \"containers\": ["

        first=true
        for container in $(docker ps --format "{{.Names}}"); do
            if [ "$first" = true ]; then
                first=false
            else
                echo ","
            fi

            health_status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container" 2>/dev/null)
            if [ "$health_status" = "none" ]; then
                health_status=$(get_external_health_status "$container")
            fi

            echo -n "    {\"name\": \"$container\", \"status\": \"$health_status\"}"
        done

        echo ""
        echo "  ]"
        echo "}"
        ;;
    "check")
        # Check a specific container
        if [ -z "$2" ]; then
            echo "Usage: $0 check <container_name>"
            exit 1
        fi

        health_status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$2" 2>/dev/null)
        if [ "$health_status" = "none" ]; then
            health_status=$(get_external_health_status "$2")
        fi

        echo "$health_status"
        ;;
    *)
        echo "Usage: $0 [status|json|check <container>]"
        echo ""
        echo "Commands:"
        echo "  status - Show health status of all containers (default)"
        echo "  json   - Output status in JSON format"
        echo "  check  - Check health of a specific container"
        exit 1
        ;;
esac