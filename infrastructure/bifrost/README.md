# Bifrost Gateway Infrastructure

This directory contains the infrastructure configuration for deploying Bifrost AI
Gateway on EC2 with Cloudflare Tunnel access.

## Prerequisites

- Docker and Docker Compose installed on EC2
- Cloudflare account with a domain
- OpenAI API key
- Anthropic API key

## Quick Start

### 1. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and add your API keys
```

### 2. Start Bifrost (Local)

```bash
docker-compose up -d
```

### 3. Verify Local Deployment

```bash
./scripts/verify-local.sh
```

### 4. Set Up Cloudflare Tunnel

```bash
# Install cloudflared on the EC2 instance
# Create tunnel
cloudflared tunnel create bifrost-gateway

# Add DNS record
cloudflared tunnel route dns bifrost-gateway bifrost.slideheroes.com

# Run tunnel
cloudflared tunnel --config cloudflared.yml run bifrost-gateway
```

Or use Docker Compose for the tunnel:

```bash
docker-compose -f docker-compose.tunnel.yml up -d
```

### 5. Configure Cloudflare Access

1. Go to Cloudflare Dashboard > Access
2. Create an Access Policy for `bifrost.slideheroes.com`
3. Configure Service Token authentication
4. Add your Vercel deployment as an allowed origin

### 6. Verify External Connectivity

```bash
./scripts/verify-external.sh
```

## File Structure

```text
infrastructure/bifrost/
├── docker-compose.yml           # Main Bifrost service
├── docker-compose.tunnel.yml   # Cloudflare Tunnel service
├── cloudflared.yml             # Tunnel configuration
├── .env.example                # Environment template
├── config/
│   └── config.json             # Provider configuration
└── scripts/
    ├── verify-local.sh         # Local verification
    └── verifyExternal.sh       # External verification
```

## Provider Routing

- OpenAI requests: Use model prefix `openai/` (e.g., `openai/gpt-4o-mini`)
- Anthropic requests: Use model prefix `anthropic/` (e.g., `anthropic/claude-3-5-sonnet-20241022`)

## API Endpoint

- Local: `http://localhost:8080/v1/chat/completions`
- External: `https://bifrost.slideheroes.com/v1/chat/completions`
