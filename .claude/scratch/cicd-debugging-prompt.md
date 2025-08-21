I am implementing a cicd pipeline in github.

Read:
1.  .claude/context/systems/cicd-pipeline-design.md
2.  .claude/context/systems/cicd-pipeline.md  
   
Review these commands:
1.  .claude/commands/promote-to-staging.md
2.  .claude/commands/promote-to-production.md

Current status:
1. We have been running into numerous issues and have not yet been able to push an update from dev all the way to the main production branch.
2. We have optimized the initial 'deploy to dev' workflow. This workflow has been failing. We have a commit that needs to be pushed to the dev branch at origin to hopefully fix the issue

I want you to:
1. Conduct an audit of the status of the cicd pipeline development
2. Push the latets commit and monitor the workflow
3. Debug the pipeline
4. Fix the deploy to dev workflow
5. Push changes through the pipeline to get to a point where the main branch is the same as the dev branch

