# Official Perplexity MCP Server Container
# Built from ppl-ai/modelcontextprotocol repository
FROM node:22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

# Clone the official repository
RUN git clone https://github.com/ppl-ai/modelcontextprotocol.git /tmp/modelcontextprotocol

# Build the perplexity-ask server
WORKDIR /tmp/modelcontextprotocol/perplexity-ask
RUN npm install && npm run build

# Production stage
FROM node:22-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy built server from builder stage
COPY --from=builder /tmp/modelcontextprotocol/perplexity-ask/package*.json ./
COPY --from=builder /tmp/modelcontextprotocol/perplexity-ask/dist ./dist
COPY --from=builder /tmp/modelcontextprotocol/perplexity-ask/node_modules ./node_modules

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