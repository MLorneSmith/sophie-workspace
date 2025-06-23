# Quiz Management Scripts Cleanup Plan

## 1. Current Situation

The content migration system includes numerous scripts in the `packages/content-migrations/src/scripts/repair/quiz-management` directory to address various issues with quizzes. As a result of iterative development and multiple approaches to fixing quiz relationship issues, we have accumulated several scripts with overlapping functionality.

Current status:

- 19 files total in the quiz management directory
  - 14 TypeScript (.ts) files
  - 4 SQL (.sql) files
  - 1 README.md
- These scripts attempt to fix various quiz-related issues through different approaches
- Most scripts are referenced in the orchestration scripts

## 2. Issues Identified

### 2.1 Quiz Collection Issues

The quiz collection has experienced several persistent issues:

- Empty quizzes problem (14 specific quizzes don't display any content)
- Missing quiz questions association (questions exist but aren't properly linked to parent quizzes)
- Missing course IDs (quizzes have `course_id_id = NULL`)

### 2.2 Root Cause Analysis

Payload CMS uses a dual storage mechanism for relationships:

1. **Direct Field Storage** - References stored directly in document tables (e.g., `course_id_id`)
2. **Relationship Tables Storage** - Separate tables (e.g., `payload.course_quizzes_rels`) for complex operations

Previous fixes often addressed only one side of this dual-storage system, resulting in inconsistencies.

### 2.3 Script Duplication and Overlap

Multiple scripts attempt to solve similar problems with slightly different approaches:

- Some scripts focus on unidirectional relationships
- Others try to fix bidirectional relationships
- Several scripts modify the same relationships in different ways
- Many scripts have overlapping SQL operations

## 3. Script Analysis

### 3.1 Core Scripts (Used in Main Flow)

These scripts are directly called in the main migration process:

1. **fix-quiz-id-consistency.ts**

   - Purpose: Ensures consistent quiz IDs across collections
   - Called in: Processing phase (generate-sql-seed-files)
   - Status: Essential script, should be kept

2. **fix-lesson-quiz-references.ts**

   - Purpose: Fixes references between lessons and quizzes
   - Called in: Processing phase (fix-references)
   - Status: Essential script, should be kept

3. **fix-lessons-quiz-references-sql.ts**

   - Purpose: SQL-based fixes for lesson-quiz references
   - Called in: Processing phase (fix-references)
   - Status: Essential script, should be kept

4. **fix-questions-quiz-references.ts**

   - Purpose: Fixes references between quizzes and questions
   - Called in: Processing phase (fix-references)
   - Status: Essential script, should be kept

5. **run-direct-quiz-fix.ts / direct-quiz-fix.sql**
   - Purpose: Comprehensive SQL fix for all quiz relationship issues
   - Called in: Loading phase (fix-relationships)
   - Status: Core comprehensive fix, should be kept and enhanced

### 3.2 Specialized Fixes (Used in Loading Phase)

6. **fix-quiz-question-relationships.ts**

   - Purpose: Fixes relationships between quizzes and questions
   - Called in: Loading phase (fix-relationships)
   - Status: Has specific functionality, should be kept

7. **fix-quizzes-without-questions.ts**

   - Purpose: Handles quizzes that lack questions
   - Called in: Loading phase (fix-relationships)
   - Status: Addresses a specific case, should be kept

8. **fix-lesson-quiz-field-name.ts**

   - Purpose: Ensures consistency in field names
   - Called in: Loading phase (fix-relationships)
   - Status: Handles specific field renaming, should be kept

9. **fix-invalid-quiz-references.ts**
   - Purpose: Fixes invalid quiz references in lessons
   - Called in: Loading phase (fix-relationships)
   - Status: Has specific validation logic, should be kept

### 3.3 Overlapping/Redundant Scripts

10. **fix-quiz-relationships-complete.ts/sql**

    - Purpose: Comprehensive relationship fix
    - Called in: Loading phase (fix-relationships)
    - Status: Overlaps with direct-quiz-fix, can be merged or removed

11. **fix-unidirectional-quiz-relationships.ts/sql**

    - Purpose: Implements unidirectional relationship model
    - Called in: Loading phase (fix-relationships)
    - Status: Overlaps with fix-course-quiz-relationships, can be consolidated

12. **fix-course-quiz-relationships.ts/sql**

    - Purpose: Fixes course-quiz relationships with dual storage approach
    - Called in: Loading phase (fix-relationships)
    - Status: Overlaps with fix-unidirectional-quiz-relationships, should be kept but enhanced

13. **fix-course-ids-final.ts/sql**

    - Purpose: Final cleanup of course IDs
    - Called in: Loading phase (fix-relationships)
    - Status: Overlaps with fix-quiz-course-ids, can be consolidated

14. **fix-quiz-course-ids.ts**
    - Purpose: Ensures quizzes have correct course IDs using hooks approach
    - Called in: Loading phase (fix-relationships)
    - Status: Overlaps with fix-course-ids-final, can be consolidated

## 4. Cleanup Plan

### 4.1 Consolidate Overlapping Scripts

1. **Merge Course ID Scripts:**

   - Consolidate `fix-course-ids-final.ts/sql` and `fix-quiz-course-ids.ts`
   - Keep the name `fix-quiz-course-ids.ts`
   - Ensure new script handles both direct fields and relationship tables
   - Include verification steps from both approaches

2. **Consolidate Relationship Fixes:**

   - Merge `fix-unidirectional-quiz-relationships.ts/sql` and `fix-course-quiz-relationships.ts/sql`
   - Keep the name `fix-course-quiz-relationships.ts/sql`
   - Incorporate the unique aspects of the unidirectional approach
   - Preserve transaction safety and dual-storage handling from both scripts

3. **Enhance the Direct Quiz Fix:**
   - Update `run-direct-quiz-fix.ts` and `direct-quiz-fix.sql`
   - Include any unique features from `fix-quiz-relationships-complete.ts/sql`
   - After verification, mark `fix-quiz-relationships-complete.ts/sql` for removal

### 4.2 Update Package.json References

Update the script references in `packages/content-migrations/package.json`:

```json
"fix:quiz-course-ids": "tsx src/scripts/repair/quiz-management/fix-quiz-course-ids.ts",
"fix:course-quiz-relationships": "tsx src/scripts/repair/quiz-management/fix-course-quiz-relationships.ts",
"fix:direct-quiz-fix": "tsx src/scripts/repair/quiz-management/run-direct-quiz-fix.ts",
```

### 4.3 Update Orchestration Script

Modify the `Fix-Relationships` function in `scripts/orchestration/phases/loading.ps1`:

```powershell
# Apply direct SQL fix for all quiz relationship issues
Log-Message "Applying comprehensive quiz relationships fix..." "Yellow"
Exec-Command -command "pnpm run fix:direct-quiz-fix" -description "Applying comprehensive quiz relationships fix" -continueOnError

# Apply specialized course-quiz relationship fix
Log-Message "Applying quiz-course relationship fix..." "Yellow"
Exec-Command -command "pnpm run fix:course-quiz-relationships" -description "Fixing course-quiz relationships" -continueOnError

# Apply final course ID fix
Log-Message "Applying quiz course ID fix..." "Yellow"
Exec-Command -command "pnpm run fix:quiz-course-ids" -description "Fixing quiz course IDs" -continueOnError
```

Note: The other specialized fix scripts will remain unchanged in the orchestration process.

## 5. Implementation Approach

### 5.1 Script Consolidation Process

For each consolidation, follow these steps:

1. **Create backup copies** of original scripts
2. **Analyze unique features** of each script to be merged
3. **Create a consolidated version** that includes all functionality
4. **Update any direct references** to the merged scripts
5. **Test thoroughly** to ensure all functionality is preserved

### 5.2 Specific Implementation Guidelines

#### 5.2.1 Course ID Scripts Consolidation

The consolidated `fix-quiz-course-ids.ts` should:

- Handle both direct `course_id_id` field updates
- Create/update relationship table entries
- Use transaction isolation for safety
- Include verification queries
- Clearly document the merged approaches

#### 5.2.2 Relationship Fixes Consolidation

The consolidated `fix-course-quiz-relationships.ts` should:

- Implement the dual-storage approach
- Set up proper bidirectional relationships
- Handle the direct field vs. relationship table synchronization
- Use high transaction isolation
- Include thorough verification

#### 5.2.3 Direct Quiz Fix Enhancement

The enhanced `run-direct-quiz-fix.ts/direct-quiz-fix.sql` should:

- Include any unique SQL operations from `fix-quiz-relationships-complete.sql`
- Maintain its comprehensive approach to fixing all aspects
- Keep the existing transaction safety measures

### 5.3 Testing and Verification

After consolidation, verify the changes by:

1. Running the full migration with `./reset-and-migrate.ps1`
2. Checking that quizzes display correctly in the Payload admin UI
3. Verifying database integrity through SQL queries
4. Ensuring all 14 previously empty quizzes now display their questions

## 6. Risks and Mitigation

### 6.1 Potential Risks

1. **Script dependencies**: Merged scripts might depend on other scripts or specific database state
2. **Regression**: Consolidation could introduce regressions in quiz functionality
3. **Orchestration order**: Changes might affect the required execution order

### 6.2 Mitigation Strategies

1. **Maintain backups**: Keep original scripts in a backup location
2. **Incremental testing**: Test each consolidation separately
3. **Documentation**: Document all changes and the rationale
4. **Fallback plan**: Be prepared to revert to original scripts if issues arise

## 7. Future Recommendations

After successful cleanup, consider these improvements:

1. **Schema validation**: Add schema validation to prevent relationship inconsistencies
2. **Foreign key constraints**: Use database constraints to enforce relationship integrity
3. **Automated testing**: Create automated tests for quiz relationship validation
4. **Simplified model**: Consider simplifying the quiz relationship model in Payload CMS

## 8. Conclusion

This plan provides a structured approach to cleaning up the quiz management scripts while preserving functionality and addressing the root causes of persistent issues. By consolidating overlapping scripts and enhancing the core fixes, we can reduce complexity and improve maintainability of the content migration system.
