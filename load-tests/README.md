# SlideHeroes Load Testing

Performance and load testing suite using [k6](https://k6.io/).

## Quick Start

```bash
cd load-tests
./run-tests.sh
```

The k6 binary will be automatically downloaded on first run if not already available.

## Prerequisites

- `curl` (for downloading k6)
- `tar` (for extracting k6)
- `bash` 4.0+

## Installation Options

### Option 1: Auto-Download (Default)

The `run-tests.sh` script automatically downloads k6 v0.52.0 to `.bin/k6` on first run.

Supported platforms:
- Linux (x86_64)
- macOS (Intel and Apple Silicon)

### Option 2: System-Wide Installation

#### macOS
```bash
brew install k6
```

#### Linux (Debian/Ubuntu)
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Using Custom k6 Binary
```bash
export K6_BIN=/path/to/your/k6
./run-tests.sh
```

## Test Scenarios

### Available Tests

1. **login-flow** - Tests authentication and session management
2. **dashboard-load** - Simulates dashboard usage patterns
3. **user-journey** - End-to-end user workflows

### Running Tests

```bash
# Run all tests
./run-tests.sh

# Run specific test
./run-tests.sh login-flow

# Run multiple specific tests
./run-tests.sh login-flow dashboard-load
```

### Configuration

Set environment variables to customize test execution:

```bash
# Target URL (default: https://staging.slideheroes.com)
export K6_API_URL=https://your-environment.com

# Custom k6 binary location
export K6_BIN=/usr/local/bin/k6

# Run tests
./run-tests.sh
```

## Test Reports

Reports are saved to `load-tests/reports/` with timestamps:

- `{test-name}_{timestamp}.json` - Detailed results
- `{test-name}_{timestamp}_summary.json` - Summary statistics
- `{test-name}_{timestamp}.html` - HTML report

## CI/CD Integration

The `.github/workflows/k6-load-test.yml` workflow runs load tests automatically:

- On staging deployments
- Can be triggered manually via workflow_dispatch
- Integrates with K6 Cloud (when token configured)
- Sends metrics to New Relic (when configured)

## Directory Structure

```
load-tests/
├── run-tests.sh           # Main test runner
├── scenarios/             # Test scenarios
│   ├── login-flow.js
│   ├── dashboard-load.js
│   └── user-journey.js
├── utils/                 # Shared utilities
│   ├── auth.js
│   └── newrelic.js
├── k6.config.js          # k6 configuration
├── test-setup.js         # Common test setup
└── reports/              # Test results (gitignored)
```

## Troubleshooting

### k6 Download Fails

If auto-download fails:

1. Check internet connectivity
2. Verify your platform is supported
3. Install k6 system-wide (see Installation Options)
4. Set `K6_BIN` to point to your installation

### Tests Fail to Connect

1. Verify `K6_API_URL` points to correct environment
2. Check application is running and healthy
3. Verify firewall/network settings allow connections

### Permission Denied

If k6 binary isn't executable:

```bash
chmod +x .bin/k6
```

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 GitHub](https://github.com/grafana/k6)
- [SlideHeroes Performance Monitoring](https://newrelic.com/)
