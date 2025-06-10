# Manual Label Creation for AAFD v2.0

Since we don't have direct API access in this environment, here are the exact commands you can run to create the technical domain labels:

## Option 1: Using curl (if you have a GitHub token)

```bash
# Set your GitHub token
export GITHUB_TOKEN="your_github_token_here"

# Create domain:frontend label
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/MLorneSmith/2025slideheroes/labels \
  -d '{"name":"domain:frontend","color":"0052CC","description":"React components, UI, frontend development"}'

# Create domain:backend label
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/MLorneSmith/2025slideheroes/labels \
  -d '{"name":"domain:backend","color":"B60205","description":"Server actions, APIs, backend development"}'

# Create domain:database label
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/MLorneSmith/2025slideheroes/labels \
  -d '{"name":"domain:database","color":"5319E7","description":"Schema changes, queries, database operations"}'

# Create domain:ai label
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/MLorneSmith/2025slideheroes/labels \
  -d '{"name":"domain:ai","color":"FF6B35","description":"AI integration, prompts, machine learning"}'

# Create domain:devops label
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/MLorneSmith/2025slideheroes/labels \
  -d '{"name":"domain:devops","color":"28A745","description":"Build, deployment, infrastructure"}'

# Create domain:testing label
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/MLorneSmith/2025slideheroes/labels \
  -d '{"name":"domain:testing","color":"FFEB3B","description":"Test implementation, quality assurance"}'
```

## Option 2: Manual Creation via GitHub Web Interface

1. Go to: https://github.com/MLorneSmith/2025slideheroes/labels
2. Click "New label" for each of these:

| Label Name        | Color              | Description                                  |
| ----------------- | ------------------ | -------------------------------------------- |
| `domain:frontend` | `#0052CC` (Blue)   | React components, UI, frontend development   |
| `domain:backend`  | `#B60205` (Red)    | Server actions, APIs, backend development    |
| `domain:database` | `#5319E7` (Purple) | Schema changes, queries, database operations |
| `domain:ai`       | `#FF6B35` (Orange) | AI integration, prompts, machine learning    |
| `domain:devops`   | `#28A745` (Green)  | Build, deployment, infrastructure            |
| `domain:testing`  | `#FFEB3B` (Yellow) | Test implementation, quality assurance       |

## Option 3: Using the Shell Script

If you have a GitHub token, you can also run the shell script I created:

```bash
# Set your token
export GITHUB_TOKEN="your_token_here"

# Run the script
./scripts/create-domain-labels.sh
```

Choose whichever option is most convenient for you!
