I am implementing a cicd pipeline in github.

Read:
1.  .claude/context/systems/cicd-pipeline-design.md
2.  .claude/context/systems/cicd-pipeline.md  
   
Review these commands:
1.  .claude/commands/promote-to-staging.md
2.  .claude/commands/promote-to-production.md

Current status:
1. We have been running into numerous issues and have not yet been able to push an update from dev all the way to the main production branch.
2. We are currently working on optimizing the deploy to dev workflow. Another claude code session is debugging the e2e smoke tests.

Your Task:
1. Review the current cicd pipeline implementation
2. I want you to think hard about the optimal setup of the deploy to dev workflow. Make a set of recommendations.
   1. Do we need both the hbuild step and the deploy to vercel steps if we are using vercel build in the deploy to vercel step?
   2. Are we effectively using caching when deploying to vercel?
   3. Does this workflow contain all the necessary steps? Are there other actions/steps/tests that are elsewhere within our cicd pipeline that should be in this workflow instead?
   4. What other opportunities exist for optimization of this workflow?
   5. What other recommendations can you make to improve this workflow?