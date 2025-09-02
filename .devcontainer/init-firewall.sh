#!/bin/bash
set -e

# Claude Code Firewall Initialization Script
# This script sets up network security rules for the development container
# Based on: https://github.com/anthropics/claude-code/.devcontainer/init-firewall.sh

echo "🔒 Initializing Claude Code firewall for secure development environment..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Running firewall initialization with sudo..."
    exec sudo "$0" "$@"
fi

# Clear existing rules
echo "Clearing existing firewall rules..."
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

# Create or flush the allowed IPs set
ipset create allowed_ips hash:net -exist
ipset flush allowed_ips

# Function to add IP range to allowed set
add_ip_range() {
    local ip_range=$1
    local description=$2
    
    # Validate IP range format
    if [[ $ip_range =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/[0-9]{1,2}$ ]]; then
        ipset add allowed_ips $ip_range -exist
        echo "  ✓ Added $description: $ip_range"
    else
        echo "  ⚠ Invalid IP range for $description: $ip_range"
    fi
}

# Function to resolve and add domain IPs
add_domain_ips() {
    local domain=$1
    local description=$2
    
    # Resolve domain to IPs
    local ips=$(dig +short $domain 2>/dev/null | grep -E '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$')
    
    if [ -n "$ips" ]; then
        for ip in $ips; do
            ipset add allowed_ips $ip/32 -exist
            echo "  ✓ Added $description ($domain): $ip"
        done
    else
        echo "  ⚠ Could not resolve $description: $domain"
    fi
}

echo "Adding allowed IP ranges and domains..."

# Essential local networks
add_ip_range "127.0.0.0/8" "Localhost"
add_ip_range "10.0.0.0/8" "Private network (10.x)"
add_ip_range "172.16.0.0/12" "Private network (172.x)"
add_ip_range "192.168.0.0/16" "Private network (192.168.x)"

# Docker networks (important for Docker-in-Docker)
add_ip_range "172.17.0.0/16" "Docker bridge network"
add_ip_range "172.18.0.0/16" "Docker custom networks"

# GitHub IP ranges (for git operations)
echo "Fetching GitHub IP ranges..."
GITHUB_IPS=$(curl -s https://api.github.com/meta | jq -r '.git[],.hooks[],.web[],.api[],.pages[]' 2>/dev/null | sort -u)
for ip in $GITHUB_IPS; do
    add_ip_range "$ip" "GitHub"
done

# NPM registries
add_domain_ips "registry.npmjs.org" "NPM Registry"
add_domain_ips "registry.yarnpkg.com" "Yarn Registry"
add_domain_ips "registry.npmjs.com" "NPM Registry (alt)"

# Package manager registries
add_domain_ips "nodejs.org" "Node.js"
add_domain_ips "deb.nodesource.com" "Node.js packages"
add_domain_ips "dl.yarnpkg.com" "Yarn downloads"

# Anthropic domains (for Claude Code)
add_domain_ips "anthropic.com" "Anthropic"
add_domain_ips "api.anthropic.com" "Anthropic API"
add_domain_ips "console.anthropic.com" "Anthropic Console"
add_domain_ips "claude.ai" "Claude AI"

# Microsoft/VS Code domains
add_domain_ips "update.code.visualstudio.com" "VS Code Updates"
add_domain_ips "marketplace.visualstudio.com" "VS Code Marketplace"
add_domain_ips "vscode.blob.core.windows.net" "VS Code Extensions"
add_domain_ips "dc.services.visualstudio.com" "VS Code Telemetry"

# Development tools
add_domain_ips "raw.githubusercontent.com" "GitHub Raw Content"
add_domain_ips "api.github.com" "GitHub API"
add_domain_ips "codeload.github.com" "GitHub Downloads"
add_domain_ips "objects.githubusercontent.com" "GitHub Objects"
add_domain_ips "ghcr.io" "GitHub Container Registry"
add_domain_ips "pkg-containers.githubusercontent.com" "GitHub Packages"

# SlideHeroes specific domains
add_domain_ips "supabase.com" "Supabase"
add_domain_ips "app.supabase.com" "Supabase Dashboard"
add_domain_ips "api.supabase.com" "Supabase API"
add_domain_ips "vercel.com" "Vercel"
add_domain_ips "vercel.app" "Vercel Apps"
add_domain_ips "stripe.com" "Stripe"
add_domain_ips "api.stripe.com" "Stripe API"
add_domain_ips "portkey.ai" "Portkey AI"
add_domain_ips "api.portkey.ai" "Portkey API"
add_domain_ips "openai.com" "OpenAI"
add_domain_ips "api.openai.com" "OpenAI API"

# Docker Hub (for Docker-in-Docker)
add_domain_ips "hub.docker.com" "Docker Hub"
add_domain_ips "registry-1.docker.io" "Docker Registry"
add_domain_ips "auth.docker.io" "Docker Auth"
add_domain_ips "production.cloudflare.docker.com" "Docker CDN"

# Package CDNs
add_domain_ips "unpkg.com" "unpkg CDN"
add_domain_ips "cdn.jsdelivr.net" "jsDelivr CDN"
add_domain_ips "cdnjs.cloudflare.com" "cdnjs"

# Linux package repositories
add_domain_ips "deb.debian.org" "Debian packages"
add_domain_ips "security.debian.org" "Debian security"
add_domain_ips "archive.ubuntu.com" "Ubuntu packages"
add_domain_ips "security.ubuntu.com" "Ubuntu security"

# DNS servers (required for resolution)
add_ip_range "8.8.8.8/32" "Google DNS"
add_ip_range "8.8.4.4/32" "Google DNS"
add_ip_range "1.1.1.1/32" "Cloudflare DNS"
add_ip_range "1.0.0.1/32" "Cloudflare DNS"

echo "Setting up iptables rules..."

# Set default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# Allow all traffic on loopback
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established and related connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow DNS (required for domain resolution)
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT

# Allow DHCP (for network configuration)
iptables -A OUTPUT -p udp --dport 67:68 -j ACCEPT

# Allow SSH (for git operations)
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS to allowed IPs only
iptables -A OUTPUT -p tcp --dport 80 -m set --match-set allowed_ips dst -j ACCEPT
iptables -A OUTPUT -p tcp --dport 443 -m set --match-set allowed_ips dst -j ACCEPT

# Allow common development ports to localhost (for local services)
for port in 3000 3001 4000 5000 5173 5174 6006 8000 8080 8081 9000 9229; do
    iptables -A OUTPUT -p tcp --dport $port -d 127.0.0.1 -j ACCEPT
    iptables -A INPUT -p tcp --sport $port -s 127.0.0.1 -j ACCEPT
done

# Allow Supabase ports to localhost
for port in 54321 54322 54323 54324 54325 54326 54327 54328 54329; do
    iptables -A OUTPUT -p tcp --dport $port -d 127.0.0.1 -j ACCEPT
    iptables -A INPUT -p tcp --sport $port -s 127.0.0.1 -j ACCEPT
done

# Allow Docker communication (for Docker-in-Docker)
iptables -A OUTPUT -o docker0 -j ACCEPT
iptables -A INPUT -i docker0 -j ACCEPT

# Log dropped packets (for debugging)
iptables -A INPUT -m limit --limit 2/min -j LOG --log-prefix "iptables-dropped-input: " --log-level 4
iptables -A OUTPUT -m limit --limit 2/min -j LOG --log-prefix "iptables-dropped-output: " --log-level 4

# Save current rules
echo "Saving firewall rules..."
if command -v iptables-save &> /dev/null; then
    iptables-save > /etc/iptables.rules
fi

echo "Testing connectivity..."

# Test DNS
if nslookup google.com > /dev/null 2>&1; then
    echo "  ✓ DNS resolution working"
else
    echo "  ⚠ DNS resolution may not be working"
fi

# Test GitHub
if curl -s -o /dev/null -w "%{http_code}" https://api.github.com | grep -q "200"; then
    echo "  ✓ GitHub API accessible"
else
    echo "  ⚠ GitHub API may not be accessible"
fi

# Test NPM
if curl -s -o /dev/null -w "%{http_code}" https://registry.npmjs.org | grep -q "200"; then
    echo "  ✓ NPM registry accessible"
else
    echo "  ⚠ NPM registry may not be accessible"
fi

echo ""
echo "✅ Claude Code firewall initialization complete!"
echo ""
echo "📊 Firewall Status:"
echo "  - Default policy: DROP (whitelist mode)"
echo "  - Allowed destinations: $(ipset list allowed_ips | grep -c '^[0-9]' || echo '0') IP ranges"
echo "  - Protected ports: All except 80/443 to allowed IPs"
echo ""
echo "⚠️  Note: This firewall provides network security but does not prevent all"
echo "    potential security risks. Always review code and dependencies carefully."
echo "