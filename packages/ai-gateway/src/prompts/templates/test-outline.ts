import type { ChatMessage } from "../../index";
import testOutlineCreatorSystem from "../messages/system/test-outline-creator";
import testOutlineRequestUser from "../messages/user/test-outline-request";

/**
 * Template for generating test presentation outlines
 * Combines system and user messages with proper role structure
 */
const testOutlineTemplate: ChatMessage[] = [
	{
		role: "system",
		content: testOutlineCreatorSystem,
	},
	{
		role: "user",
		content: testOutlineRequestUser,
	},
];

export default testOutlineTemplate;
