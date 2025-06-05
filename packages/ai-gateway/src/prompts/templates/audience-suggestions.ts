import type { ChatMessage } from "../../index";
import audienceCreatorSystem from "../messages/system/audience-creator";
import audienceRequestUser from "../messages/user/audience-request";

/**
 * Template for generating audience suggestions
 * Combines system and user messages with proper role structure
 */
const audienceSuggestionsTemplate: ChatMessage[] = [
	{
		role: "system",
		content: audienceCreatorSystem,
	},
	{
		role: "user",
		content: audienceRequestUser,
	},
];

export default audienceSuggestionsTemplate;
