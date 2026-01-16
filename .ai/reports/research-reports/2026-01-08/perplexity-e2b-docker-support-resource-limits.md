# Perplexity Research: E2B Docker Support and Resource Limits

**Date**: 2026-01-08
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched E2B sandbox capabilities regarding Docker support, nested virtualization, resource limits, and feasibility of running Supabase local development stack inside E2B sandboxes.

## Key Findings

### 1. Docker Support Inside E2B Sandboxes

**Short Answer: NO - E2B does not support running arbitrary Docker containers inside sandboxes.**

E2B uses Docker only as a **build-time mechanism** for creating sandbox templates:
- You write an `e2b.Dockerfile` and build it with the E2B CLI
- E2B extracts the container's filesystem and converts it into a **Firecracker microVM** image
- The runtime environment is a VM, NOT a container with a Docker daemon

**What IS supported:**
- **MCP tools via Docker MCP Gateway**: E2B sandboxes can access Docker's MCP Catalog (200+ tools from publishers like GitHub, Notion, Stripe)
- These MCP containers are **managed by E2B/Docker**, not user-controlled
- Custom environments via `e2b.Dockerfile` at build-time

**What is NOT supported:**
- Installing and running a Docker daemon inside a sandbox
- Using `docker run`, `docker build`, or `docker compose` from inside the sandbox
- Docker-in-Docker (DinD) patterns
- Mounting the Docker socket
- Nested privileged containers

**Why:** E2B's security model is designed for running untrusted code in isolated sandboxes. Exposing a nested, privileged container runtime would weaken isolation and is intentionally not offered.

### 2. Resource Limits

#### CPU
| vCPUs | Plan | Cost |
|-------|------|------|
| 1 | Pro | $0.000014/s |
| 2 (default) | Hobby/Pro | $0.000028/s |
| 3-8 | Pro | $0.000014/s per vCPU |

- **Default**: 2 vCPUs
- **Maximum**: 8 vCPUs (documented), Firecracker supports up to 32 theoretically
- **Minimum**: 1 vCPU

#### RAM
| RAM | Plan | Cost |
|-----|------|------|
| 512 MiB (default) | Hobby/Pro | Free |
| 128 MiB - 8,192 MiB | Pro | $0.0000045/GiB/s |

- **Default**: 512 MiB
- **Maximum**: 8 GiB (Pro plan)
- **Minimum**: 128 MiB
- Must specify even values between 128 MiB and 8,192 MiB

#### Storage
| Storage | Plan |
|---------|------|
| 1 GiB | Hobby (Free) |
| 5 GiB | Pro (Free) |
| 10 GiB | Hobby (total disk) |
| 20 GiB | Pro (total disk) |

#### Session Duration
- **Maximum**: Up to 24 hours (Pro plan)
- Supports both quick executions (seconds) and long-running sessions (hours)

#### Concurrency
- **Hobby**: 20 concurrent sandboxes
- **Pro**: 100 concurrent (default), scalable to 1,100 with add-ons
- **Enterprise**: 1,100+ (custom)

### 3. Configuration for Custom Resources

To customize CPU and RAM, use the E2B CLI when building templates:

```bash
e2b template build --cpu-count 8 --memory-mb 4096
```

This gives your sandbox 8 vCPUs and 4 GiB of RAM.

### 4. Docker Compose / Multi-Container Support

**Not Supported.** E2B sandboxes:
- Are single micro-VMs, not Docker hosts
- Cannot run `docker-compose up` for multi-container applications
- Do not expose Docker daemon or socket

### 5. Running Supabase Local Development Stack

**Not Currently Supported** as a turnkey workflow.

The standard Supabase local dev flow requires:
- Docker daemon
- `docker compose` to start multiple containers (Postgres, Studio, auth, edge functions, etc.)

E2B cannot provide this because:
- No Docker daemon inside sandboxes
- No `docker compose` support
- No nested container orchestration

#### Possible Workarounds

1. **External Supabase + E2B Connection**
   - Run Supabase locally or in your own infrastructure (with Docker)
   - In E2B, use environment variables to connect to that external database/API
   - E2B handles app/agent code; Supabase runs where Docker is fully supported

2. **Custom Single-VM Stack via E2B Template**
   - In `e2b.Dockerfile`, install Postgres and services as native processes (not containers)
   - Build and push as an E2B template
   - Use `Sandbox.create({ template: 'your-template-id' })`
   - This won't match official Supabase multi-container architecture but can approximate a dev environment

3. **Use Supabase Cloud Instead**
   - Connect E2B sandboxes to Supabase cloud projects
   - No local stack needed; database runs in Supabase's managed infrastructure

### 6. Technical Architecture Notes

E2B uses **Firecracker microVMs** (AWS's open-source virtualization):
- **Boot time**: ~125-180ms (vs seconds for traditional VMs)
- **Memory overhead**: ~3-5 MB per microVM (vs ~131 MB for QEMU)
- **Security**: Hardware-level isolation via KVM, separate kernel per sandbox
- **Jailer process**: Additional security with dropped privileges, cgroups, namespaces

## Sources & Citations

1. E2B Blog - "You Can Now Customize CPU and RAM for Your Sandbox"
   - https://e2b.dev/blog/customize-sandbox-compute

2. E2B Documentation - Sandbox Compute (Legacy)
   - https://e2b.dev/docs/legacy/sandbox/compute

3. E2B Documentation - Custom Sandbox Template
   - https://e2b.dev/docs/sandbox-template

4. Docker Documentation - E2B Sandboxes
   - https://docs.docker.com/ai/mcp-catalog-and-toolkit/e2b-sandboxes/

5. Dwarves Memo - E2B Breakdown
   - https://memo.d.foundation/breakdown/e2b

6. Towards AI - E2B AI Sandboxes Features
   - https://towardsai.net/p/machine-learning/e2b-ai-sandboxes-features-applications-real-world-impact

7. GitHub - Firecracker MicroVM Discussion on Max Size
   - https://github.com/firecracker-microvm/firecracker/discussions/3092

8. E2B Changelog
   - https://e2b-changelog.framer.website

## Key Takeaways

1. **No Docker-in-Docker**: E2B sandboxes are microVMs, not container hosts. You cannot run Docker inside them.

2. **Resource Limits**: Up to 8 vCPUs, 8 GiB RAM, 20 GiB disk (Pro). Configurable via CLI at template build time.

3. **Supabase Incompatibility**: Running the full Supabase local stack inside E2B is not supported. Use external Supabase or build a custom single-VM template with native services.

4. **MCP Tools Only**: Docker containers in E2B are limited to Docker's MCP Catalog tools, managed by E2B/Docker, not user-controlled.

5. **Security by Design**: The lack of Docker support is intentional - exposing nested container runtimes would weaken E2B's security model.

## Implications for SlideHeroes

For the SlideHeroes project using E2B sandboxes:

1. **Cannot run Supabase CLI `supabase start`** inside E2B sandboxes (requires Docker)

2. **Alternatives**:
   - Connect E2B sandboxes to a persistent Supabase project (cloud or self-hosted)
   - Use environment variables to inject Supabase credentials into sandboxes
   - Run database migrations from outside E2B, only run app code inside

3. **Current approach** (injecting credentials at runtime) is the correct pattern for E2B

## Related Searches

- E2B self-hosting on AWS/GCP
- Supabase cloud connection from E2B
- Running PostgreSQL natively in E2B template (without Docker)
