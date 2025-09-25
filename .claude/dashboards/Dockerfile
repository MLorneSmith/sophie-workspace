FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install pnpm and dependencies
RUN npm install -g pnpm@9
RUN pnpm install

# Copy source files
COPY . .

# Generate dashboards (if tracking data exists)
RUN pnpm run generate || echo "No tracking data, skipping generation"

# Expose port
EXPOSE 8080

# Start the server
CMD ["pnpm", "run", "serve"]