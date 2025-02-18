/**
 * User message template for audience suggestions
 * Contains the specific context and requirements for each audience suggestion request
 */
const audienceRequestUser = `Based on the presentation title: "{{title}}"

Generate 4 target audience suggestions that:
1. Are most likely to benefit from this presentation
2. Have decision-making power or influence
3. Match the presentation's technical level
4. Follow the guidelines provided

Format each suggestion as a numbered list item, keeping each suggestion to 2-4 words.`;

export default audienceRequestUser;
