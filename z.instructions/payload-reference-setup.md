# Payload CMS Website Template Reference Setup

This document outlines the process of setting up a reference Payload CMS website template to help debug issues with our existing Payload CMS implementation.

## Setup Process

1. Created a new directory at `d:\slideheroes\app\repos\payload-website-reference`
2. Set up Docker containers for Payload CMS and PostgreSQL using docker-compose
3. Fixed database connection issues by updating the DATABASE_URI to use the service name instead of localhost
4. Successfully accessed the Payload CMS admin panel
5. Created an admin user with the following credentials:
   - Email: <michael@slideheroes.com>
   - Password: aiesec1992
   - Name: Michael Smith

## Key Configuration Files

### docker-compose.yml

```yaml
services:
  payload:
    image: node:18-alpine
    ports:
      - '3002:3001'
    volumes:
      - .:/home/node/app
      - node_modules:/home/node/app/node_modules
    working_dir: /home/node/app/
    command: sh -c "corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm dev"
    depends_on:
      - postgres_reference
    env_file:
      - .env

  postgres_reference:
    image: postgres:15
    ports:
      - '54345:5432'
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: payload_reference
    volumes:
      - postgres_data_reference:/var/lib/postgresql/data

volumes:
  postgres_data_reference:
  node_modules:
```

### .env

```
# Added by Payload
DATABASE_URI=postgres://postgres:postgres@postgres_reference:5432/payload_reference
PAYLOAD_SECRET=96192f7c967d6e4a0c2d68e1
NEXT_PUBLIC_SERVER_URL=http://localhost:3002
CRON_SECRET=YOUR_CRON_SECRET_HERE
PREVIEW_SECRET=YOUR_SECRET_HERE
```

## Key Learnings

1. **Database Connection in Docker Environment**:

   - When using Docker, services should connect to each other using their service names, not localhost or 127.0.0.1.
   - The correct format for the DATABASE_URI is: `postgres://postgres:postgres@postgres_reference:5432/payload_reference`
   - Using 127.0.0.1 or localhost will cause connection errors because each container has its own network namespace.

2. **Port Mapping**:

   - The docker-compose.yml file maps port 3001 in the container to port 3002 on the host.
   - This means the server runs on port 3001 inside the container, but you access it via port 3002 on your local machine.

3. **Collections Structure**:

   - The reference template includes the following collections:
     - Pages
     - Posts
     - Media
     - Categories
     - Users
     - Redirects

4. **Payload Configuration**:

   - The payload.config.ts file uses the PostgreSQL adapter with the connection string from the environment variables.
   - The admin panel is configured with custom components for BeforeLogin and BeforeDashboard.
   - The editor uses the defaultLexical configuration.

5. **Authentication**:
   - The Users collection has auth: true, which enables authentication.
   - The first user created becomes the admin user.

## Troubleshooting Tips

1. **Database Connection Issues**:

   - Check the DATABASE_URI in the .env file to ensure it's using the service name, not localhost.
   - Verify that the PostgreSQL container is running and accessible.

2. **Port Conflicts**:

   - If you encounter port conflicts, you can change the port mapping in the docker-compose.yml file.

3. **Container Communication**:
   - Use `docker exec -it [container_name] netstat -tulpn` to check if the server is listening on the correct port inside the container.

## Accessing the Reference Setup

To access the admin panel, visit <http://localhost:3002/admin> and log in with the credentials provided above.

This reference setup can be used to compare with our existing Payload CMS implementation to identify and debug issues. You can examine the configuration files, collection structures, and database setup to understand how a properly functioning Payload CMS should be configured.
