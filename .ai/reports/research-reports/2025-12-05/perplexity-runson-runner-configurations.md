# Perplexity Research: RunsOn GitHub Actions Runner Configurations

**Date**: 2025-12-05
**Agent**: perplexity-expert
**Search Type**: Search API (domain-filtered)

## Query Summary

Researched RunsOn (runs-on.com) to find:
1. Available runner sizes/types (CPU, RAM options)
2. Configuration syntax for larger runners (8cpu, 16cpu options)
3. Best practices for speeding up CI workflows
4. Pricing comparison with GitHub-hosted runners

## Findings

### 1. Runner Configuration Syntax

RunsOn uses a flexible label-based syntax in your workflow files:

**Basic Syntax**:
```yaml
runs-on: "runs-on/runner=<config>"
```

**Configuration Format**:
```yaml
# Basic examples
runs-on: "runs-on/runner=2cpu-linux-x64"    # 2 CPU x64
runs-on: "runs-on/runner=4cpu-linux-x64"    # 4 CPU x64
runs-on: "runs-on/runner=8cpu-linux-x64"    # 8 CPU x64
runs-on: "runs-on/runner=16cpu-linux-x64"   # 16 CPU x64
runs-on: "runs-on/runner=32cpu-linux-x64"   # 32 CPU x64

# ARM64 variants
runs-on: "runs-on/runner=2cpu-linux-arm64"  # 2 CPU ARM64
runs-on: "runs-on/runner=4cpu-linux-arm64"  # 4 CPU ARM64
runs-on: "runs-on/runner=8cpu-linux-arm64"  # 8 CPU ARM64
runs-on: "runs-on/runner=16cpu-linux-arm64" # 16 CPU ARM64
```

**Advanced Configuration (Inline Job Labels)**:
```yaml
# Custom CPU/RAM combinations
runs-on: "runs-on/runner=cpu=8+ram=16"

# Disable spot pricing for critical jobs
runs-on: "runs-on/runner=4cpu-linux-x64+spot=false"

# Specific instance families
runs-on: "runs-on/runner=cpu=4+family=c7,m7"

# Use specific image version
runs-on: "runs-on/runner=4cpu-linux-x64+image=ubuntu24"

# Private subnet with static IP
runs-on: "runs-on/runner=4cpu-linux-x64+private=true"

# Custom volume configuration
runs-on: "runs-on/runner=8cpu-linux-x64+volume=200gb:gp3:500mbs:4000iops"
```

### 2. Available Runner Sizes

#### x64 (Intel/AMD) Runners

| Configuration | CPU | RAM | Disk | RunsOn $/min (spot) | GitHub $/min | Savings |
|--------------|-----|-----|------|---------------------|--------------|---------|
| 2cpu-linux-x64 | 2 | ~8GB | 75GB | ~$0.003 | $0.008 | 62% |
| 4cpu-linux-x64 | 4 | ~16GB | 100GB | ~$0.006 | $0.016 | 62% |
| 8cpu-linux-x64 | 8 | ~32GB | 150GB | ~$0.012 | $0.032 | 62% |
| 16cpu-linux-x64 | 16 | ~64GB | 200GB | ~$0.024 | $0.064 | 62% |
| 32cpu-linux-x64 | 32 | ~128GB | 250GB | ~$0.048 | $0.128 | 62% |
| 64cpu-linux-x64 | 64 | ~256GB | 300GB | ~$0.096 | $0.256 | 62% |
| 96cpu-linux-x64 | 96 | ~384GB | 400GB | ~$0.144 | $0.384 | 62% |

#### ARM64 (Graviton) Runners

| Configuration | CPU | RAM | Disk | RunsOn $/min (spot) | GitHub $/min | Savings |
|--------------|-----|-----|------|---------------------|--------------|---------|
| 2cpu-linux-arm64 | 2 | ~8GB | 75GB | ~$0.002 | $0.005 | 60% |
| 4cpu-linux-arm64 | 4 | ~16GB | 100GB | ~$0.004 | $0.010 | 60% |
| 8cpu-linux-arm64 | 8 | ~32GB | 150GB | ~$0.008 | $0.020 | 60% |
| 16cpu-linux-arm64 | 16 | ~64GB | 200GB | ~$0.016 | $0.040 | 60% |
| 32cpu-linux-arm64 | 32 | ~128GB | 250GB | ~$0.032 | $0.080 | 60% |
| 64cpu-linux-arm64 | 64 | ~256GB | 300GB | ~$0.064 | $0.160 | 60% |

**Notes:**
- Prices are spot instance prices in us-east-1
- Include compute + storage costs
- Actual savings: 7x-15x cheaper than GitHub-hosted runners
- No cost when runners are not in use (ephemeral)
- Networking costs are minimal with proper caching

### 3. Pricing Structure

#### License Fees
- **Standard License**: €300/year (~€25/month)
- **Sponsorship License**: €1500/year (~€125/month) + full source code access
- **Non-Profit/Individual**: Free
- **15-day free trial**: Evaluate before purchasing

#### Total Cost Example (16-core runner)
- **GitHub-hosted**: $2,765/month (for ~720 hours of usage)
- **RunsOn**: €25/month license + ~$294/month AWS compute
- **Monthly savings**: ~$2,446 (88% reduction)

### 4. Repository Configuration File

For advanced customization, create `.github/runs-on.yml`:

```yaml
# Inherit from global config (optional)
_extends: .github-private/.github/runs-on.yml

# Custom runner definitions
runners:
  my-custom-runner:
    family: ["c7", "m7"]  # Instance families
    image: "ubuntu22-full-x64"
    cpu: [4, 8]           # Allowed CPU counts
    ram: [8, 16]          # Allowed RAM (GB)
    volume: "100gb:gp3:500mbs:4000iops"
    spot: true            # Use spot instances
    ssh: true             # Enable SSH access
    private: true         # Launch in private subnet
    extras: ["s3-cache"]  # Additional features
    preinstall: |
      # Script to run before runner starts
      echo "Pre-installation setup"

# Custom images
images:
  my-custom-image:
    ami: ami-xxxxxxxxx
    platform: linux
    arch: x64
    owner: "123456789012"
    preinstall: |
      # Login to private registries
      docker login -u ${{ secrets.DOCKER_USER }} -p ${{ secrets.DOCKER_PASS }}

# Runner pools (hot-standby runners)
pools:
  fast-pool:
    env: production
    runner: my-custom-runner
    timezone: America/New_York
    schedule:
      - name: "Business hours"
        match:
          day: ["monday", "tuesday", "wednesday", "thursday", "friday"]
          time: ["08:00", "18:00"]
        hot: 5        # Keep 5 runners hot
        stopped: 2    # Keep 2 pre-warmed
      - name: "Default"
        hot: 1
        stopped: 0

# SSH admin access
admins:
  - github-username-1
  - github-username-2
```

**Using custom runners in workflows**:
```yaml
jobs:
  build:
    runs-on: "runs-on/runner=my-custom-runner"
    steps:
      - uses: actions/checkout@v4
      # ...
```

### 5. Best Practices for Speeding Up CI Workflows

#### A. Magic Cache (S3-backed actions/cache)

**What it is**: Transparent accelerator for `actions/cache` using S3 backend in your VPC.

**Setup**:
```yaml
jobs:
  build:
    runs-on: "runs-on/runner=4cpu-linux-x64+extras=s3-cache"
    steps:
      - uses: actions/checkout@v4
      
      # Standard actions/cache - automatically uses S3 backend
      - uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
      
      - run: npm install
```

**Benefits**:
- 5x faster than standard GitHub Actions cache
- Unlimited cache size (vs 10GB GitHub limit)
- Compatible with GitHub-hosted runners (fallback)
- No workflow changes required

#### B. Ephemeral Registry (ECR)

**What it is**: Shared ECR registry in your VPC for Docker layer caching with auto-cleanup.

**Setup**:
```yaml
jobs:
  docker-build:
    runs-on: "runs-on/runner=8cpu-linux-x64+extras=ecr"
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          cache-from: type=registry,ref=${{ env.ECR_REGISTRY }}/cache:latest
          cache-to: type=registry,ref=${{ env.ECR_REGISTRY }}/cache:latest,mode=max
```

**Benefits**:
- Block-level Docker layer caching
- Shared across jobs and workflows
- Automatic cleanup of old layers
- Faster than exporting layers to S3

#### C. EBS Snapshots

**What it is**: Block-level disk snapshots for entire `/var/lib/docker` directory.

**Use case**: When you have hundreds of Docker layers, skip export/compression entirely.

**Benefits**:
- Fastest option for large Docker caches
- Skips layer export and compression
- Higher EBS storage costs (trade-off)

#### D. EFS Mounting

**What it is**: Persistent network file system mounted across runners.

**Setup**:
```yaml
jobs:
  build:
    runs-on: "runs-on/runner=4cpu-linux-x64+volume=efs"
    steps:
      - uses: actions/checkout@v4
      
      # Dependencies cached on EFS automatically
      - run: npm install  # ~/.npm on EFS
```

**Use cases**:
- Large datasets that don't compress well
- Git repositories with large history
- Maven/Gradle/pip caches

**Benefits**:
- No compression overhead
- Unlimited size
- Persistent across all jobs

**Trade-offs**:
- More expensive than S3
- Network latency vs local disk

#### E. tmpfs (RAM disk)

**What it is**: Ultra-fast RAM-based file system for temporary data.

**Setup**:
```yaml
jobs:
  build:
    runs-on: "runs-on/runner=8cpu-linux-x64+ram=32"
    steps:
      - uses: actions/checkout@v4
      
      - name: Build on tmpfs
        run: |
          mkdir /tmp/build
          mount -t tmpfs -o size=8G tmpfs /tmp/build
          cd /tmp/build
          # Build commands here
```

**Use cases**:
- Blazing fast temporary builds
- Test databases
- Compilation artifacts

**Trade-offs**:
- Requires sufficient RAM
- Data lost after job completes
- Only for ephemeral data

#### F. Turbo Caching (Monorepos)

**What it is**: Turborepo's remote cache integrated with S3.

**Setup**:
```yaml
jobs:
  build:
    runs-on: "runs-on/runner=8cpu-linux-x64+extras=s3-cache"
    steps:
      - uses: actions/checkout@v4
      
      # Restore Turbo cache
      - name: Cache Turbo
        uses: actions/cache@v4
        with:
          path: |
            ~/.turbo
            .turbo
          key: ${{ runner.os }}-turbo-${{ matrix.task }}-${{ github.head_ref }}
          restore-keys: |
            ${{ runner.os }}-turbo-${{ matrix.task }}-main
            ${{ runner.os }}-turbo-${{ matrix.task }}-
      
      - run: npm install
      - run: npm run build  # Uses Turbo cache
```

**Benefits**:
- 70% faster warm builds
- Task-specific caching
- Branch-aware cache hierarchy

#### G. Instance Type Selection

**Compute-optimized (c7/c6)**: CPU-bound tasks (compilation, tests)
```yaml
runs-on: "runs-on/runner=cpu=8+family=c7,c6"
```

**Memory-optimized (r7/r6)**: Memory-intensive tasks (large datasets)
```yaml
runs-on: "runs-on/runner=cpu=8+ram=64+family=r7,r6"
```

**General-purpose (m7/m6)**: Balanced workloads
```yaml
runs-on: "runs-on/runner=cpu=8+family=m7,m6"
```

#### H. Parallel Job Execution

**Use matrix strategy with larger runners**:
```yaml
jobs:
  test:
    runs-on: "runs-on/runner=16cpu-linux-x64"
    strategy:
      matrix:
        shard: [1, 2, 3, 4, 5, 6, 7, 8]
    steps:
      - uses: actions/checkout@v4
      - run: npm test -- --shard=${{ matrix.shard }}/8
```

**Benefits**:
- Split tests across 8 parallel jobs
- Each job gets 16 CPUs
- 8x faster test execution

### 6. Performance Improvements

#### Real-World Results

**nodejs/node repository**:
- **Average CI runtime decrease**: 35%
- **Repository with 16-thread support**: 75% runtime decrease

**General improvements with RunsOn**:
- **30% faster builds** vs GitHub-hosted (better CPU performance)
- **5x faster caching** with Magic Cache
- **90% cost reduction** vs GitHub-hosted runners
- **Zero queue times** with dedicated capacity

### 7. Key Features

#### Ephemeral Runners
- Fresh VM for every job
- No cleanup required
- Enhanced security

#### Auto-Scaling
- Launches on-demand
- No pre-provisioning needed
- Handles bursts of hundreds of jobs

#### Spot Instance Support
- Automatic fallback to on-demand
- Capacity-optimized placement
- Maximum cost savings

#### Static IPs
- Available for private networking
- No additional cost
- Useful for firewall rules

#### SSH/SSM Access
- Debug runners during job execution
- Restrict to specific CIDR ranges
- Useful for troubleshooting

#### CloudWatch Integration
- Per-job performance metrics
- Automatic cost attribution
- Built-in monitoring dashboards

### 8. Migration Guide

#### Step 1: Simple Migration

**Before**:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test
```

**After**:
```yaml
jobs:
  build:
    runs-on: "runs-on/runner=2cpu-linux-x64"
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test
```

#### Step 2: Optimize with Larger Runners

```yaml
jobs:
  build:
    runs-on: "runs-on/runner=8cpu-linux-x64"  # 4x more CPUs
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test -- --parallel  # Use all 8 CPUs
```

#### Step 3: Add Magic Cache

```yaml
jobs:
  build:
    runs-on: "runs-on/runner=8cpu-linux-x64+extras=s3-cache"
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
      
      - run: npm install  # Uses cached dependencies
      - run: npm test
```

### 9. Setup Process

**Deployment Time**: 10 minutes

**Steps**:
1. Deploy CloudFormation stack in AWS account
2. GitHub App automatically configured
3. Start using runners immediately

**No Kubernetes required** - Simple EC2-based architecture

**One-click updates** - Automatic infrastructure healing

## Sources & Citations

- [RunsOn Homepage](https://runs-on.com)
- [RunsOn GitHub Repository](https://github.com/runs-on/runs-on)
- [RunsOn Runner Configuration Documentation](https://runs-on.com/configuration/repo-config/)
- [RunsOn Linux Runners Documentation](https://runs-on.com/runners/linux/)
- [RunsOn Caching Strategies](https://runs-on.com/caching/)
- [RunsOn Larger Runners Comparison](https://runs-on.com/github-actions/larger-runners/)
- [GitHub Actions Runner Pricing Documentation](https://docs.github.com/en/billing/reference/actions-runner-pricing)

## Key Takeaways

1. **Syntax**: Use `runs-on: "runs-on/runner=<cpu>cpu-linux-<arch>"` format
2. **Larger runners**: 8cpu, 16cpu, 32cpu, 64cpu, 96cpu available for both x64 and ARM64
3. **Cost savings**: 90% cheaper than GitHub-hosted runners (7x-15x reduction)
4. **Setup**: 10-minute CloudFormation deployment, no Kubernetes needed
5. **Best practices**:
   - Use Magic Cache (S3-backed) for 5x faster caching
   - Enable spot instances for cost savings
   - Use compute-optimized families (c7) for CPU-bound tasks
   - Implement Turbo caching for monorepos
   - Parallelize tests with matrix strategy on larger runners
6. **Performance**: 30% faster builds + 35-75% CI runtime reduction
7. **Configuration**: Use `.github/runs-on.yml` for custom runners and pools

## Related Searches

- Custom AMI creation for RunsOn runners
- Runner pools for hot-standby capacity
- Integration with Turborepo for monorepo builds
- Comparing RunsOn vs GitHub-hosted vs Actions Runner Controller (ARC)
- RunsOn security best practices and VPC configuration
