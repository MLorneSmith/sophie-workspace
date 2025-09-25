import { ComponentsTool } from "./src/tools/components";
import { DatabaseTool } from "./src/tools/database";
import { ScriptsTool } from "./src/tools/scripts";

const components = await ComponentsTool.getComponents();
components.slice(0, 5).forEach((_component) => {});
try {
	const _buttonContent = await ComponentsTool.getComponentContent("button");
} catch (_error) {}
const _shadcnComponents = components.filter((c) => c.category === "shadcn");
const _makerkitComponents = components.filter((c) => c.category === "makerkit");
const _utilsComponents = components.filter((c) => c.category === "utils");
try {
	await ComponentsTool.getComponentContent("non-existent-component");
} catch (_error) {}
const scripts = await ScriptsTool.getScripts();
const importantScripts = scripts.filter(
	(s) => s.importance === "critical" || s.importance === "high",
);
importantScripts.forEach((script) => {
	const _healthcheck = script.healthcheck ? " [HEALTHCHECK]" : "";
});
const healthcheckScripts = scripts.filter((s) => s.healthcheck);
healthcheckScripts.forEach((_script) => {});
const categories = [...new Set(scripts.map((s) => s.category))];
categories.forEach((category) => {
	const _categoryScripts = scripts.filter((s) => s.category === category);
});
try {
	const _typecheckDetails = await ScriptsTool.getScriptDetails("typecheck");
} catch (_error) {}
try {
	await ScriptsTool.getScriptDetails("non-existent-script");
} catch (_error) {}
const buttonSearchResults = await ComponentsTool.searchComponents("button");
buttonSearchResults.forEach((_component) => {});
const shadcnSearchResults = await ComponentsTool.searchComponents("shadcn");
shadcnSearchResults.slice(0, 3).forEach((_component) => {});
const formSearchResults = await ComponentsTool.searchComponents("form");
formSearchResults.forEach((_component) => {});
try {
	const buttonProps = await ComponentsTool.getComponentProps("button");
	buttonProps.props.forEach((prop) => {
		const _optional = prop.optional ? "?" : "";
	});
	if (buttonProps.variants) {
		Object.entries(buttonProps.variants).forEach(
			([_variantName, _options]) => {},
		);
	}
} catch (_error) {}
try {
	const ifProps = await ComponentsTool.getComponentProps("if");
	if (ifProps.props.length > 0) {
		ifProps.props.forEach((prop) => {
			const _optional = prop.optional ? "?" : "";
		});
	}
} catch (_error) {}
const _noResults = await ComponentsTool.searchComponents("xyz123nonexistent");
try {
	await ComponentsTool.getComponentProps("non-existent-component");
} catch (_error) {}
const schemaFiles = await DatabaseTool.getSchemaFiles();
schemaFiles.slice(0, 5).forEach((_file) => {});
const dbFunctions = await DatabaseTool.getFunctions();
dbFunctions.forEach((func) => {
	const _security = func.securityLevel === "definer" ? " [DEFINER]" : "";
});
const authFunctions = await DatabaseTool.searchFunctions("auth");
authFunctions.forEach((_func) => {});
const definerFunctions = await DatabaseTool.searchFunctions("definer");
definerFunctions.forEach((_func) => {});
if (dbFunctions.length > 0) {
	try {
		const firstFunction = dbFunctions[0];
		if (firstFunction) {
			const functionDetails = await DatabaseTool.getFunctionDetails(
				firstFunction.name,
			);
			functionDetails.parameters.forEach((param) => {
				const _defaultVal = param.defaultValue
					? ` (default: ${param.defaultValue})`
					: "";
			});
		}
	} catch (_error) {}
}
const _noFunctionResults =
	await DatabaseTool.searchFunctions("xyz123nonexistent");
try {
	await DatabaseTool.getFunctionDetails("non-existent-function");
} catch (_error) {}
try {
	const _accountsSchemaContent =
		await DatabaseTool.getSchemaContent("03-accounts.sql");
} catch (_error) {}
const authSchemas = await DatabaseTool.getSchemasByTopic("auth");
authSchemas.forEach((schema) => {
	if (schema.functions.length > 0) {
	}
});
const billingSchemas = await DatabaseTool.getSchemasByTopic("billing");
billingSchemas.forEach((schema) => {
	if (schema.tables.length > 0) {
	}
});
const accountSchemas = await DatabaseTool.getSchemasByTopic("accounts");
accountSchemas.forEach((schema) => {
	if (schema.dependencies.length > 0) {
	}
});
try {
	const accountsSection = await DatabaseTool.getSchemaBySection("Accounts");
	if (accountsSection) {
	}
} catch (_error) {}
const enhancedSchemas = await DatabaseTool.getSchemaFiles();

// Show schemas with the most tables
const schemasWithTables = enhancedSchemas.filter((s) => s.tables.length > 0);
schemasWithTables.slice(0, 3).forEach((_schema) => {});

// Show schemas with functions
const schemasWithFunctions = enhancedSchemas.filter(
	(s) => s.functions.length > 0,
);
schemasWithFunctions.slice(0, 3).forEach((_schema) => {});

// Show topic distribution
const topicCounts = enhancedSchemas.reduce(
	(acc, schema) => {
		acc[schema.topic] = (acc[schema.topic] || 0) + 1;
		return acc;
	},
	{} as Record<string, number>,
);
Object.entries(topicCounts).forEach(([_topic, _count]) => {});
try {
	await DatabaseTool.getSchemaContent("non-existent-schema.sql");
} catch (_error) {}

try {
	const _nonExistentSection =
		await DatabaseTool.getSchemaBySection("NonExistentSection");
} catch (_error) {}

const _emptyTopicResults =
	await DatabaseTool.getSchemasByTopic("xyz123nonexistent");
