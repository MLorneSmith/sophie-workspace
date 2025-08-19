I am implementing a cicd pipeline in github.

Read:
1.  .claude/context/systems/cicd-pipeline-design.md
2.  .claude/context/systems/cicd-pipeline.md  

Current status:
1. We have been running into numerous issues and have not yet been able to push an update from dev all the way to the main branch.
2. We have numerous outstanding PRs with unknown statuses
3. We have existing workflows that create PRs to movbe the code from dev to staging to production (main)

I want you to:
1. Conduct an audit of the status of the cicd pipeline development
2. Debug the pipeline
3. Push changes through the pipeline to get to a point where the main branch is the same as the dev branch