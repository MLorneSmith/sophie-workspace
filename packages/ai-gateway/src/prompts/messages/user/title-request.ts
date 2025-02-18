/**
 * User message template for title generation requests
 * Contains the specific context and requirements for each title generation request
 */
const titleRequestUser = `Create title suggestions for a presentation with the following details:

Presentation Type: {{presentation_type}}

Generate 5 unique title suggestions that:
1. Align with the presentation type and goal
2. Resonate with the target audience
3. Maintain the specified tone
4. Follow the guidelines provided in the system message
`;

export default titleRequestUser;
