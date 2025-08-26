A cicd investigattion orchestrator.

The agent should first read the context document inventory: .claude/context/.context-docs-inventory.xml to identify the appropriate cicd pipeline context documents to read. The agent should then read those cicd pipeline context documents. 

The agent should then envoke the .claude/agents/cicd-investigator.md agent to investigate the pipeline failure.

Once the .claude/agents/cicd-investigator.md agent reports back, the orchestrator should ebnvoke the .claude/agents/log-issue.md agent to log an issue in github.

The agent should the report back to the user what the root cause of teh issue was and the github issue number