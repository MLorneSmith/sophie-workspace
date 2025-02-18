/**
 * User message template for test outline generation requests
 * Contains the specific requirements and structure for the outline
 */
const testOutlineRequestUser = `Create a detailed presentation outline for:

Topic: {{topic}}
Context: {{context}}
Tone: {{tone}}
Specific Requirements: {{specific_requirements}}

The outline must be structured with:
1. Main sections (numbered)
   - Include time allocation for each section
   - Ensure logical progression
   
2. Subsections (lettered)
   - Support main section objectives
   - Provide detailed focus areas

3. Key talking points (bulleted)
   - Include relevant examples
   - Add data points where appropriate
   - Note engagement opportunities

Required Elements:
1. Compelling introduction that:
   - Captures audience attention
   - Sets clear expectations
   - Establishes relevance

2. Main content that:
   - Develops key points logically
   - Supports with evidence/examples
   - Maintains audience engagement

3. Strong conclusion that:
   - Reinforces key messages
   - Provides clear takeaways
   - Includes call to action

4. Interactive elements:
   - Engagement points
   - Discussion opportunities
   - Audience participation moments

Please ensure all content aligns with the specified tone and incorporates the specific requirements provided.`;

export default testOutlineRequestUser;
