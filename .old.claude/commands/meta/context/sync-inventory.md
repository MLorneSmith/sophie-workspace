---
description: Execute comprehensive context inventory synchronization with filesystem validation, token optimization, and dependency graph management
category: context
allowed-tools: [Bash(node:*), Write, Edit, Bash, Read, Glob, Task]
mcp-tools: [context7, exa]
delegation-targets: [refactoring-expert, testing-expert, nodejs-expert]
argument-hint: "[--verbose] [--dry-run] [--rebuild-graph]"
---

# Context Inventory Synchronization

## PURPOSE

Execute comprehensive synchronization between context inventory JSON and filesystem state to maintain perfect alignment, optimize token counts, and ensure accurate dependency tracking. This command provides automated bidirectional sync with intelligent categorization, progress visualization, and robust error recovery for enterprise-grade context management.

### Primary Objectives

- Synchronize inventory JSON with actual filesystem state
- Update accurate token counts for all context files
- Rebuild dependency graphs with validated relationships
- Provide detailed analytics and validation reports
- Maintain backup and recovery mechanisms

### Business Value

- Ensures context system integrity and reliability
- Optimizes token usage for cost-effective AI operations
- Enables accurate dependency tracking for system evolution
- Provides comprehensive audit trail for context management

## ROLE

Assume the role of Senior Context Synchronization Engineer with expertise in:

- **Filesystem Operations**: Advanced file scanning, metadata extraction, and batch processing
- **Data Integrity**: JSON validation, backup management, and atomic operations
- **Token Optimization**: Accurate counting algorithms and performance optimization
- **Dependency Analysis**: Graph theory application and relationship validation
- **Error Recovery**: Graceful degradation and automatic restoration mechanisms

### Responsibilities

- Execute fail-safe synchronization procedures
- Validate data integrity at every stage
- Provide comprehensive progress reporting
- Implement robust error handling and recovery
- Optimize performance for large context inventories

### Authority Level

- Full read/write access to .claude/data/ directory
- Execute Node.js scripts and system commands
- Delegate complex operations to specialist agents
- Create backups and modify inventory structures
- Generate detailed analytical reports

## INPUTS

### Required Context Files

```yaml
Essential:
  - .claude/data/context-inventory.json       # Current inventory state
  - .claude/scripts/inventories/sync-context-inventory.cjs  # Primary sync engine
  - .claude/scripts/analysis/token-counter.cjs         # Token counting utility

Supporting:
  - .claude/context/**/*.md                   # All context documentation
  - .claude/data/context-graph.json          # Dependency relationships
  - .claude/scripts/inventories/rebuild-context-graph.cjs  # Graph rebuilder
```

### Command Arguments

```bash
# Standard execution
/meta/context/sync-inventory

# Verbose output with detailed progress
/meta/context/sync-inventory --verbose

# Preview mode without modifications
/meta/context/sync-inventory --dry-run

# Include dependency graph rebuild
/meta/context/sync-inventory --rebuild-graph

# Combined options
/meta/context/sync-inventory --verbose --rebuild-graph
```

### Environment Requirements

- Node.js runtime with file system access
- Write permissions to .claude/data/ directory
- Available disk space for backup operations
- Memory allocation for large inventory processing

### Dynamic Context Loading

Implement intelligent context discovery using MCP servers:

```yaml
Context7:
  - Query: "context inventory synchronization patterns"
  - Focus: "filesystem sync, token counting, graph management"
  - Scope: "documentation systems, metadata extraction"

Exa Search:
  - Terms: "context management best practices"
  - Domain: "software documentation, data synchronization"
  - Type: "technical implementation guides"
```

## METHOD

### Implementation Workflow

Execute systematic synchronization process with comprehensive validation, progress tracking, and error recovery mechanisms.

#### Phase 1: Initialize Environment and Validate Prerequisites

**Step 1.1: Parse Command Arguments**

```bash
# Extract command line flags with validation
   ```bash
   VERBOSE=$(echo "$1" | grep -q "\-\-verbose" && echo "true" || echo "false")
   DRY_RUN=$(echo "$1" | grep -q "\-\-dry-run" && echo "true" || echo "false")
   REBUILD_GRAPH=$(echo "$1" | grep -q "\-\-rebuild-graph" && echo "true" || echo "false")
   ```

**Step 1.2: Validate Environment Setup**

```bash
# Verify required files and permissions
   ```bash
   # Check required files exist
   if [[ ! -f ".claude/scripts/inventories/sync-context-inventory.cjs" ]]; then
     echo "❌ sync-context-inventory.cjs not found"
     exit 1
   fi

   if [[ ! -f ".claude/data/context-inventory.json" ]]; then
     echo "⚠️  No existing inventory found - will create new"
   fi
   ```

**Step 1.3: Create Timestamped Backup**

```bash
# Generate backup with recovery metadata
   ```bash
   if [[ -f ".claude/data/context-inventory.json" ]]; then
     cp ".claude/data/context-inventory.json" \
        ".claude/data/context-inventory.backup.$(date +%Y%m%d_%H%M%S).json"
     echo "✅ Backup created"
   fi
   ```

#### Phase 2: Execute Dynamic Context Discovery

**Step 2.1: Delegate to Context Discovery Expert**

Delegate intelligent context discovery to specialist agent for optimized synchronization strategies:

```bash
# Execute context discovery delegation
Task tool parameters:
  subagent_type: "refactoring-expert"
  description: "Analyze context inventory synchronization patterns"
  prompt: "Examine context inventory structure and sync requirements.
           Task type: system-analysis
           Token budget: 2000
           Focus areas: inventory schemas, sync algorithms, validation patterns
           Priority: existing inventory structure, sync script architecture

           Analyze:
           1. Current inventory.json schema and categorization
           2. Sync script implementation patterns
           3. Token counting accuracy requirements
           4. Dependency graph relationship validation
           5. Error recovery and backup strategies

           Provide optimized synchronization approach."

# Process expert recommendations
Implement discovered optimization patterns in sync execution.
```

**Step 2.2: Query MCP Servers for Best Practices**

```bash
# Leverage context7 for documentation patterns
mcp__context7__get-library-docs:
  context7CompatibleLibraryID: "/filesystem/sync"
  topic: "inventory management"
  tokens: 1500

# Use exa for current synchronization techniques
mcp__exa__exa_search:
  query: "context inventory synchronization filesystem validation 2024"
  category: "research paper"
  num_results: 3
  type: "neural"
```

#### Phase 3: Execute Pre-Synchronization Analysis

**Step 3.1: Analyze Filesystem State**
Scan and categorize all context files for comprehensive analysis:

   ```bash
   echo "📊 Analyzing context directory structure..."
   find .claude/context -type f \( -name "*.md" -o -name "*.xml" \) | wc -l
   ```

**Step 3.2: Extract Current Inventory Metrics**

   ```bash
   if [[ -f ".claude/data/context-inventory.json" ]]; then
     CURRENT_COUNT=$(node -e "
       const inv = require('./.claude/data/context-inventory.json');
       console.log(Object.values(inv).reduce((sum, cat) => sum + cat.docs.length, 0));
     ")
     echo "Current inventory: $CURRENT_COUNT files"
   fi
   ```

**Step 3.3: Generate Synchronization Preview**

   ```bash
   if [[ "$VERBOSE" == "true" ]]; then
     echo "📋 Files to process:"
     find .claude/context -type f -name "*.md" | head -10
     echo "... and more"
   fi
   ```

#### Phase 4: Execute Primary Synchronization Process

**Step 4.1: Run Core Synchronization Engine**
Execute primary sync script with comprehensive error handling and progress tracking:

   ```bash
   echo "🔄 Starting synchronization..."

   # Build command with options
   SYNC_CMD="node .claude/scripts/inventories/sync-context-inventory.cjs"
   [[ "$DRY_RUN" == "true" ]] && SYNC_CMD="$SYNC_CMD --dry-run"
   [[ "$VERBOSE" == "true" ]] && SYNC_CMD="$SYNC_CMD --verbose"

   # Execute with progress tracking
   OUTPUT=$($SYNC_CMD 2>&1)
   SYNC_STATUS=$?

   if [[ $SYNC_STATUS -eq 0 ]]; then
     echo "✅ Synchronization completed successfully"
     echo "$OUTPUT" | grep -E "Added:|Updated:|Removed:|Total:" || echo "$OUTPUT"
   else
     echo "❌ Synchronization failed"
     echo "$OUTPUT"
     # Attempt recovery
     echo "🔧 Attempting recovery..."
     if [[ -f ".claude/data/context-inventory.backup.*.json" ]]; then
       LATEST_BACKUP=$(ls -t .claude/data/context-inventory.backup.*.json | head -1)
       cp "$LATEST_BACKUP" ".claude/data/context-inventory.json"
       echo "✅ Restored from backup: $LATEST_BACKUP"
     fi
     exit 1
   fi
   ```

**Step 4.2: Optimize Token Counts with Validation**

   ```bash
   echo "📊 Updating token counts..."
   node -e "
     const fs = require('fs');
     const path = require('path');
     const { execSync } = require('child_process');

     const inventory = JSON.parse(
       fs.readFileSync('.claude/data/context-inventory.json', 'utf8')
     );

     let totalTokens = 0;
     let updatedCount = 0;

     for (const category of Object.values(inventory)) {
       for (const doc of category.docs) {
         try {
           const output = execSync(
             \`node .claude/scripts/analysis/token-counter.cjs '.claude/context/\${doc.path}'\`,
             { encoding: 'utf8' }
           );
           const tokens = parseInt(output.match(/(\d+)/)?.[1] || '0');
           if (tokens !== doc.tokens) {
             doc.tokens = tokens;
             updatedCount++;
           }
           totalTokens += tokens;
         } catch (e) {
           console.error(\`Failed to count tokens for \${doc.path}\`);
         }
       }
     }

     fs.writeFileSync(
       '.claude/data/context-inventory.json',
       JSON.stringify(inventory, null, 2)
     );

     console.log(\`✅ Updated \${updatedCount} token counts\`);
     console.log(\`📊 Total tokens: \${totalTokens.toLocaleString()}\`);
   "
   ```

#### Phase 5: Rebuild Dependency Relationships (Conditional)

**Step 5.1: Execute Graph Reconstruction**
Execute dependency graph rebuilding when requested or relationships require updates:

```bash
if [[ "$REBUILD_GRAPH" == "true" ]]; then
  echo "🔄 Rebuilding dependency graph..."

  node .claude/scripts/inventories/rebuild-context-graph.cjs

  if [[ $? -eq 0 ]]; then
    echo "✅ Graph rebuilt successfully"

    # Display graph stats
    node -e "
      const graph = require('./.claude/data/context-graph.json');
      const nodeCount = Object.keys(graph.nodes).length;
      const edgeCount = Object.keys(graph.edges).length;
      console.log(\`📊 Graph: \${nodeCount} nodes, \${edgeCount} edges\`);
    "
  else
    echo "⚠️  Graph rebuild failed - inventory sync still successful"
  fi
fi
```

#### Phase 6: Execute Comprehensive Validation and Analytics

**Step 6.1: Validate Inventory Integrity**
Execute thorough integrity validation across all inventory components:

   ```bash
   echo "🔍 Validating inventory..."

   node -e "
     const fs = require('fs');
     const path = require('path');
     const inventory = require('./.claude/data/context-inventory.json');

     let issues = [];
     let validCount = 0;

     // Check each file exists
     for (const [category, data] of Object.entries(inventory)) {
       for (const doc of data.docs) {
         const fullPath = path.join('.claude/context', doc.path);
         if (fs.existsSync(fullPath)) {
           validCount++;
         } else {
           issues.push(\`Missing file: \${doc.path}\`);
         }
       }
     }

     if (issues.length > 0) {
       console.log('⚠️  Validation issues found:');
       issues.slice(0, 5).forEach(i => console.log(\`  - \${i}\`));
       if (issues.length > 5) {
         console.log(\`  ... and \${issues.length - 5} more\`);
       }
     } else {
       console.log(\`✅ All \${validCount} files validated\`);
     }
   "
   ```

**Step 6.2: Generate Comprehensive Analytics Report**

   ```bash
   echo ""
   echo "📊 Synchronization Report"
   echo "========================="

   node -e "
     const inventory = require('./.claude/data/context-inventory.json');

     // Category breakdown
     console.log('\nCategory Distribution:');
     for (const [category, data] of Object.entries(inventory)) {
       const tokens = data.docs.reduce((sum, d) => sum + d.tokens, 0);
       console.log(\`  \${category}: \${data.docs.length} files, \${tokens.toLocaleString()} tokens\`);
     }

     // Top files by tokens
     const allDocs = Object.values(inventory).flatMap(c => c.docs);
     const topDocs = allDocs.sort((a, b) => b.tokens - a.tokens).slice(0, 5);

     console.log('\nLargest Files:');
     topDocs.forEach(doc => {
       console.log(\`  \${doc.title}: \${doc.tokens.toLocaleString()} tokens\`);
     });

     // Summary
     const totalDocs = allDocs.length;
     const totalTokens = allDocs.reduce((sum, d) => sum + d.tokens, 0);
     const avgTokens = Math.round(totalTokens / totalDocs);

     console.log('\nSummary:');
     console.log(\`  Total files: \${totalDocs}\`);
     console.log(\`  Total tokens: \${totalTokens.toLocaleString()}\`);
     console.log(\`  Average tokens: \${avgTokens.toLocaleString()}\`);
   "
   ```

#### Phase 7: Deliver Results and Recommendations

**Step 7.1: Present Synchronization Results**
Present final status with actionable next steps:

```bash
echo ""
echo "✅ Context Inventory Synchronized"
echo "================================"
echo ""
echo "Next steps:"
echo "  • Review large files for potential splitting"
echo "  • Check for missing documentation areas"
echo "  • Run '/context/validate' to verify relationships"
echo "  • Use '/context/search' to explore inventory"

if [[ "$DRY_RUN" == "true" ]]; then
  echo ""
  echo "ℹ️  This was a dry run - no changes were saved"
  echo "    Run without --dry-run to apply changes"
fi
```

**Step 7.2: Delegate Follow-up Analysis (if needed)**

```bash
# Delegate complex analysis to specialists when issues detected
if [[ $VALIDATION_ISSUES -gt 0 ]]; then
  # Use testing-expert for validation strategy
  Task tool:
    subagent_type: "testing-expert"
    description: "Analyze inventory validation failures"
    prompt: "Review synchronization issues and provide testing strategy.
             Focus: validation failures, data integrity, test coverage
             Scope: inventory consistency, file system alignment"

  # Use nodejs-expert for performance optimization
  Task tool:
    subagent_type: "nodejs-expert"
    description: "Optimize synchronization performance"
    prompt: "Analyze sync performance bottlenecks and optimize.
             Focus: Node.js script optimization, memory usage, I/O efficiency
             Scope: large inventory handling, batch processing"
fi
```

## EXPECTATIONS

### Success Criteria (Validation Requirements)

#### Primary Deliverables

1. **Complete Inventory Synchronization**
   - Validate all filesystem changes reflected in inventory.json
   - Confirm zero discrepancies between filesystem and inventory
   - Verify proper categorization of all context files
   - Validate metadata accuracy (titles, descriptions, paths)

2. **Accurate Token Optimization**
   - Execute token counting for 100% of inventory files
   - Validate token counts within ±5% accuracy range
   - Confirm total token budget calculations
   - Generate token distribution analytics

3. **Dependency Graph Integrity** (if --rebuild-graph)
   - Validate all relationship mappings
   - Confirm graph connectivity and cycles detection
   - Verify node and edge count accuracy
   - Test graph traversal performance

4. **Comprehensive Backup and Recovery**
   - Confirm timestamped backup creation
   - Validate backup integrity and restorability
   - Test automatic recovery mechanisms
   - Verify rollback capability

#### Performance Standards

- **Execution Time**: Complete sync within 5 minutes for <1000 files
- **Memory Usage**: Maintain <500MB peak memory consumption
- **Error Rate**: Achieve <1% file processing failure rate
- **Validation Coverage**: 100% file integrity verification

#### Quality Assurance Checkpoints

```bash
# Mandatory validation steps
1. Pre-sync: Validate environment and prerequisites
2. Mid-sync: Monitor progress and handle errors gracefully
3. Post-sync: Execute comprehensive integrity verification
4. Final: Generate detailed analytics and recommendations

# Quality gates
- All JSON files must pass schema validation
- Token counts must be within acceptable variance
- File existence must be 100% verified
- Backup restoration must be tested
```

#### Error Handling Excellence

1. **Script Dependencies**
   - Validate: Confirm sync-context-inventory.cjs exists and is executable
   - Recovery: Download from repository or recreate with fallback logic
   - Fallback: Implement basic sync using file system operations

2. **Token Counting Failures**
   - Validate: Test token-counter.cjs functionality before bulk execution
   - Recovery: Implement character-based estimation with accuracy warnings
   - Fallback: Use file size approximation with documented limitations

3. **JSON Integrity Issues**
   - Validate: Parse and schema-validate before saving
   - Recovery: Restore from timestamped backup automatically
   - Fallback: Regenerate inventory from filesystem scan

4. **Permission and Access Errors**
   - Validate: Test write permissions before operations
   - Recovery: Adjust permissions or suggest alternative locations
   - Fallback: Create temporary inventory with user guidance

5. **Memory and Performance Issues**
   - Validate: Monitor memory usage during large inventory processing
   - Recovery: Implement batch processing with progress persistence
   - Fallback: Process in smaller chunks with intermediate saves

#### Output Quality Standards

- **Progress Reporting**: Real-time status updates every 10 processed files
- **Error Communication**: Clear, actionable error messages with solutions
- **Analytics Depth**: Detailed breakdown by category, size, and token usage
- **Next Steps**: Specific, prioritized recommendations for optimization

#### Validation Checklist

```bash
# Pre-execution validation
□ Environment setup verified
□ Required scripts accessible
□ Backup strategy confirmed
□ Permissions validated

# Execution monitoring
□ Progress tracking functional
□ Error handling tested
□ Memory usage within limits
□ Performance metrics recorded

# Post-execution verification
□ Inventory-filesystem alignment confirmed
□ Token counts validated
□ Graph integrity verified (if applicable)
□ Analytics generated and reviewed
□ Recovery mechanisms tested
```

### Success Indicators

- **Zero Data Loss**: All existing inventory data preserved
- **Complete Coverage**: 100% filesystem-inventory alignment
- **Performance Excellence**: Meets or exceeds time/memory benchmarks
- **Error Resilience**: Graceful handling of all failure scenarios
- **Actionable Insights**: Clear next steps and optimization recommendations

### Advanced Patterns and Optimizations

#### Synchronization Algorithms

- **Incremental Processing**: Execute differential sync for changed files only
- **Atomic Operations**: Implement temporary files with atomic rename for safety
- **Batch Optimization**: Process files in optimal batch sizes for memory efficiency
- **Parallel Token Counting**: Execute concurrent token analysis where possible
- **Smart Categorization**: Apply ML-based category inference for new files

#### Performance Optimization

- **Memory Management**: Stream large files instead of loading entirely
- **I/O Efficiency**: Minimize filesystem operations through intelligent caching
- **Progress Persistence**: Save intermediate state for resumable operations
- **Resource Monitoring**: Track CPU, memory, and disk usage throughout sync

#### Enterprise Integration

- **Audit Logging**: Maintain detailed operation logs for compliance
- **Metrics Collection**: Export performance metrics for monitoring systems
- **Configuration Management**: Support environment-specific sync parameters
- **Health Checks**: Implement continuous inventory health monitoring

---

## Command Reference

**Execute comprehensive context inventory synchronization**

### Usage Patterns

```bash
# Standard synchronization with progress reporting
/meta/context/sync-inventory

# Detailed execution with full diagnostic output
/meta/context/sync-inventory --verbose

# Preview changes without modification (safety check)
/meta/context/sync-inventory --dry-run

# Complete synchronization with dependency graph rebuild
/meta/context/sync-inventory --rebuild-graph

# Maximum detail with all options (debugging mode)
/meta/context/sync-inventory --verbose --rebuild-graph
```

### Process Overview

1. **Initialize**: Environment validation and backup creation
2. **Discover**: Dynamic context loading and filesystem analysis
3. **Synchronize**: Execute primary sync with token optimization
4. **Validate**: Comprehensive integrity verification
5. **Report**: Generate analytics and actionable recommendations

### System Requirements

- Node.js runtime with file system access
- Write permissions to .claude/data/ directory
- Available sync scripts: sync-context-inventory.cjs, token-counter.cjs
- Memory allocation for large inventory processing (500MB recommended)

### Integration Points

- **MCP Servers**: context7 for documentation patterns, exa for best practices
- **Agent Delegation**: refactoring-expert, testing-expert, nodejs-expert
- **Dynamic Context**: Intelligent context discovery and optimization

**Result**: Synchronized, optimized, and validated context inventory with comprehensive analytics and recommendations.
