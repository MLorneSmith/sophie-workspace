/**
 * Format instructions for simplified text
 *
 * This partial defines the expected JSON structure for simplified text
 * and provides clear instructions about the format requirements.
 */
export const simplifiedFormat = `Return the simplified text as JSON in the following format:

{
  "sections": [
    {
      "type": "heading",
      "content": "Main point as a clear heading"
    },
    {
      "type": "bullet",
      "content": "Supporting detail as a bullet point"
    }
  ]
}

Critical Requirements:
- Output ONLY valid JSON, with no text before or after
- Each section must have a "type" ("heading" or "bullet")
- Content should be clear and concise
- Do not include any markdown formatting (##, -, etc)
- Headings should be short and descriptive
- Bullet points should provide supporting details
- Maintain the logical flow of the original text`;
