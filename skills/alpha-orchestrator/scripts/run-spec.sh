#!/usr/bin/env bash
set -euo pipefail

SPEC_ID="${1:-}"
if [[ -z "${SPEC_ID}" ]]; then
  echo "Usage: $0 <spec-id> [-- <extra spec-orchestrator args>]" >&2
  exit 1
fi
shift || true

# Optional passthrough args after --
EXTRA_ARGS=()
if [[ "${1:-}" == "--" ]]; then
  shift
  EXTRA_ARGS=("$@")
fi

REPO_DIR="${SOPHIE_REPO_DIR:-$HOME/2025slideheroes-sophie}"
BASE_BRANCH="${ALPHA_BASE_BRANCH:-dev}"
BRANCH_PREFIX="${ALPHA_BRANCH_PREFIX:-sophie/alpha}"

: "${SOPHIE_FORK_REPO:?Must set SOPHIE_FORK_REPO (owner/repo)}"
: "${SOPHIE_UPSTREAM_REPO:?Must set SOPHIE_UPSTREAM_REPO (owner/repo)}"
: "${GITHUB_TOKEN:?Must set GITHUB_TOKEN (used for pushes + gh PR)}"

FORK_URL="https://github.com/${SOPHIE_FORK_REPO}.git"
UPSTREAM_URL="https://github.com/${SOPHIE_UPSTREAM_REPO}.git"

if [[ ! -d "${REPO_DIR}" ]]; then
  echo "Repo dir not found: ${REPO_DIR}" >&2
  exit 1
fi

cd "${REPO_DIR}"

# Ensure local remotes are set (helps local inspection + PR tooling)
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "${FORK_URL}" >/dev/null 2>&1 || true
else
  git remote add origin "${FORK_URL}" >/dev/null 2>&1 || true
fi

if git remote get-url upstream >/dev/null 2>&1; then
  git remote set-url upstream "${UPSTREAM_URL}" >/dev/null 2>&1 || true
else
  git remote add upstream "${UPSTREAM_URL}" >/dev/null 2>&1 || true
fi

# Helpful sanity checks
command -v pnpm >/dev/null 2>&1 || { echo "pnpm not found" >&2; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "gh not found" >&2; exit 1; }

# Ensure gh can talk (uses GITHUB_TOKEN)
export GH_TOKEN="${GITHUB_TOKEN}"

# Ensure alpha scripts deps are installed (separate package.json)
if [[ ! -d ".ai/alpha/scripts/node_modules" ]]; then
  echo "Installing .ai/alpha/scripts dependencies..."
  pnpm -C .ai/alpha/scripts install
fi

BRANCH_NAME="${BRANCH_PREFIX}/S${SPEC_ID}"

echo "Running Alpha Spec Orchestrator"
echo "  Spec: ${SPEC_ID}"
echo "  Branch: ${BRANCH_NAME}"
echo "  Base: ${BASE_BRANCH} (upstream)"
echo "  Repo: ${REPO_DIR}"

# Run orchestrator with fork-aware env vars used inside E2B sandboxes
export ALPHA_GIT_FORK_URL="${FORK_URL}"
export ALPHA_GIT_UPSTREAM_URL="${UPSTREAM_URL}"
export ALPHA_BRANCH_PREFIX="${BRANCH_PREFIX}"
export ALPHA_BASE_BRANCH="${BASE_BRANCH}"

# Use pnpm dlx so we don't depend on tsx being installed in the monorepo
tsx_cmd=(pnpm dlx tsx)
"${tsx_cmd[@]}" .ai/alpha/scripts/spec-orchestrator.ts "${SPEC_ID}" "${EXTRA_ARGS[@]}"
