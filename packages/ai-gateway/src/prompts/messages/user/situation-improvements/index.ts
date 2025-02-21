/**
 * User prompt for situation improvements
 *
 * This prompt provides the user's situation content and instructs the AI
 * to analyze and improve it following specific steps.
 */
export const situationImprovementsUser = `Here is the user's situation background: {{content}}

First, carefully read and analyze the provided situation background and the title of the presentaiton.

We are going to create a set of recommendations to improve the 'Situation' section of the presentation the user is writing. Each recommendation is going to have two parts:
1. A description of the recommendation idea. This description will describe the idea behind the suggestion. It will describe what we are trying to accomplish with this idea.
2. An implementation of the recommendation. This will be the application of the idea to create new bullet content for the Situation. 

To do this, follow these steps:

1. Identify Ideas for Improving the Situation:
   Develop at least three specific ideas to improve the situation description. Consider the following aspects:
   - Given the type opf question this presentation ins answering, why type of information is needed for the situation?
   - Given the complication, what type of information is needed for the situation?
   - Given the answer, what type of information is needed for the situation?
   - Given the existing Situation content, what is missing, whan is unclear, what needs to be expanded upon?
   - Structure of the ideas as a group (are they mutually exclusive and collectively exhaustive?)
   - Use specific details or examples


2. Describe each of these Improvement idea recommendations
  a. Headline: For each Improvement Idea to improve the situation description, write a short headline under 8 words that describes the idea behind the recommendation. 
    - For example, 'Highlight Financial Challenges Clearly'
  b. Rationale: For each Improvement Idea headline, write a single, short explanation of why this idea improves the Situation. Keep this explanation under 15 words
    - For example, 'Clear communication of financial issues can help stakeholders understand the severity of the situation and the need for action.'

3. Apply the Improvement ideas you have created to create new example text for the Situation. For each Improvement Idea, implement that idea by creating a summary point and supporting points for the Situation. These implemented points are not suggestions on how to improve the test, they are recommended new text that applies our suggestions.
  a. Implemented Summary Point: Create a headline that applies the improvement idea that you identified. This headline will implement the ideas contained in the Improvement idea description. This Summary point does not describe the idea, but applies it.
    - For example: 'Revenue grew at less than x% last year. Expenses grew by 20%'
  b. Implemented Supporting Points: For each action headline provide 2-3 supporting points that elaborate on the action idea
    - For example:
      i.  'Revenue grew at less than x% last year, compared to y% the year before
      ii. 'Expenses grew at z%, faster than all competitors
      iii.'ROE is now the worst in the industry'  

4. For each Improvement Idea, output the Improvement Idea Headline, the Improvement Idea Description, the new Implemented Summary Point and the Implemented Supporting Points. Output this as JSON in the following format:

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

Output only this JSON array, with no additional text before or after. Each improvement must follow this exact structure with these exact field names.

Ensure that your improvement ideas and new bullets are directly relevant to the provided situation background and will help the user create a more effective presentation.

Remember:
- Output only valid JSON
- Use exactly these field names: improvementHeadline, improvementDescription, implementedSummaryPoint, implementedSupportingPoints
- Do not include any text outside the JSON array`;
