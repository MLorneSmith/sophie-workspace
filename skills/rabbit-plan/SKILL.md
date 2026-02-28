# Rabbit Plan Skill

Execute the Rabbit Plan development workflow: brainstorm → spec → feature issues → plan review → execute.

## Commands

### rabbit brainstorm
Start a new brainstorm session. Guide through 4-6 questions exploring the problem space. Output: design doc in `~/clawd/plans/brainstorming/`.

### rabbit spec
Create a product-focused spec from brainstorm output or direct input. Uses Spec Template. Output: spec doc in `~/clawd/plans/specs/<slug>/`.

### rabbit create-issues
Read spec's feature breakdown, create GitHub Issues using Issue Template with `type:feature` and `plan-me` labels. Create MC tasks.

### rabbit review-plans
Monitor CodeRabbit plan comments on feature issues. Summarize for Mike's review.

### rabbit execute
Extract CR's agent prompt, spawn Neo to implement.

## Usage

```
rabbit brainstorm
rabbit spec <slug> [-input "..."]
rabbit create-issues <spec-path>
rabbit review-plans <issue-numbers>
rabbit execute <issue-number>
```

## Requirements
- GitHub token with repo write access
- CodeRabbit configured on repo
- Mission Control API access
