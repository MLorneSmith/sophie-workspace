#!/usr/bin/env bash
# Typecheck wrapper - simple passthrough to turbo typecheck
set -e

# Run typecheck using turbo
pnpm turbo typecheck --affected --cache-dir=.turbo
