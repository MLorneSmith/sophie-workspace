import type { Block } from "payload";

export const TestBlock: Block = {
	slug: "test-block",
	interfaceName: "TestBlock", // Important for type generation
	labels: {
		singular: "Test Block",
		plural: "Test Blocks",
	},
	fields: [
		{
			name: "text",
			type: "text",
			defaultValue: "Test Block",
		},
	],
};
