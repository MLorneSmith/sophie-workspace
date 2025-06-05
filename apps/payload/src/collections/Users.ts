import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
	slug: "users",
	admin: {
		useAsTitle: "email",
	},
	auth: true, // This automatically provides id, email, and password fields
	fields: [
		// Payload automatically handles:
		// - id field (UUID type from db adapter config)
		// - email field (for authentication)
		// - password field (for authentication)

		// Add custom fields as needed
		{
			name: "name",
			type: "text",
			label: "Full Name",
		},
		{
			name: "role",
			type: "select",
			options: [
				{
					label: "Admin",
					value: "admin",
				},
				{
					label: "User",
					value: "user",
				},
			],
			defaultValue: "user",
			required: true,
		},
	],
};
