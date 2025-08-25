I am implementing a cicd pipeline in github.

Read:
1.  .claude/context/systems/cicd-pipeline-design.md
2.  .claude/context/systems/cicd-pipeline.md  
   
Review these commands:
1.  .claude/commands/promote-to-staging.md
2.  .claude/commands/promote-to-production.md

Current status:
1. We have been running into numerous issues and have not yet been able to push an update from dev all the way to the main production branch.
2. We have optimized the initial 'deploy to dev' and 'dev integration tests' workflows. It appears that these workflows are working without errors (although it is unclear what branch the 'dev integration tests' workflow that was successful ran on)

Current Issue:
1. IIt is unclear if the 'dev integration tests' workflow is in fact working on dev
2. Once the 'dev integration tests' workflow completes, nothing happens. It is not clear to me what the correct next steps is

I want you to:
1. Conduct an audit of the status of the cicd pipeline development
2. Push the latets commit and monitor the workflow
3. Debug the pipeline
4. Fix the deploy to dev workflow
5. Push changes through the pipeline to get to a point where the main branch is the same as the dev branch

we should not be using the domain merkeit