import "server-only";

import { getMastra } from "@kit/mastra";

type MastraInstance = ReturnType<typeof getMastra>;
type RegisteredAgent = NonNullable<ReturnType<MastraInstance["getAgent"]>>;
type RegisteredWorkflow = NonNullable<
	ReturnType<MastraInstance["getWorkflow"]>
>;

export { getMastra };

export function getAgent(id: string): RegisteredAgent {
	const agent = getMastra().getAgent(id);

	if (!agent) {
		throw new Error(`Mastra agent "${id}" is not registered`);
	}

	return agent as RegisteredAgent;
}

export function getWorkflow(id: string): RegisteredWorkflow {
	const workflow = getMastra().getWorkflow(id);

	if (!workflow) {
		throw new Error(`Mastra workflow "${id}" is not registered`);
	}

	return workflow as RegisteredWorkflow;
}
