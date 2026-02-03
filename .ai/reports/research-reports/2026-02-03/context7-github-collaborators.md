# Context7 Research: Adding Collaborators to Personal GitHub Repositories

**Date**: 2026-02-03
**Agent**: context7-expert
**Libraries Researched**: github/docs

## Query Summary

Researched how to add a collaborator to a personal GitHub repository, specifically:
- Adding collaborators to personal repositories
- Permissions that collaborators receive
- Steps the invited user needs to take

## Findings

### Adding Collaborators to a Personal Repository

For a personal repository (like `slideheroes/2025slideheroes`), you can add collaborators through the repository settings.

#### Via GitHub Web Interface

1. **Navigate to Repository Settings**
   - Go to your repository: `https://github.com/slideheroes/2025slideheroes`
   - Click **Settings** tab (gear icon)

2. **Access Collaborators Section**
   - In the left sidebar, click **Collaborators** (under "Access")
   - You may need to confirm your password

3. **Add a Collaborator**
   - Click **Add people** button
   - Search for the username: `SophieLegerPA`
   - Select the user from the search results
   - Click **Add SophieLegerPA to this repository**

4. **Invitation Sent**
   - An invitation will be sent to SophieLegerPA
   - The invitation expires after 7 days if not accepted

#### Via GitHub CLI

```bash
# Add a collaborator with push (write) access
gh api repos/slideheroes/2025slideheroes/collaborators/SophieLegerPA \
  --method PUT \
  -f permission=push

# Or to give admin access
gh api repos/slideheroes/2025slideheroes/collaborators/SophieLegerPA \
  --method PUT \
  -f permission=admin
```

### Collaborator Permissions

For **personal repositories**, collaborators can be granted one of these permission levels:

| Permission | Description |
|------------|-------------|
| **Read** | Can view and clone the repository |
| **Write** (push) | Can push changes, create branches, open/merge PRs |
| **Admin** | Full access including settings, webhooks, and adding other collaborators |

**Note**: Unlike organization repositories, personal repositories do not have "Triage" or "Maintain" permission levels.

### What SophieLegerPA Needs to Do

1. **Check for Invitation**
   - SophieLegerPA will receive an email notification
   - They can also see pending invitations at: `https://github.com/notifications`
   - Or directly at: `https://github.com/slideheroes/2025slideheroes/invitations`

2. **Accept the Invitation**
   - Click the link in the email or notification
   - Click **Accept invitation** button
   - They will now have access to the repository

3. **Clone and Work on Branches**
   Once accepted, SophieLegerPA can:
   ```bash
   # Clone the repository
   git clone https://github.com/slideheroes/2025slideheroes.git
   
   # Create and push branches
   git checkout -b feature/new-feature
   git push -u origin feature/new-feature
   
   # Open pull requests via GitHub web or CLI
   gh pr create --title "My changes" --body "Description"
   ```

### Alternative: Using Organization Teams

Since you also have the `slideheroes` organization where both you and SophieLegerPA are members, an alternative approach is:

1. Transfer the repository to the organization
2. Add the repository to a team with SophieLegerPA
3. Set team permissions appropriately

However, for keeping the repository personal, the collaborator invitation approach is simpler.

## Key Takeaways

- Personal repository collaborators are added through Settings > Collaborators
- Invitations expire after 7 days and must be accepted by the invitee
- Write/push permission allows creating branches and opening PRs
- The gh CLI can also add collaborators via the API
- Both users being in the same organization does not automatically grant access to personal repos

## API Reference

From the GitHub documentation:

```
PUT /repos/{owner}/{repo}/collaborators/{username}

Permission levels for personal repositories:
- pull (Read)
- push (Write)  
- admin (Admin)
```

The invitation system allows invited users to accept or decline. The `repo:invite` OAuth scope grants access to invitations without full repository access.

## Sources

- GitHub Docs via Context7 (github/docs)
- GitHub REST API: Collaborators endpoints
- GitHub REST API: Repository invitations
