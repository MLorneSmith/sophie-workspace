# GitHub Branch Access Restrictions Research

**Date**: 2026-02-03
**Agent**: context7-expert
**Topic**: Restricting collaborator access to specific branches in personal repositories

## Query Summary

Research GitHub's options for:
- Allowing a collaborator to ONLY create a branch from dev and work on that branch
- Preventing access to everything else in the repository
- Understanding what's possible on GitHub Free vs paid plans
- Whether organization transfer would help

---

## Executive Summary

**Short answer: What you want is NOT fully possible on GitHub, even with paid plans.**

GitHub's permission model is **repository-centric**, not branch-centric. A collaborator with push access can push to ANY unprotected branch. You can protect specific branches from direct pushes, but you CANNOT grant access to only one branch.

---

## 1. Branch Protection Rules (Personal Repos)

### What They Do
Branch protection rules **prevent** actions on specific branches. They are **restrictive**, not **permissive**.

### Available on GitHub Free (Personal Repos)
- Require pull request reviews before merging
- Require status checks to pass before merging
- Require conversation resolution before merging
- Require signed commits
- Require linear history
- Include administrators in restrictions
- Allow force pushes (for specific people/teams)
- Allow deletions

### What Branch Protection CANNOT Do
- **Grant access to only one branch** - Protection is deny-list, not allow-list
- **Prevent reading other branches** - All collaborators can see all branches
- **Prevent creating new branches** - Any collaborator can create branches
- **Limit which branches someone can push to** - They can push to any unprotected branch

### Example: Protecting main and dev
```
Protected branches: main, dev
Collaborator: Can still create feature-branch-xyz and push to it
```

This protects your important branches but does NOT restrict the collaborator to only working on their branch.

---

## 2. Repository Rulesets

### What Are They?
Rulesets are the newer, more powerful successor to branch protection rules. They allow pattern-based rules across multiple branches.

### Availability
| Feature | GitHub Free | GitHub Pro | GitHub Team | GitHub Enterprise |
|---------|-------------|------------|-------------|-------------------|
| Rulesets for public repos | Yes | Yes | Yes | Yes |
| Rulesets for private repos | **No** | **No** | Yes | Yes |

**Critical limitation**: If your repo is PRIVATE and you're on GitHub Free or Pro, you CANNOT use rulesets.

### What Rulesets CAN Do
- Apply rules to branches matching patterns (e.g., `feature/*`)
- Bypass rules for specific actors
- Block force pushes, deletions, and non-fast-forward updates
- Require code reviews, status checks, signed commits
- Restrict who can push to matching branches

### What Rulesets CANNOT Do
- **Restrict a user to only create/push to specific branches** - Still a deny-based system
- **Hide branches from collaborators** - All branches are visible
- **Prevent creating arbitrary branches** - Only prevent pushing to protected patterns

### Example Ruleset Strategy (if available)
You could protect `main` and `dev` with rulesets, requiring PRs. But the collaborator could still:
- Create `collaborator-feature-1`, `random-branch`, etc.
- Push directly to any branch not matching your ruleset patterns

---

## 3. Fork-Based Workflow (RECOMMENDED ALTERNATIVE)

### How It Works
1. Collaborator forks your repository to their own account
2. They have FULL control over their fork (can create any branches)
3. They submit Pull Requests from their fork to your repository
4. You review and merge PRs

### Advantages
- **Complete isolation**: They cannot push ANYTHING to your repository directly
- **Full visibility control**: They only see public branches (or what you've shared)
- **No accidental damage**: They cannot delete branches, force push, or break anything
- **Works on GitHub Free**: No paid plan required
- **Standard open-source workflow**: Industry-standard practice

### Disadvantages
- Slightly more complex workflow for the collaborator
- They need to keep their fork synced with your upstream
- CI/CD workflows might need adjustment for fork PRs

### Setup Steps
1. Remove collaborator's direct access to your repo
2. Have them fork the repository
3. They clone their fork locally
4. They add your repo as `upstream` remote
5. They create branches in their fork, push there
6. They open PRs from their fork to your `dev` branch

### Workflow Commands (for collaborator)
```bash
# Initial setup
git clone https://github.com/COLLABORATOR/2025slideheroes.git
cd 2025slideheroes
git remote add upstream https://github.com/msmith/2025slideheroes.git

# Before starting work
git fetch upstream
git checkout -b my-feature upstream/dev

# After completing work
git push origin my-feature
# Then open PR on GitHub: COLLABORATOR/repo:my-feature -> msmith/repo:dev
```

---

## 4. GitHub Free vs Pro vs Team vs Enterprise

### Personal Account Plans

| Feature | Free | Pro ($4/mo) |
|---------|------|-------------|
| Branch protection (public) | Yes | Yes |
| Branch protection (private) | Yes | Yes |
| Repository rulesets (public) | Yes | Yes |
| Repository rulesets (private) | **No** | **No** |
| Required reviewers | 1 | 1 |
| CODEOWNERS | Yes | Yes |
| Protected branches count | Unlimited | Unlimited |

**Key insight**: GitHub Pro does NOT unlock rulesets for private repos. That requires Team/Enterprise.

### What Pro Adds (Not Relevant Here)
- Required reviewers in private repos
- More GitHub Actions minutes
- More Packages storage
- GitHub Pages for private repos

### Branch-Level Permissions: NOT AVAILABLE ON ANY PERSONAL PLAN
No personal plan (Free or Pro) allows you to say "User X can only push to branch Y."

---

## 5. Transferring to an Organization

### What Organizations Enable
- **Team-based permissions**: Create teams with specific access levels
- **Repository rulesets for private repos**: With Team plan ($4/user/mo)
- **CODEOWNERS enforcement**: Require specific team review for paths
- **Fine-grained access tokens**: Limit tokens to specific repos/branches
- **Audit logs**: Track who did what

### What Organizations STILL Cannot Do
- **Branch-only access**: Even with org teams, repository access is all-or-nothing at the branch level
- A collaborator with write access can still push to any unprotected branch

### When Org Transfer Helps
- You want **team-based reviews** (require Team A approval for `/src/api/*`)
- You want **rulesets on private repos** (Team plan required)
- You need **audit logging** for compliance
- You want **deploy keys and environments** with approval gates

### When Org Transfer Does NOT Help
Your specific goal (collaborator can ONLY work on one branch) is not achievable even with GitHub Enterprise.

### Cost
- GitHub Free (Org): Same as personal, no rulesets on private repos
- GitHub Team: $4/user/month - Enables rulesets on private repos
- GitHub Enterprise: $21/user/month - Advanced security features

---

## 6. What IS and ISN'T Possible

### IS Possible (Personal Repo, Free Plan)

| Goal | Solution |
|------|----------|
| Prevent direct pushes to `main` | Branch protection: require PR |
| Prevent direct pushes to `dev` | Branch protection: require PR |
| Require code review before merge | Branch protection: require reviews |
| See all PRs before they merge | Default behavior |
| Prevent force pushes to protected branches | Branch protection setting |
| Prevent deletion of protected branches | Branch protection setting |

### IS NOT Possible (Any Plan)

| Goal | Why Not |
|------|---------|
| Collaborator can ONLY push to `feature-x` | GitHub has no allow-list for branches per user |
| Collaborator cannot see other branches | All branches visible to all collaborators |
| Collaborator cannot create arbitrary branches | Not a GitHub feature |
| Hide repository contents except one folder | Not possible - repo access is all-or-nothing |
| Time-limited branch access | Not a GitHub feature |

---

## 7. Recommended Approach

Given your requirements, here's the best practical solution:

### Option A: Fork-Based Workflow (Strongest Isolation)

**Setup**:
1. Remove collaborator as direct collaborator
2. Have them fork the repo
3. They work entirely in their fork
4. They submit PRs to your `dev` branch
5. You review and merge

**Protection**: Complete. They cannot touch your repo except through PRs you approve.

### Option B: Protected Branches + Trust (If Direct Collaboration Needed)

**Setup**:
1. Add branch protection to `main` and `dev`:
   - Require pull request reviews (at least 1)
   - Require status checks if you have CI
   - Include administrators (so even you use PRs)
   - Restrict who can push (only you)
2. Collaborator creates `feature/*` branches
3. They open PRs to `dev`
4. You review and merge

**Protection**: They can create any branch and push to unprotected branches, but cannot directly modify `main` or `dev`.

**Risk**: They could still create branches like `totally-not-malicious-backup` and push code there. If this is a concern, use Option A.

---

## 8. Setting Up Branch Protection (Quick Reference)

### Via GitHub UI
1. Go to Settings > Branches
2. Click "Add branch protection rule"
3. Branch name pattern: `main` (repeat for `dev`)
4. Enable:
   - [x] Require a pull request before merging
   - [x] Require approvals: 1
   - [x] Dismiss stale PR approvals when new commits are pushed
   - [x] Require review from Code Owners (if using CODEOWNERS)
   - [x] Restrict who can push to matching branches
     - Add only yourself
5. Save

### Via GitHub CLI
```bash
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f enforce_admins=true \
  -f restrictions='{"users":["msmith"],"teams":[]}'
```

---

## 9. Summary Table

| Requirement | Fork Workflow | Branch Protection | Org + Rulesets |
|-------------|---------------|-------------------|----------------|
| Only work on one branch | **Yes** (via PR) | No | No |
| Cannot see other branches | **Yes** | No | No |
| Cannot create random branches | **Yes** | No | No |
| Cannot push to main/dev | **Yes** | **Yes** | **Yes** |
| Simple setup | Medium | Easy | Complex |
| Cost | Free | Free | $4+/user/mo |
| Works for private repos | **Yes** | **Yes** | **Yes** |

---

## 10. Conclusion

**For your specific needs, the fork-based workflow is the only solution that provides true branch-level isolation.**

GitHub's permission model does not support "User X can only access Branch Y." It only supports "Branch Y is protected, requiring PRs from everyone."

If you need the collaborator to have a seamless experience without forking, you'll have to accept that they can create and push to any unprotected branch. Protect `main` and `dev`, and trust them to only work on agreed-upon branches.

---

## Sources

- GitHub Docs: About protected branches
- GitHub Docs: Managing a branch protection rule
- GitHub Docs: About repository rulesets
- GitHub Docs: Repository permission levels
- GitHub Docs: Collaborating with pull requests
- GitHub Pricing page

