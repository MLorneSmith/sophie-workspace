I am implementing a cicd pipeline in github.

Read:
1.  .claude/context/systems/cicd-pipeline-design.md
2.  .claude/context/systems/cicd-pipeline.md  
   
Review these commands:
1.  .claude/commands/promote-to-staging.md
2.  .claude/commands/promote-to-production.md

Current status:
1. We have been running into numerous issues and have not yet been able to push an update from dev all the way to the main production branch.
2. We have implemented phase 1 and 2 of .claude/scratch/cicd-next-steps-recommendation.md
3. We have completed the optimization of the initial 'deploy to dev' workflow. This workflow completes successfully.
4. But nothing seems to be happening after the successfull complete of deploy to dev

Your Task:
1. Review the current cicd pipeline implementation
2. Debug the pipleline
3. Think hard about what the next step should be in the pipeline. Make a recommendation