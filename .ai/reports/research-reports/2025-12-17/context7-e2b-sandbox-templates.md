# Context7 Research: E2B Sandbox Templates and Configuration

**Date**: 2025-12-17
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b

## Query Summary

Researched E2B documentation covering:
1. Custom sandbox templates with pre-cloned repositories
2. Environment variables configuration
3. Sandbox initialization and validation best practices
4. Authentication configuration in sandbox templates
5. Sandbox lifecycle management

## Findings

### 1. Custom Sandbox Templates with Pre-cloned Repositories

E2B templates are built from Dockerfiles using the e2b template build CLI command.

Key Approach: Clone repositories during the Docker build phase.

Build Command with Arguments:
e2b template build -n my-template-name -c "/path/to/startup-script.sh" --ready-cmd "test -f /home/user/repo/.git/config" --build-arg GITHUB_TOKEN=ghp_xxx --cpu-count 2 --memory-mb 1024

### 2. Environment Variables Configuration

E2B supports three levels of environment variables:

A. Global Environment Variables (Sandbox Creation) - passed via envs parameter
B. Per-Command Environment Variables - override for specific commands
C. Default E2B Environment Variables - available at /run/e2b/

### 3. Sandbox Initialization and Validation Best Practices

Start Command (-c or --cmd): Runs when sandbox is spawned
Ready Command (--ready-cmd): Must exit 0 for template to be considered ready

### 4. Authentication in Sandbox Templates

E2B API Key can be explicit or from E2B_API_KEY environment variable
GitHub Token for Private Repos passed via envs parameter at runtime

### 5. Sandbox Lifecycle Management

Default timeout: 300 seconds (5 minutes)
Maximum: 24 hours (86,400 seconds) for Pro users
Maximum: 1 hour (3,600 seconds) for Hobby users

## Key Takeaways

1. Pre-clone repositories in Dockerfile for fastest sandbox startup
2. Use build args for secrets during build and environment variables for runtime secrets
3. Always implement a ready command to validate sandbox is fully initialized
4. Pass GitHub tokens at runtime via envs parameter
5. Sandbox timeout must be explicitly set if you need more than 5 minutes
6. E2B_API_KEY environment variable is the recommended way to authenticate

## Sources

- E2B SDK Documentation via Context7 (e2b-dev/e2b)
