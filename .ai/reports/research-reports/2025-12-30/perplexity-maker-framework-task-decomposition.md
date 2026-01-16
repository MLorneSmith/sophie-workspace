# Perplexity Research: MAKER Framework for AI Task Decomposition

**Date**: 2025-12-30
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Comprehensive research on the MAKER framework (Maximal Agentic Decomposition, K-threshold Error correction, and Red-flagging) from the arXiv paper "Solving a Million-Step LLM Task with Zero Errors" (arXiv:2511.09030). Focus areas included:
- The m=1 principle for atomic actions
- The 750-token rule threshold
- First-to-ahead-by-k voting mechanism
- Red-flagging validation rules
- Checkpointing for failure recovery
- Implementation patterns for Claude Code slash commands

---

## Key Findings

### 1. The m=1 Principle (Atomic Actions)

**Definition**: Maximal Agentic Decomposition (MAD) divides tasks into the smallest possible subproblems - **one atomic action or single decision per microagent**.

**Actionable Criteria**:
- Each microagent receives ONLY:
  - The current state (minimal context)
  - The immediate rule/instruction for that step
- Reject decompositions exceeding one decision
- Good: "Move disk 1 from A to B"
- Bad: "Plan and move disks" (multiple decisions)

**Why It Works**:
- Prevents context drift (LLMs degrade with growing context)
- Isolates errors to single steps
- Enables parallel execution
- Allows use of smaller, cheaper LLMs (GPT-4.1-mini outperformed larger models)

**Granularity Test**: If a task can be broken into two independent decisions, it MUST be split.

---

### 2. The 750-Token Rule

**Threshold**: ~700-750 tokens maximum context per microagent.

**Research Evidence**:
- Error rate increases **precipitously** once responses exceed ~700 tokens
- Shorter responses: error rates ~1-in-1000 (0.1%)
- Longer responses (>700 tokens): error rates jump to ~10%

**Actionable Criteria**:
- Trim prompts to ≤750 tokens (including state, instructions, tools)
- Measure via tokenizer (e.g., tiktoken for GPT models)
- If over 750 tokens: split into sequential m=1 agents
- Treat long outputs as a RED FLAG for logic errors

**Why This Threshold**:
- Relates to LLM attention span and focus
- Longer responses indicate "overthinking" - agent stuck in analysis loop
- Excessive verbosity correlates with confused reasoning

---

### 3. First-to-Ahead-by-K Voting Mechanism

**Definition**: Multiple agents (e.g., 5-10) independently attempt the same atomic step. The first action gaining **k votes ahead** of competitors wins.

**Mathematical Foundation** (from Gambler's Ruin problem):
- Required margin k_min grows **logarithmically** with total steps: Θ(ln s)
- Total cost scales **log-linearly**: Θ(s ln s)
- For 1M steps: k=3 was sufficient
- For 1B steps: k might only need to be 4

**Actionable Criteria**:
```
k_min for target success rate t:
k ≥ ln(1/t) / ln(1-2q+2p)

where:
- p = single-step success probability
- q = 1 - p (failure probability)
- t = target overall success probability (e.g., 0.95)
```

**Implementation Pattern**:
1. Spawn 3+ parallel requests for each step (k_min = 3 typical)
2. First request at temperature=0 (deterministic best guess)
3. Subsequent at temperature=0.1 (slight variation for diversity)
4. Count valid votes after red-flag filtering
5. Accept when one option leads by k votes
6. If no winner after N rounds, escalate or resample

**Critical Finding**: Cost does NOT explode because k grows logarithmically, not linearly with task size.

---

### 4. Red-Flagging Validation Rules

**Purpose**: Discard responses showing signs of unreliability BEFORE voting to prevent error propagation.

**Primary Red Flags**:

| Flag | Threshold | Rationale |
|------|-----------|-----------|
| **Response length** | >700 tokens | Overthinking/confusion indicator |
| **Format violations** | Any deviation | Syntax errors correlate with logic errors |
| **Invalid JSON/structure** | Any parse failure | Don't repair - discard entirely |

**Critical Insight**: When an LLM makes a syntax error, it's a signal the underlying reasoning is flawed. **Never try to repair** - always discard and resample.

**Actionable Criteria**:
```python
def red_flag_check(response):
    # Flag 1: Length check
    if token_count(response) > 700:
        return True  # RED FLAG
    
    # Flag 2: Format validation
    if not matches_expected_format(response):
        return True  # RED FLAG
    
    # Flag 3: Schema validation
    try:
        parse_strict(response)  # No lenient parsing!
    except ParseError:
        return True  # RED FLAG
    
    return False  # Valid response
```

**Do NOT**:
- Use "repairing parsers" that fix JSON
- Allow partial format matches
- Count invalid responses as votes

---

### 5. Checkpointing & Failure Recovery

**Note**: The original MAKER paper focuses on the theoretical framework; checkpointing specifics are implementation-dependent.

**Recommended Pattern** (derived from research):

**State Object Architecture**:
```typescript
interface CheckpointState {
  step_id: number;
  state_hash: string;
  current_state: TaskState;
  output: StepResult;
  timestamp: Date;
}
```

**Checkpoint Strategy**:
- Save every N steps (e.g., every 100 or 1% of total)
- Always checkpoint after successful vote consensus
- Store last 10 steps in "red-flag buffer" for recovery analysis

**Recovery Protocol**:
1. On failure, load last valid checkpoint
2. Replay from checkpoint (state is deterministic)
3. Red-flag buffer helps identify problematic patterns
4. If same step fails repeatedly, escalate (increase k, change model)

---

### 6. The Execution Pipeline

While MAKER doesn't define exactly 7 stages, the research reveals this effective pipeline:

**Stage 1: Decomposition (MAD)**
- Break task into atomic m=1 subtasks
- Define state object structure
- Determine total step count (if knowable)

**Stage 2: Prompt Generation**
- Craft minimal ≤750-token prompts per step
- Include ONLY: current state + single instruction
- NO history, NO prior reasoning

**Stage 3: Parallel Execution**
- Spawn n voter agents (typically 5-10)
- First at temp=0, rest at temp=0.1
- Execute asynchronously for speed

**Stage 4: Red-Flag Filtering**
- Discard long responses (>700 tokens)
- Discard format violations
- Only valid responses proceed to voting

**Stage 5: First-to-K Voting**
- Count valid votes per action
- Check if leader ahead by k
- If no winner, sample more agents

**Stage 6: State Update & Checkpoint**
- Apply winning action to state object
- Save checkpoint if at interval
- Pass new state to next cycle

**Stage 7: Aggregation/Completion**
- Merge outputs for final result
- Verify terminal state reached
- Report success/failure

---

### 7. Pattern Caching (Theoretical)

**Concept**: Store successful decomposition patterns for reuse.

**Recommended Implementation**:
```typescript
interface DecompositionCache {
  // Hash of task type + input characteristics
  pattern_hash: string;
  
  // Successful decomposition template
  decomposition: AtomicStep[];
  
  // Success metrics
  success_rate: number;
  avg_voting_rounds: number;
  
  // Metadata
  created_at: Date;
  use_count: number;
}
```

**Cache Strategy**:
- Hash task patterns (task_type + goal_structure)
- Query for similarity > 0.9
- Target hit rate > 70% for repeated task types
- LRU eviction after 1000 entries

---

### 8. Agent Roles in MAKER

MAKER uses **identical microagents** rather than specialized roles. However, functional responsibilities exist:

| Function | Responsibility | Implementation |
|----------|---------------|----------------|
| **Decomposer** | Breaks task into m=1 steps | Initial planning phase |
| **Microagent/Executor** | Solves single atomic step | Stateless, minimal context |
| **Red-Flag Filter** | Validates output format/length | Pre-voting validation |
| **Voter/Counter** | Tallies valid responses | First-to-k consensus |
| **State Manager** | Updates shared state | Post-consensus update |
| **Checkpoint Saver** | Persists recovery points | Interval-based persistence |

**Key Insight**: The power comes from **quantity over specialization** - millions of identical simple agents outperform complex specialized ones.

---

## Research Paper Key Metrics (arXiv:2511.09030)

### Error Rates at Different Decomposition Levels

| Decomposition Level | Per-Step Error Rate | Task Completion |
|--------------------|--------------------:|-----------------|
| Monolithic (m=large) | ~1% | Fails at ~100 steps |
| Partial (m=10) | Exponential growth | Fails at ~1000 steps |
| **Maximal (m=1)** | ~0.1% | **1M+ steps, 0 errors** |

### Model Performance Comparison

| Model | Cost/Step | Per-Step Accuracy | Notes |
|-------|-----------|-------------------|-------|
| GPT-4.1-mini | Lowest | 99.9%+ | **Best choice** |
| GPT-oss-20B | Low | 99.9%+ | Best open-source |
| Larger reasoning models | High | No improvement | Overkill for m=1 |

**Critical Finding**: Smaller, non-reasoning models provide best reliability-per-dollar when combined with MAKER architecture.

### Scaling Laws

```
Total Cost = O(s * ln(s))

where:
- s = total number of steps
- ln(s) = logarithmic factor for voting margin

For m > 1 (non-maximal decomposition):
Total Cost = O(exponential) - FAILS
```

---

## Actionable Criteria for Claude Code Slash Command

### Task Decomposition Rules

```yaml
decomposition:
  # Atomic action definition
  atomic_criteria:
    - single_decision: true          # One decision per agent
    - max_tokens: 750                 # Context window limit
    - no_history: true               # No chat history in prompt
    - stateless: true                # Agent dies after execution
  
  # Granularity test
  split_if:
    - contains_multiple_decisions: true
    - requires_planning_before_action: true
    - context_exceeds_750_tokens: true
```

### Voting Configuration

```yaml
voting:
  min_voters: 3                      # k_min baseline
  k_threshold: 3                     # First-to-ahead-by-k
  temperature_first: 0.0             # Deterministic first vote
  temperature_rest: 0.1              # Slight variation
  max_rounds: 100                    # Safety limit
  timeout_per_round_ms: 5000         # 5 seconds
```

### Red-Flag Rules

```yaml
red_flags:
  max_response_tokens: 700           # Hard cutoff
  require_exact_format: true         # No lenient parsing
  discard_on_parse_error: true       # Never repair
  retry_on_flag: true                # Resample, don't fail
  max_retries: 5                     # Before escalation
```

### Checkpoint Strategy

```yaml
checkpointing:
  interval_steps: 100                # Or 1% of total
  save_after_consensus: true         # Every successful vote
  buffer_size: 10                    # Last N steps for analysis
  storage: "durable"                 # Redis, DB, or file
```

---

## Sources & Citations

1. **Primary Paper**: [Solving a Million-Step LLM Task with Zero Errors](https://arxiv.org/abs/2511.09030) - Meyerson et al., Cognizant AI Lab, Nov 2025
2. **arXiv HTML**: https://arxiv.org/html/2511.09030v1
3. **Summary Blog**: https://nicklaunches.com/blog/maker-million-step-agents/
4. **Technical Analysis**: https://sanj.dev/post/2025-11-20-maker-framework
5. **ArXiv IQ Summary**: https://arxiviq.substack.com/p/solving-a-million-step-llm-task-with
6. **GitHub (Related)**: https://github.com/cognizant-ai-lab/neuro-san-benchmarking

---

## Key Takeaways

1. **Reliability is architecture, not model size**: Smaller models + MAKER > larger models alone
2. **m=1 is non-negotiable**: Every task must decompose to single atomic decisions
3. **750 tokens is the magic number**: Beyond this, error rates spike
4. **Syntax errors = logic errors**: Never repair, always discard
5. **Log-linear scaling**: k grows logarithmically, making million-step tasks economically feasible
6. **Statelessness prevents drift**: Kill context history, use state objects only
7. **Voting is cheap**: The overhead is minimal compared to the reliability gain

---

## Related Searches

- MDAP framework implementation patterns
- Multi-agent voting systems for LLM reliability
- Microservices architecture parallels in AI agents
- Error correction in stochastic systems
- Tower of Hanoi benchmarks for LLM reasoning
