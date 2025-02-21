/**
 * Presentation context partial
 *
 * This partial provides the complete SCQA context for any section
 * being analyzed, helping the AI understand the broader presentation.
 */
export const presentationContext = `Before analyzing this section, understand the complete presentation context:

The Presentation:
- Title: {{title}}
- Target Audience: {{audience}}
- Question Type: {{questionType}}

The SCQA Framework Components:
- Situation (Current State): {{situation}}
  This sets the context and background for the presentation.

- Complication (Problem/Challenge): {{complication}}
  This explains why the current situation is problematic or needs change.

- Question: How can we {{questionType}}?
  This is the core question the presentation aims to answer.

- Answer (Solution): {{answer}}
  This provides the solution or approach to address the complication.

Current Focus:
We are now working on improving the {{sectionType}} section of this presentation.
This section must work effectively with the other components to create a compelling narrative.

Consider how this section:
- Supports the overall presentation goal
- Connects with the other SCQA components
- Addresses the needs of the {{audience}} audience
- Contributes to answering the core question`;
