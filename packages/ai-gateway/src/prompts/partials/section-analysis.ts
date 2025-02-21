/**
 * Section-specific analysis instructions
 *
 * This partial provides guidance for analyzing different sections
 * of the SCQA framework, adapting the analysis based on the section type.
 */
export const sectionAnalysis = `Given the {{sectionType}} section of this presentation, analyze it considering:

{{#isSituation}}
- How well it establishes the current state or context
- Whether it provides enough relevant background information
- If it sets up the complication effectively
- The clarity and specificity of the facts presented
{{/isSituation}}

{{#isComplication}}
- How clearly it identifies the key problem or challenge
- Whether it shows why the current situation is unsustainable
- If it creates tension that drives toward the question
- The impact and urgency of the problem described
{{/isComplication}}

{{#isAnswer}}
- How directly it addresses the question posed
- Whether it provides a complete solution
- If it logically follows from the situation and complication
- The practicality and feasibility of the solution
{{/isAnswer}}

{{#isOutline}}
- How well it structures the key points
- Whether it follows a logical progression
- If it maintains focus on the core message
- The balance and flow between sections
{{/isOutline}}

Consider:
- What information is missing or unclear
- How this section connects to others in the SCQA framework
- Whether the structure effectively supports the message
- Opportunities to make the content more impactful`;
