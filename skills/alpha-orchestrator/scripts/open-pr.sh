#!/usr/bin/env bash
set -euo pipefail

SPEC_ID="${1:-}"
if [[ -z "${SPEC_ID}" ]]; then
  echo "Usage: $0 <spec-id>" >&2
  exit 1
fi

REPO_DIR="${SOPHIE_REPO_DIR:-$HOME/2025slideheroes-sophie}"
BASE_BRANCH="${ALPHA_BASE_BRANCH:-dev}"
BRANCH_PREFIX="${ALPHA_BRANCH_PREFIX:-sophie/alpha}"

: "${SOPHIE_FORK_REPO:?Must set SOPHIE_FORK_REPO (owner/repo)}"
: "${SOPHIE_UPSTREAM_REPO:?Must set SOPHIE_UPSTREAM_REPO (owner/repo)}"
: "${GITHUB_TOKEN:?Must set GITHUB_TOKEN (used for gh PR)}"

command -v gh >/dev/null 2>&1 || { echo "gh not found" >&2; exit 1; }

export GH_TOKEN="${GITHUB_TOKEN}"

BRANCH_NAME="${BRANCH_PREFIX}/S${SPEC_ID}"
HEAD="${SOPHIE_FORK_REPO%/*}:${BRANCH_NAME}"

cd "${REPO_DIR}"

# If PR already exists, print it and exit
if gh pr view --repo "${SOPHIE_UPSTREAM_REPO}" --head "${HEAD}" >/dev/null 2>&1; then
  gh pr view --repo "${SOPHIE_UPSTREAM_REPO}" --head "${HEAD}" --web
  exit 0
fi

TITLE="Alpha S${SPEC_ID}"
BODY=$(
  cat <<EOF
Automated Alpha Orchestrator implementation for spec S${SPEC_ID}.

- Branch: ${BRANCH_NAME}
- Base: ${BASE_BRANCH}

Notes:
- This PR was opened from Sophie's fork workflow wrapper.
EOF
)

# Create PR against upstream
# --head uses "forkOwner:branch" syntax when targeting a different repo
gh pr create \
  --repo "${SOPHIE_UPSTREAM_REPO}" \
  --base "${BASE_BRANCH}" \
  --head "${HEAD}" \
  --title "${TITLE}" \
  --body "${BODY}"
