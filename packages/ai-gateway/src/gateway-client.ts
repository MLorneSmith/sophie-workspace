import OpenAI from "openai";

let openai: OpenAI;

if (process.env.PORTKEY_API_KEY && process.env.PORTKEY_VIRTUAL_KEY) {
	// Route through Portkey proxy
	openai = new OpenAI({
		apiKey: "",
		baseURL: "https://api.portkey.ai/v1/proxy",
		defaultHeaders: {
			"x-portkey-api-key": process.env.PORTKEY_API_KEY,
			"x-portkey-virtual-key": process.env.PORTKEY_VIRTUAL_KEY,
			"x-portkey-provider": "openai",
		},
	});
} else if (process.env.OPENAI_API_KEY) {
	// Direct OpenAI fallback
	openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});
} else {
	throw new Error(
		"Either PORTKEY_API_KEY+PORTKEY_VIRTUAL_KEY or OPENAI_API_KEY must be set",
	);
}

export default openai;
