FROM node:18-alpine

WORKDIR /app

# Install http-server globally
RUN npm install -g http-server

# Copy all files
COPY . .

# Install local dependencies
RUN npm install

# Generate dashboards (if tracking data exists)
RUN npm run generate || echo "No tracking data, skipping generation"

# Expose port
EXPOSE 8080

# Start the server directly
CMD ["http-server", "output", "-p", "8080", "-a", "0.0.0.0"]