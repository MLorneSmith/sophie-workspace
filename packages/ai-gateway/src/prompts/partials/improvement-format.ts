/**
 * Format instructions for improvement suggestions
 *
 * This partial defines the expected JSON structure for improvements
 * and provides clear instructions about the format requirements.
 */
export const improvementFormat = `For each improvement, provide:
1. A short headline describing the improvement idea (under 8 words)
2. A brief rationale explaining why this improvement helps (under 15 words)
3. A specific implemented summary point
4. 2-3 implemented supporting points that elaborate on the summary

Output this as JSON in the following format:

[
  {
    "improvementHeadline": "Short headline describing the improvement idea",
    "improvementDescription": "Brief explanation of why this improvement helps",
    "implementedSummaryPoint": "The actual new content that implements the idea",
    "implementedSupportingPoints": [
      "First supporting point",
      "Second supporting point",
      "Optional third supporting point"
    ]
  }
]

Critical Requirements:
- Output ONLY valid JSON, with no text before or after
- Use EXACTLY these field names: improvementHeadline, improvementDescription, implementedSummaryPoint, implementedSupportingPoints
- Each improvement must follow this exact structure
- Supporting points must be an array of 2-3 strings
- Do not include any formatting like bullet points or line numbers
- Do not include "Improvement 1:" or similar headers`;
