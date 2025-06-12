# Browser Tools MCP Server Container
# Containerizes @agentdeskai/browser-tools-mcp with browser automation support
FROM node:22-alpine AS base

# Install dependencies for browser automation and health checks
RUN apk add --no-cache \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    xvfb

# Set working directory
WORKDIR /app

# Enable pnpm and install the MCP server globally
RUN npm install -g @agentdeskai/browser-tools-mcp@latest

# Create non-root user for security
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001

# Set browser environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Switch to non-root user
USER mcpuser

# Expose port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Copy proxy server
COPY proxy-server.js /app/proxy-server.js

# Start the proxy server (which will start the MCP server)
CMD ["node", "/app/proxy-server.js"]