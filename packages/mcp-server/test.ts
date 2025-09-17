import { ComponentsTool } from './src/tools/components';
import { DatabaseTool } from './src/tools/database';
import { MigrationsTool } from './src/tools/migrations';
import { ScriptsTool } from './src/tools/scripts';

console.log('=== Testing MigrationsTool ===');
console.log(await MigrationsTool.GetMigrations());

console.log(
  await MigrationsTool.getMigrationContent('20240319163440_roles-seed.sql'),
);

console.log('\n=== Testing ComponentsTool ===');

console.log('\n--- Getting all components ---');
const components = await ComponentsTool.getComponents();
console.log(`Found ${components.length} components:`);
components.slice(0, 5).forEach((component) => {
  console.log(
    `- ${component.name} (${component.category}): ${component.description}`,
  );
});
console.log('...');

console.log('\n--- Testing component content retrieval ---');
try {
  const buttonContent = await ComponentsTool.getComponentContent('button');
  console.log('Button component content length:', buttonContent.length);
  console.log('First 200 characters:', buttonContent.substring(0, 200));
} catch (error) {
  console.error('Error getting button component:', error);
}

console.log('\n--- Testing component filtering by category ---');
const shadcnComponents = components.filter((c) => c.category === 'shadcn');
const makerkitComponents = components.filter((c) => c.category === 'makerkit');
const utilsComponents = components.filter((c) => c.category === 'utils');

console.log(`Shadcn components: ${shadcnComponents.length}`);
console.log(`Makerkit components: ${makerkitComponents.length}`);
console.log(`Utils components: ${utilsComponents.length}`);

console.log('\n--- Sample components by category ---');
console.log(
  'Shadcn:',
  shadcnComponents
    .slice(0, 3)
    .map((c) => c.name)
    .join(', '),
);
console.log(
  'Makerkit:',
  makerkitComponents
    .slice(0, 3)
    .map((c) => c.name)
    .join(', '),
);
console.log('Utils:', utilsComponents.map((c) => c.name).join(', '));

console.log('\n--- Testing error handling ---');
try {
  await ComponentsTool.getComponentContent('non-existent-component');
} catch (error) {
  console.log(
    'Expected error for non-existent component:',
    error instanceof Error ? error.message : String(error),
  );
}

console.log('\n=== Testing ScriptsTool ===');

console.log('\n--- Getting all scripts ---');
const scripts = await ScriptsTool.getScripts();
console.log(`Found ${scripts.length} scripts:`);

console.log('\n--- Critical and High importance scripts ---');
const importantScripts = scripts.filter(
  (s) => s.importance === 'critical' || s.importance === 'high',
);
importantScripts.forEach((script) => {
  const healthcheck = script.healthcheck ? ' [HEALTHCHECK]' : '';
  console.log(
    `- ${script.name} (${script.importance})${healthcheck}: ${script.description}`,
  );
});

console.log('\n--- Healthcheck scripts (code quality) ---');
const healthcheckScripts = scripts.filter((s) => s.healthcheck);
console.log('Scripts that should be run after writing code:');
healthcheckScripts.forEach((script) => {
  console.log(`- pnpm ${script.name}: ${script.usage}`);
});

console.log('\n--- Scripts by category ---');
const categories = [...new Set(scripts.map((s) => s.category))];
categories.forEach((category) => {
  const categoryScripts = scripts.filter((s) => s.category === category);
  console.log(`${category}: ${categoryScripts.map((s) => s.name).join(', ')}`);
});

console.log('\n--- Testing script details ---');
try {
  const typecheckDetails = await ScriptsTool.getScriptDetails('typecheck');
  console.log('Typecheck script details:');
  console.log(`  Command: ${typecheckDetails.command}`);
  console.log(`  Importance: ${typecheckDetails.importance}`);
  console.log(`  Healthcheck: ${typecheckDetails.healthcheck}`);
  console.log(`  Usage: ${typecheckDetails.usage}`);
} catch (error) {
  console.error('Error getting typecheck details:', error);
}

console.log('\n--- Testing error handling for scripts ---');
try {
  await ScriptsTool.getScriptDetails('non-existent-script');
} catch (error) {
  console.log(
    'Expected error for non-existent script:',
    error instanceof Error ? error.message : String(error),
  );
}

console.log('\n=== Testing New ComponentsTool Features ===');

console.log('\n--- Testing component search ---');
const buttonSearchResults = await ComponentsTool.searchComponents('button');
console.log(`Search for "button": ${buttonSearchResults.length} results`);
buttonSearchResults.forEach((component) => {
  console.log(`  - ${component.name}: ${component.description}`);
});

console.log('\n--- Testing search by category ---');
const shadcnSearchResults = await ComponentsTool.searchComponents('shadcn');
console.log(
  `Search for "shadcn": ${shadcnSearchResults.length} results (showing first 3)`,
);
shadcnSearchResults.slice(0, 3).forEach((component) => {
  console.log(`  - ${component.name}`);
});

console.log('\n--- Testing search by description keyword ---');
const formSearchResults = await ComponentsTool.searchComponents('form');
console.log(`Search for "form": ${formSearchResults.length} results`);
formSearchResults.forEach((component) => {
  console.log(`  - ${component.name}: ${component.description}`);
});

console.log('\n--- Testing component props extraction ---');
try {
  console.log('\n--- Button component props ---');
  const buttonProps = await ComponentsTool.getComponentProps('button');
  console.log(`Component: ${buttonProps.componentName}`);
  console.log(`Interfaces: ${buttonProps.interfaces.join(', ')}`);
  console.log(`Props (${buttonProps.props.length}):`);
  buttonProps.props.forEach((prop) => {
    const optional = prop.optional ? '?' : '';
    console.log(`  - ${prop.name}${optional}: ${prop.type}`);
  });
  if (buttonProps.variants) {
    console.log('Variants:');
    Object.entries(buttonProps.variants).forEach(([variantName, options]) => {
      console.log(`  - ${variantName}: ${options.join(' | ')}`);
    });
  }
} catch (error) {
  console.error('Error getting button props:', error);
}

console.log('\n--- Testing simpler component props ---');
try {
  const ifProps = await ComponentsTool.getComponentProps('if');
  console.log(`Component: ${ifProps.componentName}`);
  console.log(`Interfaces: ${ifProps.interfaces.join(', ')}`);
  console.log(`Props count: ${ifProps.props.length}`);
  if (ifProps.props.length > 0) {
    ifProps.props.forEach((prop) => {
      const optional = prop.optional ? '?' : '';
      console.log(`  - ${prop.name}${optional}: ${prop.type}`);
    });
  }
} catch (error) {
  console.error('Error getting if component props:', error);
}

console.log('\n--- Testing search with no results ---');
const noResults = await ComponentsTool.searchComponents('xyz123nonexistent');
console.log(`Search for non-existent: ${noResults.length} results`);

console.log('\n--- Testing props extraction error handling ---');
try {
  await ComponentsTool.getComponentProps('non-existent-component');
} catch (error) {
  console.log(
    'Expected error for non-existent component props:',
    error instanceof Error ? error.message : String(error),
  );
}

console.log('\n=== Testing DatabaseTool ===');

console.log('\n--- Getting schema files ---');
const schemaFiles = await DatabaseTool.getSchemaFiles();
console.log(`Found ${schemaFiles.length} schema files:`);
schemaFiles.slice(0, 5).forEach((file) => {
  console.log(`  - ${file.name}: ${file.section}`);
});

console.log('\n--- Getting database functions ---');
const dbFunctions = await DatabaseTool.getFunctions();
console.log(`Found ${dbFunctions.length} database functions:`);
dbFunctions.forEach((func) => {
  const security = func.securityLevel === 'definer' ? ' [DEFINER]' : '';
  console.log(`  - ${func.name}${security}: ${func.purpose}`);
});

console.log('\n--- Testing function search ---');
const authFunctions = await DatabaseTool.searchFunctions('auth');
console.log(`Functions related to "auth": ${authFunctions.length}`);
authFunctions.forEach((func) => {
  console.log(`  - ${func.name}: ${func.purpose}`);
});

console.log('\n--- Testing function search by security ---');
const definerFunctions = await DatabaseTool.searchFunctions('definer');
console.log(`Functions with security definer: ${definerFunctions.length}`);
definerFunctions.forEach((func) => {
  console.log(`  - ${func.name}: ${func.purpose}`);
});

console.log('\n--- Testing function details ---');
if (dbFunctions.length > 0) {
  try {
    const firstFunction = dbFunctions[0];
    if (firstFunction) {
      const functionDetails = await DatabaseTool.getFunctionDetails(
        firstFunction.name,
      );
      console.log(`Details for ${functionDetails.name}:`);
      console.log(`  Purpose: ${functionDetails.purpose}`);
      console.log(`  Return Type: ${functionDetails.returnType}`);
      console.log(`  Security: ${functionDetails.securityLevel}`);
      console.log(`  Parameters: ${functionDetails.parameters.length}`);
      functionDetails.parameters.forEach((param) => {
        const defaultVal = param.defaultValue
          ? ` (default: ${param.defaultValue})`
          : '';
        console.log(`    - ${param.name}: ${param.type}${defaultVal}`);
      });
    }
  } catch (error) {
    console.error('Error getting function details:', error);
  }
}

console.log('\n--- Testing function search with no results ---');
const noFunctionResults =
  await DatabaseTool.searchFunctions('xyz123nonexistent');
console.log(
  `Search for non-existent function: ${noFunctionResults.length} results`,
);

console.log('\n--- Testing function details error handling ---');
try {
  await DatabaseTool.getFunctionDetails('non-existent-function');
} catch (error) {
  console.log(
    'Expected error for non-existent function:',
    error instanceof Error ? error.message : String(error),
  );
}

console.log('\n=== Testing Enhanced DatabaseTool Features ===');

console.log('\n--- Testing direct schema content access ---');
try {
  const accountsSchemaContent =
    await DatabaseTool.getSchemaContent('03-accounts.sql');
  console.log('Accounts schema content length:', accountsSchemaContent.length);
  console.log('First 200 characters:', accountsSchemaContent.substring(0, 200));
} catch (error) {
  console.error(
    'Error getting accounts schema content:',
    error instanceof Error ? error.message : String(error),
  );
}

console.log('\n--- Testing schema search by topic ---');
const authSchemas = await DatabaseTool.getSchemasByTopic('auth');
console.log(`Schemas related to "auth": ${authSchemas.length}`);
authSchemas.forEach((schema) => {
  console.log(`  - ${schema.name} (${schema.topic}): ${schema.section}`);
  if (schema.functions.length > 0) {
    console.log(`    Functions: ${schema.functions.join(', ')}`);
  }
});

console.log('\n--- Testing schema search by topic - billing ---');
const billingSchemas = await DatabaseTool.getSchemasByTopic('billing');
console.log(`Schemas related to "billing": ${billingSchemas.length}`);
billingSchemas.forEach((schema) => {
  console.log(`  - ${schema.name}: ${schema.description}`);
  if (schema.tables.length > 0) {
    console.log(`    Tables: ${schema.tables.join(', ')}`);
  }
});

console.log('\n--- Testing schema search by topic - accounts ---');
const accountSchemas = await DatabaseTool.getSchemasByTopic('accounts');
console.log(`Schemas related to "accounts": ${accountSchemas.length}`);
accountSchemas.forEach((schema) => {
  console.log(`  - ${schema.name}: ${schema.description}`);
  if (schema.dependencies.length > 0) {
    console.log(`    Dependencies: ${schema.dependencies.join(', ')}`);
  }
});

console.log('\n--- Testing schema by section lookup ---');
try {
  const accountsSection = await DatabaseTool.getSchemaBySection('Accounts');
  if (accountsSection) {
    console.log(`Found section: ${accountsSection.section}`);
    console.log(`File: ${accountsSection.name}`);
    console.log(`Topic: ${accountsSection.topic}`);
    console.log(`Tables: ${accountsSection.tables.join(', ')}`);
    console.log(`Last modified: ${accountsSection.lastModified.toISOString()}`);
  }
} catch (error) {
  console.error('Error getting accounts section:', error);
}

console.log('\n--- Testing enhanced schema metadata ---');
const enhancedSchemas = await DatabaseTool.getSchemaFiles();
console.log(`Total schemas with metadata: ${enhancedSchemas.length}`);

// Show schemas with the most tables
const schemasWithTables = enhancedSchemas.filter((s) => s.tables.length > 0);
console.log(`Schemas with tables: ${schemasWithTables.length}`);
schemasWithTables.slice(0, 3).forEach((schema) => {
  console.log(
    `  - ${schema.name}: ${schema.tables.length} tables (${schema.tables.join(', ')})`,
  );
});

// Show schemas with functions
const schemasWithFunctions = enhancedSchemas.filter(
  (s) => s.functions.length > 0,
);
console.log(`Schemas with functions: ${schemasWithFunctions.length}`);
schemasWithFunctions.slice(0, 3).forEach((schema) => {
  console.log(
    `  - ${schema.name}: ${schema.functions.length} functions (${schema.functions.join(', ')})`,
  );
});

// Show topic distribution
const topicCounts = enhancedSchemas.reduce(
  (acc, schema) => {
    acc[schema.topic] = (acc[schema.topic] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>,
);

console.log('\n--- Topic distribution ---');
Object.entries(topicCounts).forEach(([topic, count]) => {
  console.log(`  - ${topic}: ${count} files`);
});

console.log('\n--- Testing error handling for enhanced features ---');
try {
  await DatabaseTool.getSchemaContent('non-existent-schema.sql');
} catch (error) {
  console.log(
    'Expected error for non-existent schema:',
    error instanceof Error ? error.message : String(error),
  );
}

try {
  const nonExistentSection =
    await DatabaseTool.getSchemaBySection('NonExistentSection');
  console.log('Non-existent section result:', nonExistentSection);
} catch (error) {
  console.error('Unexpected error for non-existent section:', error);
}

const emptyTopicResults =
  await DatabaseTool.getSchemasByTopic('xyz123nonexistent');
console.log(
  `Search for non-existent topic: ${emptyTopicResults.length} results`,
);
