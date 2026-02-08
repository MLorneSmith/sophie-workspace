# Context7 Research: PostHog CLI

**Date**: 2026-01-21
**Agent**: context7-expert
**Libraries Researched**: posthog/posthog, posthog/posthog.com

## Query Summary

Researched PostHog CLI capabilities, installation, configuration, key commands, and integration options using Context7 to fetch official PostHog documentation.

## Findings

### What is the PostHog CLI?

The PostHog CLI (posthog-cli) is a command-line interface tool for interacting with PostHog services. Its primary use cases include:

1. **Source Map Management** - Inject metadata and upload source maps for error tracking
2. **Authentication** - Authenticate with PostHog projects for CI/CD integration
3. **Error Tracking Integration** - Enable de-minification of JavaScript stack traces

The CLI is written in Rust and is available for Linux, macOS, and Windows.

### Installation

#### Linux/macOS (Recommended)

curl -fsSL https://raw.githubusercontent.com/PostHog/posthog-cli/main/get-posthog.sh | /bin/bash

Alternative:

curl -sL https://posthog.com/install.sh | bash

#### Windows (PowerShell)

Invoke-WebRequest -Uri "https://raw.githubusercontent.com/PostHog/posthog-cli/main/get-posthog.sh" -OutFile "get-posthog.sh"
bash get-posthog.sh

#### Building from Source
For contributors or custom builds:

cargo install --path cli
cp ./target/release/posthog-cli "$(which posthog-cli)"

### Authentication

#### Interactive Login

posthog-cli login

This initiates an interactive authentication process.

#### CI/CD Authentication (Non-Interactive)
For automated pipelines, use environment variables:
- POSTHOG_CLI_ENV_ID - Your project ID
- POSTHOG_CLI_TOKEN - Your API token

#### Specifying Custom Host (EU/Self-Hosted)

posthog-cli --host https://eu.posthog.com [CMD]

### Key Commands

#### 1. Source Map Injection
Injects metadata into bundled JavaScript assets for error tracking:

posthog-cli sourcemap inject ./path/to/dist --chunk-id "[name]" --base-path "/static/js/"

#### 2. Source Map Upload
Uploads source maps to PostHog for de-minification:

posthog-cli sourcemap upload ./path/to/assets

Alternative syntax with options:

posthog-cli source-maps upload --directory=./dist --project-api-key="YOUR_KEY" --app-url="YOUR_APP_URL"

Full upload command:

posthog-cli upload-sourcemaps --api-key YOUR_POSTHOG_API_KEY --source-maps "./dist/**/*.js.map" --bundle "./dist/**/*.js"

### Integration Options

#### Next.js Integration
Install the helper package: npm install @posthog/nextjs-config

Then configure in next.config.js with withPostHogConfig wrapper providing:
- personalApiKey
- envId
- host (optional)
- sourcemaps configuration (enabled, project, version, deleteAfterUpload)

#### Nuxt.js Integration
Configure nuxt.config with:
- sourcemap.client: true
- hooks.close to run posthog-cli sourcemap inject and upload commands

#### CI/CD Pipeline Integration
Set environment variables in CI/CD secrets for non-interactive authentication.

### Build Tool Configuration

Enable sourcemaps in your build tool:
- Vite: build.sourcemap = true
- Webpack: devtool = 'source-map'
- Angular: sourceMap options in angular.json

### PostHog Internal Development CLIs

#### hogli CLI
Internal development workflow tool for PostHog contributors:
- hogli start - Start full development stack
- hogli test:python/test:js - Run tests
- hogli lint - Quality checks

#### toolbox.py
Infrastructure management CLI for PostHog infrastructure

## Key Takeaways

- Primary Purpose: Source map management for error tracking
- Easy Installation: Single-line install script for Linux/macOS
- CI/CD Ready: Non-interactive authentication via environment variables
- Framework Support: Direct integration for Next.js
- Build Integration: Works with Vite, Webpack, Rollup, Angular
- Rust-Based: Built with Rust, available via cargo

## Sources

- PostHog Core via Context7 (posthog/posthog)
- PostHog Documentation via Context7 (posthog/posthog.com)
