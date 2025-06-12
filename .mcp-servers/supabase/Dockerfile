# Supabase MCP Server Container
# Containerizes @supabase/mcp-server-supabase to avoid npx download delays
FROM node:22-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Enable pnpm and install the MCP server globally
RUN npm install -g @supabase/mcp-server-supabase@latest

# Create non-root user for security
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001

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