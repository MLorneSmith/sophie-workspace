# Quality Gate Implementation Guide

## Overview

This guide explains how to implement and enforce quality gates throughout the AAFD methodology using our agent-based system.

## Quality Gate Architecture

### 1. Gate Components

Each quality gate consists of:
- **Validator Agent**: The agent responsible for quality assessment
- **Criteria Set**: Specific checks to perform
- **Severity Levels**: Critical, Major, Minor classifications
- **Actions**: What happens on pass/fail

### 2. Gate Timing

Quality gates are enforced at phase transitions:
1. PRD → Technical Chunking
2. Chunks → Stakeholder Validation
3. Validation → User Stories
4. Stories → Sprint Planning
5. Sprint → Implementation
6. Implementation → Completion

## Implementation Patterns

### 1. Synchronous Validation Pattern

```xml
<quality_gate_check>
  <request>
    <from>Product Owner Agent</from>
    <to>Critic Agent</to>
    <artifact>PRD</artifact>
    <gate>prd_to_chunking</gate>
  </request>
  
  <validation>
    <criteria_checked>
      - completeness: PASS
      - clarity: PASS
      - feasibility: FAIL (timeline unrealistic)
      - testability: PASS
    </criteria_checked>
    <overall_result>FAIL</overall_result>
    <severity>CRITICAL</severity>
  </validation>
  
  <response>
    <action>RETURN_FOR_REVISION</action>
    <feedback>
      <issue>Timeline of 2 weeks insufficient for scope</issue>
      <recommendation>Either reduce scope or extend to 4 weeks</recommendation>
    </feedback>
  </response>
</quality_gate_check>
```

### 2. Continuous Validation Pattern

```xml
<continuous_validation>
  <agent>Reviewer Agent</agent>
  <monitors>Code Implementation</monitors>
  <frequency>After each commit</frequency>
  <checks>
    - Code standards compliance
    - Security vulnerabilities
    - Performance regressions
    - Test coverage
  </checks>
  <escalation>
    <condition>Critical issue found</condition>
    <action>Activate Fixer Agent</action>
  </escalation>
</continuous_validation>
```

## Gate Enforcement Mechanisms

### 1. Automated Checks

```yaml
automated_checks:
  prd_completeness:
    type: structural
    implementation: |
      def check_prd_completeness(prd):
          required_sections = [
              'executive_summary',
              'objectives_and_metrics',
              'target_users',
              'feature_specification',
              'technical_requirements',
              'scope_and_constraints',
              'risks_and_mitigation'
          ]
          return all(section in prd for section in required_sections)
  
  invest_compliance:
    type: semantic
    implementation: |
      def check_invest_compliance(story):
          checks = {
              'independent': check_no_dependencies(story),
              'negotiable': check_flexibility(story),
              'valuable': check_user_value(story),
              'estimable': check_has_estimate(story),
              'small': check_size_limit(story),
              'testable': check_acceptance_criteria(story)
          }
          return all(checks.values())
```

### 2. Manual Validation Points

```yaml
manual_validation:
  stakeholder_approval:
    validator: Product Owner Agent
    method: Review session facilitation
    outputs:
      - Approval status
      - Feedback items
      - Action items
      
  technical_feasibility:
    validator: Builder Agent
    method: Technical review
    outputs:
      - Feasibility assessment
      - Risk identification
      - Alternative approaches
```

## Integration with GitHub Projects

### 1. Gate Status Tracking

```bash
# Update issue when gate passes
gh issue edit {ISSUE_NUMBER} \
  --add-field "Quality Gate Status=Passed" \
  --add-field "Gate Validator=Critic Agent" \
  --add-field "Validation Date=$(date -I)"

# Add gate result as comment
gh issue comment {ISSUE_NUMBER} \
  --body "✅ Quality Gate Passed: PRD to Chunking
  
  Validation Results:
  - Completeness: ✓
  - Clarity: ✓
  - Feasibility: ✓
  - Testability: ✓
  
  PRD approved for technical chunking phase."
```

### 2. Gate Failure Handling

```bash
# Update issue on gate failure
gh issue edit {ISSUE_NUMBER} \
  --add-field "Quality Gate Status=Failed" \
  --add-field "Blocked Reason=Quality Gate" \
  --add-label "needs-revision"

# Move to appropriate column
gh project item-edit \
  --id {ITEM_ID} \
  --field "Status=Needs Revision" \
  --field "Blocked=true"
```

## Feedback Loop Implementation

### 1. Immediate Feedback

```yaml
immediate_feedback:
  trigger: Quality gate failure
  actions:
    - Return artifact to originating agent
    - Provide specific failure reasons
    - Suggest concrete improvements
    - Set revision deadline
```

### 2. Trend Analysis

```yaml
trend_analysis:
  frequency: Weekly
  metrics:
    - Gate pass rate by phase
    - Common failure reasons
    - Average revision cycles
    - Time to gate completion
  actions:
    - Update agent training data
    - Refine gate criteria
    - Improve templates
```

## Quality Gate Dashboards

### 1. Real-time Status

```yaml
dashboard_widgets:
  current_gates:
    display: Active quality gate checks
    fields:
      - Artifact ID
      - Gate Type
      - Validator
      - Status
      - Duration
      
  gate_metrics:
    display: Gate performance metrics
    fields:
      - Pass rate (24h, 7d, 30d)
      - Average duration
      - Revision rate
      - Blocker frequency
```

### 2. Historical Analysis

```yaml
historical_reports:
  gate_effectiveness:
    period: Monthly
    metrics:
      - Defect escape rate
      - Rework percentage
      - Cycle time impact
      - Quality improvement trend
```

## Best Practices

### 1. Gate Design

- Keep criteria objective and measurable
- Balance thoroughness with development velocity
- Allow for context-specific exceptions
- Regularly review and update criteria

### 2. Agent Collaboration

- Clear handoff protocols between agents
- Shared understanding of quality standards
- Constructive feedback mechanisms
- Continuous improvement mindset

### 3. Process Optimization

- Monitor gate performance metrics
- Identify bottlenecks and optimize
- Automate where possible
- Maintain human oversight for exceptions

## Troubleshooting

### Common Issues

1. **Gate Taking Too Long**
   - Review criteria complexity
   - Optimize validation algorithms
   - Consider parallel validation

2. **High Failure Rate**
   - Analyze common failure patterns
   - Improve upstream templates
   - Enhance agent training

3. **Inconsistent Results**
   - Standardize validation criteria
   - Improve agent prompts
   - Add validation examples

### Escalation Procedures

```yaml
escalation_matrix:
  level_1:
    condition: Gate blocked > 30 minutes
    action: Notify alternate validator
    
  level_2:
    condition: Gate blocked > 2 hours
    action: Human intervention required
    
  level_3:
    condition: Repeated gate failures
    action: Process review meeting
```