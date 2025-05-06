# Payload CMS & Migration System: Emergent Design Principles

Based on extensive debugging of the Payload CMS integration and the `reset-and-migrate.ps1` content migration system, the following principles should guide future development and refactoring efforts to improve reliability and maintainability.

1.  **Principle: Prioritize Data Consistency by Design.**

    - **Learning:** Core issues stemmed from inconsistencies between related data in `_rels` tables and JSONB fields. Payload's API requires strict consistency, especially for deep fetches (`depth > 0`).
    - **Guideline:** Design data seeding/update processes to guarantee consistency. Populate different representations of the same relationship (e.g., `_rels` entry and JSONB field) atomically from the same source. Avoid processes where they can diverge.

2.  **Principle: Simplify Migration Orchestration.**

    - **Learning:** The complex, multi-phase `reset-and-migrate.ps1` script with interwoven repairs and verifications was fragile and hard to debug. Errors often caused silent rollbacks.
    - **Guideline:** Favor a linear, simpler orchestration flow. Separate distinct concerns (schema migration, data seeding, relationship population, verification) into independent, sequential stages. Minimize complex repair logic within the main migration flow.

3.  **Principle: Adhere Strictly to a Single Source of Truth (SSOT).**

    - **Learning:** Using defined SSOT files (like `quizzes-quiz-questions-truth.ts`) was crucial for correcting data. Relying on potentially inconsistent database states to derive other data proved unreliable.
    - **Guideline:** Define clear SSOT files/sources for all core content and relationships. All data seeding and relationship population logic _must_ read directly from these SSOTs.

4.  **Principle: Ensure Robust and Atomic Data Population.**

    - **Learning:** Executing complex SQL through multiple script layers was unreliable. Direct `psql` was more robust. Transaction rollbacks likely caused data persistence issues.
    - **Guideline:** Use direct and reliable methods for database interactions (e.g., `psql`, robust Node.js libraries). Ensure critical data population steps occur within explicit, well-managed transactions for atomicity.

5.  **Principle: Leverage Payload's API/Logic Where Appropriate.**

    - **Learning:** Manually replicating Payload's relationship logic (JSONB formatting, `_rels` management) is complex.
    - **Guideline:** For _updates_ or potentially _seeding_ (if performance allows), consider using Payload's Local API (`payload.create`, `payload.update`). This leverages Payload's internal logic, hooks, and validation. However, for initial bulk seeding, direct SQL generation from SSOT might be necessary for speed.

6.  **Principle: Decouple Verification from Population.**

    - **Learning:** Running verification scripts _during_ data population caused errors that likely triggered transaction rollbacks, undoing the population work.
    - **Guideline:** Execute verification scripts as a distinct phase _after_ all data population and relationship building is complete and committed. Verification should report errors, not attempt fixes within the main flow.

7.  **Principle: Implement Granular Debugging and Monitoring.**

    - **Learning:** High-level logs were insufficient. Detailed script logging and direct database inspection were required.
    - **Guideline:** Ensure migration scripts have detailed, contextual logging. Create specific, independent diagnostic scripts to check data integrity.

8.  **Principle: Understand and Align with Payload Configuration.**
    - **Learning:** Missing Payload collection configurations (like `versions: { drafts: true }`) directly impacted API behavior, even with correct database schema/data.
    - **Guideline:** Keep Payload configurations aligned with the database schema and intended behavior (especially versioning, relationships). Regenerate types after config changes.
