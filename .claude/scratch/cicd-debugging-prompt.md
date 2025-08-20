I am implementing a cicd pipeline in github.

Read:
1.  .claude/context/systems/cicd-pipeline-design.md
2.  .claude/context/systems/cicd-pipeline.md  
   
Review these commands:
1.  .claude/commands/promote-to-staging.md
2.  .claude/commands/promote-to-production.md

Current status:
1. We have been running into numerous issues and have not yet been able to push an update from dev all the way to the main production branch.
2. The e2e test matrix workflow when trying to deploy from dev to staging is failing
3. We are running the deploy to dev workflow twice. Once when we push to dev and then a second time when we are validating the PR merge. This is inefficient. We have attempted to add validation check to skip this workflow on PR merges if the workflow has run successfully recently, but that ended up causing startup errors with the workflow
4. We may have 2 deploy to dev workflows. 'deploy to dev' and 'deploy to dev clean'. 

I want you to:
1. Conduct an audit of the status of the cicd pipeline development
2. Debug the pipeline
3. Fix the e2e test matrix workflow
4. Validate that we have two competing deploy to dev workflows. If so, merge 'deploy to dev clean' into 'deploy to dev' and use 'deploy to dev'
5. Add validation checks for the deploy to dev workflow  
6. Push changes through the pipeline to get to a point where the main branch is the same as the dev branch