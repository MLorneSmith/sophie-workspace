I am implementing a cicd pipeline in github.

Read:
1.  .claude/context/systems/cicd-pipeline-design.md
2.  .claude/context/systems/cicd-pipeline.md  
   
Review these commands:
1.  .claude/commands/promote-to-staging.md
2.  .claude/commands/promote-to-production.md

Current status:
1. We have been running into numerous issues and have not yet been able to push an update from dev all the way to the main production branch.
2. The deploy to dev workflow is failing. Specifically, the E2E smoke tests

I want you to:
1. Conduct an audit of the status of the cicd pipeline development
2. Debug the pipeline
3. Fix the deploy to dev workflow
4. Push changes through the pipeline to get to a point where the main branch is the same as the dev branch

## Debugging Session

Started debugging at: 2025-08-20 18:50 UTC

### Initial Findings
- Multiple Deploy to Dev workflow failures in recent history
- All builds failing at the "Build Application" step
- Local builds and typecheck pass successfully
- All required secrets and variables are configured in GitHub