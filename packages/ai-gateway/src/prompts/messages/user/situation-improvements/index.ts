/**
 * User prompt for situation improvements
 *
 * This prompt provides the user's situation content and instructs the AI
 * to analyze and improve it following specific steps.
 */
export const situationImprovementsUser = `Here is the user's situation background: {{content}}

First, carefully read and analyze the provided situation background. Then, follow these steps:

1. Identify Ideas for Improving the Situation:
   Develop at least three specific ideas to improve the situation description. Consider the following aspects:
   - Clarity and conciseness
   - Relevance of information
   - Structure of the ideas (are they mutually exclusive and collectively exhaustive?)
   - Logical flow of ideas
   - Use of specific details or examples
   - Potential missing information

2. Describe these Improvement ideas
  - Headline: For each Improvement Idea to improve the situation description, write a short headline under 8 words
  - Rationale: For each Improvement Idea headline, write a single, short explanation of why this idea improves the Situation

3. Implement and apply these Improvement ideas to create new text for the Situation
  - For each Improvement Idea, implement that idea by creating a summary point and supporting points for the Situation. 
     i. Summary Point: Create a headline that applies the improvement idea that you identified. This headline will implement the ideas contained in the Improvement idea description
     ii. Supporting Points: For each action headline provide 2-3 supporting points that elaborate on the action idea

4. For each Improvement Idea, output the Improvement Idea Headline, the Improvement Idea Description, the new Summary Point and the Supporting Points. Output this as JSON. Do not output anything other than the JSON.

Ensure that your improvement ideas and new bullets are directly relevant to the provided situation background and will help the user create a more effective presentation.`;
