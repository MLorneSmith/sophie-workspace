I am implementing a cicd pipeline in github.

Read:
1.  .claude/context/systems/cicd-pipeline-design.md
2.  .claude/context/systems/cicd-pipeline.md  
   
Review these commands:
1.  .claude/commands/promote-to-staging.md
2.  .claude/commands/promote-to-production.md

Current status:
1. We have been running into numerous issues and have not yet been able to push an update from dev all the way to the main production branch.
2. We have completed the optimization of the initial 'deploy to dev' workflow. This workflow completes successfully.
3. I have two main questions
   1. What should happen after we push a change to the dev branch on github after the 'deploy to dev' workflow completes? Currently nothing happens automatically.
   2. What should be the next set of tests run in the pipeline.

Your Task:
1. Review the current cicd pipeline implementation
2. I want you to think hard about the optimal setup of the cicd pipeline after our first workflow 'deploy to dev'
   1. what should happen next
   2. what should the workflows be and what should they consist of, given the current implementation of 'deploy to dev'