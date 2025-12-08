# Context7 Research: PostHog CLI Installation

**Date**: 2025-12-08
**Agent**: context7-expert
**Libraries Researched**: posthog/posthog

## Query Summary

Researched the PostHog CLI installation process, available installation methods, configuration requirements, and basic usage patterns using Context7 CLI to fetch documentation from the main PostHog repository.

## Findings

### PostHog CLI Overview

The PostHog CLI (`posthog-cli`) is a command-line interface for PostHog written in Rust. It provides functionality for:
- Interactive authentication with PostHog
- Running SQL queries against PostHog data
- Uploading source maps for error tracking

### Installation Methods

#### 1. Cargo (Rust Package Manager) - RECOMMENDED

The PostHog CLI is published to crates.io and can be installed using Cargo:

```bash
cargo install posthog-cli
```

**Prerequisites:**
- Rust and Cargo must be installed
- Install Rust via rustup: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

#### 2. From Source (Development/Testing)

For development or testing the latest features:

```bash
# Clone the PostHog repository
git clone https://github.com/posthog/posthog.git
cd posthog/cli

# Build and install
cargo build --release

# Or run directly
cargo run --bin posthog-cli
```

**Note:** The CLI source code is located in the `cli/` directory of the main PostHog repository.

### CLI Commands

Once installed, the CLI provides the following commands:

```bash
posthog-cli --help
```

**Available Commands:**
- `login` - Interactively authenticate with PostHog (stores personal API token locally)
- `query` - Run SQL queries against PostHog data
- `sourcemap` - Upload bundled chunks/source maps to PostHog
- `help` - Display help information

**Global Options:**
- `--host <HOST>` - PostHog host to connect to (default: https://us.posthog.com)
- `-h, --help` - Print help
- `-V, --version` - Print version

### Configuration & Authentication

#### Interactive Authentication

```bash
posthog-cli login
```

This command will interactively prompt for credentials and store the API token locally.

#### Environment Variables (CI/CD)

For non-interactive authentication (e.g., in CI/CD pipelines), set these environment variables:

```bash
# PostHog host (default: https://us.posthog.com)
export POSTHOG_CLI_HOST="https://us.posthog.com"

# Personal API token from PostHog
# Get from: https://posthog.com/docs/api#private-endpoint-authentication
export POSTHOG_CLI_TOKEN="your-api-token"

# Project/environment ID (e.g., "2" from https://us.posthog.com/project/2)
export POSTHOG_CLI_ENV_ID="2"
```

### Basic Usage Examples

#### 1. Login

```bash
posthog-cli login
```

#### 2. Run SQL Query

```bash
posthog-cli query "SELECT * FROM events LIMIT 10"
```

Note: The query feature is marked as "mostly for fun, and subject to change"

#### 3. Upload Source Maps

```bash
posthog-cli sourcemap /path/to/bundled/chunks
```

#### 4. Specify Custom Host

```bash
posthog-cli --host https://eu.posthog.com login
```

### Release Process (For Maintainers)

The CLI follows a standard Rust release process:

```bash
# Create release branch
git checkout -b "cli/release-v0.1.0-pre1"

# Update version in Cargo.toml
# Build to update Cargo.lock

# Commit and tag
git add .
git commit -m "Bump version number"
git tag "posthog-cli-v0.1.0-prerelease.1"
git push
git push --tags

# Publish to crates.io
cd cli && cargo publish
```

### System Requirements

**Minimum Requirements:**
- Rust 1.70+ (for building from source)
- Cargo package manager
- Internet connection for authentication

**Supported Platforms:**
- Linux (all major distributions)
- macOS (Intel and Apple Silicon)
- Windows (via WSL or native)

### Development Setup

For contributors wanting to work on the CLI:

```bash
# Clone repository
git clone https://github.com/posthog/posthog.git
cd posthog/cli

# Run tests
cargo test

# Run with debug logging
RUST_LOG=debug cargo run --bin posthog-cli

# Format code
cargo fmt

# Build release binary
cargo build --release
```

## Key Takeaways

1. **Primary Installation**: Use `cargo install posthog-cli` for the simplest installation
2. **Authentication**: Interactive login via `posthog-cli login` or environment variables for CI/CD
3. **Main Use Cases**: SQL queries, source map uploads, and authentication management
4. **Prerequisites**: Requires Rust/Cargo to be installed on the system
5. **Configuration**: Supports both interactive and non-interactive (env vars) authentication
6. **Open Source**: Full source available in posthog/posthog repository under `cli/` directory

## Code Examples

### Complete Installation & Setup (macOS/Linux)

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install PostHog CLI
cargo install posthog-cli

# Verify installation
posthog-cli --version

# Login to PostHog
posthog-cli login

# Run a test query
posthog-cli query "SELECT COUNT(*) FROM events"
```

### CI/CD Usage Example

```bash
# Set environment variables
export POSTHOG_CLI_HOST="https://us.posthog.com"
export POSTHOG_CLI_TOKEN="${POSTHOG_API_TOKEN}" # from secrets
export POSTHOG_CLI_ENV_ID="123"

# Upload source maps after build
posthog-cli sourcemap ./dist/chunks
```

### Self-Hosted PostHog Instance

```bash
# Connect to self-hosted instance
posthog-cli --host https://posthog.yourcompany.com login

# Or via environment variable
export POSTHOG_CLI_HOST="https://posthog.yourcompany.com"
posthog-cli login
```

## Additional Notes

- The CLI is relatively new and under active development
- The `query` command is experimental and may change
- Source map upload is the primary production use case
- Authentication tokens are stored locally after `login` command
- The CLI is written in Rust for performance and cross-platform compatibility

## Sources

- PostHog CLI via Context7 (posthog/posthog)
- Repository: https://github.com/posthog/posthog/tree/master/cli
- Documentation: https://github.com/posthog/posthog/blob/master/cli/README.md
- Contributing Guide: https://github.com/posthog/posthog/blob/master/cli/CONTRIBUTING.md
