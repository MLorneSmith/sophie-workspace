# Perplexity MCP Server Container
# Containerizes server-perplexity-ask to avoid npx download delays
FROM node:22-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Install the MCP server globally with npm (simpler for containers)
RUN npm install -g server-perplexity-ask

# Copy the proxy server script
COPY proxy-server.js .

# Make the script executable
RUN chmod +x proxy-server.js

# Create non-root user for security
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 && \
    chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser

# Expose port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the proxy server
CMD ["node", "proxy-server.js"]