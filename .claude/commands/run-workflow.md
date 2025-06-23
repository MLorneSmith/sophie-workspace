# Workflow Command

Usage: `/run-workflow [workflow_name]`

This command loads and executes a workflow file from the `.claude/workflows/` directory based on the workflow name provided.

## How It Works

When you run `/workflow [name]`, the command will:

1. Look for a file at `.claude/workflows/[name].md`
2. Read and execute the workflow instructions
3. Handle any parameters passed to the specific workflow

## Usage Examples

```
/workflow feature-development
/workflow bug-fix
/workflow code-review
/workflow performance-optimization
/workflow security-audit
```

## Command Execution Steps

### 1. Parse Command Input

Extract the workflow name from the command:

```typescript
const workflowName = commandArgs[0];
if (!workflowName) {
  console.log("Please specify a workflow name. Usage: /workflow [workflow_name]");
  return;
}
```

### 2. Load Workflow File

Attempt to read the corresponding workflow file:

```
/read .claude/workflows/${workflowName}.md
```

If the file doesn't exist, list available workflows:

```bash
ls .claude/workflows/*.md
```

### 3. Execute Workflow

Once the workflow file is loaded, follow its instructions. Each workflow file should contain:

- Clear objectives
- Step-by-step instructions
- Required context or role adoption
- Success criteria

## Error Handling

If the specified workflow doesn't exist:

```
Workflow '[name]' not found in .claude/workflows/
Available workflows:
- feature-development
- bug-fix
- code-review
- [other available workflows]
```
