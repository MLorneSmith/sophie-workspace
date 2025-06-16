#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Get service name from file path
function getServiceName(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  
  // Special handling for known patterns
  if (normalized.includes('packages/ai-gateway')) return 'AI-GATEWAY';
  if (normalized.includes('packages/billing/')) {
    const billingPart = parts[parts.indexOf('billing') + 1];
    return `BILLING-${billingPart?.toUpperCase() || 'GATEWAY'}`;
  }
  if (normalized.includes('packages/cms/')) return 'CMS-PAYLOAD';
  if (normalized.includes('packages/features/')) {
    const feature = parts[parts.indexOf('features') + 1];
    return `FEATURE-${feature?.toUpperCase().replace(/-/g, '_') || 'UNKNOWN'}`;
  }
  
  // App-specific patterns
  if (normalized.includes('apps/web/app/')) {
    const appIndex = parts.indexOf('app');
    if (appIndex !== -1) {
      const routeParts = parts.slice(appIndex + 1, appIndex + 3);
      if (routeParts[0] === 'home' && routeParts[1]) {
        return `HOME-${routeParts[1].toUpperCase()}`;
      }
      if (routeParts[0] === 'admin') {
        return `ADMIN-${routeParts[1]?.toUpperCase() || 'MAIN'}`;
      }
      if (routeParts[0] === 'api') {
        return `API-${routeParts[1]?.toUpperCase() || 'ROUTE'}`;
      }
      if (routeParts[0]) {
        return routeParts[0].toUpperCase().replace(/-/g, '_');
      }
    }
  }
  
  if (normalized.includes('apps/web/lib/')) {
    const libIndex = parts.indexOf('lib');
    const libPart = parts[libIndex + 1];
    return `LIB-${libPart?.toUpperCase().replace(/-/g, '_') || 'UTIL'}`;
  }
  
  // Default fallback
  const fileName = path.basename(filePath, path.extname(filePath));
  return fileName.toUpperCase().replace(/[-_.]/g, '_');
}

// Check if file already has logger import
function hasLoggerImport(content) {
  return content.includes('createServiceLogger') || 
         content.includes('createEnhancedLogger') ||
         content.includes('@kit/shared/logger');
}

// Add logger import
function addLoggerImport(content, serviceName) {
  if (hasLoggerImport(content)) {
    return content;
  }
  
  // Find the last import statement
  const importRegex = /^import\s+.*?;?\s*$/gm;
  const imports = content.match(importRegex) || [];
  
  if (imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertIndex = lastImportIndex + lastImport.length;
    
    const loggerImport = `\nimport { createServiceLogger } from "@kit/shared/logger";\n\n// Initialize service logger\nconst { getLogger } = createServiceLogger("${serviceName}");\n`;
    
    return content.slice(0, insertIndex) + loggerImport + content.slice(insertIndex);
  } else {
    // No imports found, add at the beginning
    return `import { createServiceLogger } from "@kit/shared/logger";\n\n// Initialize service logger\nconst { getLogger } = createServiceLogger("${serviceName}");\n\n` + content;
  }
}

// Check if function is async
function isInAsyncContext(content, position) {
  // Look backwards for function declarations
  const beforeContent = content.substring(0, position);
  const functionMatch = beforeContent.match(/(?:async\s+)?(?:function|=>|\(.*?\)\s*=>)\s*(?:\{)?[^}]*$/);
  
  if (functionMatch) {
    return functionMatch[0].includes('async');
  }
  
  // Check if we're in an async function body
  const asyncFunctionRegex = /async\s+(?:function\s+\w+|\w+\s*=\s*async|(?:\(.*?\)|\w+)\s*=>\s*(?:async\s*)?)\s*\{[^}]*$/;
  return asyncFunctionRegex.test(beforeContent);
}

// Replace console statements
function replaceConsoleStatements(content, filePath) {
  let modifiedContent = content;
  let replacementCount = 0;
  
  // Pattern to match console.log, console.error, console.warn, console.debug, console.info
  const consolePattern = /console\.(log|error|warn|debug|info)\s*\(/g;
  
  // Track if we need async logger
  let needsAsyncLogger = false;
  
  // First pass: check if any console statements are in async context
  let match;
  while ((match = consolePattern.exec(content)) !== null) {
    if (isInAsyncContext(content, match.index)) {
      needsAsyncLogger = true;
      break;
    }
  }
  
  // Reset regex
  consolePattern.lastIndex = 0;
  
  // Second pass: replace console statements
  modifiedContent = content.replace(consolePattern, (match, method, offset) => {
    replacementCount++;
    
    const inAsync = isInAsyncContext(content, offset);
    const loggerMethod = method === 'log' ? 'info' : method;
    
    if (inAsync) {
      // For async context, we'll need to handle this specially
      return `(await getLogger()).${loggerMethod}(`;
    } else {
      // For sync context, we need to handle this differently
      // We'll mark these for manual review
      return `/* TODO: Async logger needed */ logger.${loggerMethod}(`;
    }
  });
  
  // Handle complex console statements with multiple arguments
  // Convert console.log("message", data) to logger.info("message", { data })
  const multiArgPattern = /((?:await getLogger\(\))|logger)\.(info|error|warn|debug)\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g;
  
  modifiedContent = modifiedContent.replace(multiArgPattern, (match, logger, method, message, args) => {
    // Check if args is already an object
    if (args.trim().startsWith('{') && args.trim().endsWith('}')) {
      return match;
    }
    
    // Convert multiple args to context object
    const argsList = args.split(',').map(arg => arg.trim());
    if (argsList.length === 1) {
      // Single additional argument
      const argName = argsList[0].replace(/['"]/g, '').replace(/\s+/g, '_');
      return `${logger}.${method}(${message}, { data: ${argsList[0]} })`;
    } else {
      // Multiple arguments - create context object
      const contextProps = argsList.map((arg, index) => {
        const cleanArg = arg.replace(/['"]/g, '').replace(/\s+/g, '_');
        return `arg${index + 1}: ${arg}`;
      }).join(', ');
      return `${logger}.${method}(${message}, { ${contextProps} })`;
    }
  });
  
  // Add note about manual review if needed
  if (modifiedContent.includes('/* TODO: Async logger needed */')) {
    console.log(`${colors.yellow}⚠️  ${filePath} requires manual review for async logger usage${colors.reset}`);
  }
  
  return { content: modifiedContent, count: replacementCount };
}

// Process a single file
async function processFile(filePath) {
  try {
    // Read file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if no console statements
    if (!content.includes('console.')) {
      console.log(`${colors.blue}ℹ️  ${filePath} - No console statements found${colors.reset}`);
      return;
    }
    
    // Get service name
    const serviceName = getServiceName(filePath);
    
    // Add logger import if needed
    let modifiedContent = addLoggerImport(content, serviceName);
    
    // Replace console statements
    const { content: finalContent, count } = replaceConsoleStatements(modifiedContent, filePath);
    
    // Write back to file
    fs.writeFileSync(filePath, finalContent, 'utf8');
    
    console.log(`${colors.green}✅ ${filePath} - Migrated ${count} console statements (Service: ${serviceName})${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error processing ${filePath}: ${error.message}${colors.reset}`);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node migrate-to-logger.mjs <file1> <file2> ...');
    console.log('   or: node migrate-to-logger.mjs --from-file <file-list.txt>');
    process.exit(1);
  }
  
  let files = [];
  
  if (args[0] === '--from-file' && args[1]) {
    // Read file list from text file
    const fileListPath = args[1];
    try {
      const fileList = fs.readFileSync(fileListPath, 'utf8');
      files = fileList.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error(`${colors.red}Error reading file list: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  } else {
    // Use command line arguments as files
    files = args;
  }
  
  console.log(`${colors.blue}🔄 Starting migration of ${files.length} files...${colors.reset}\n`);
  
  // Process each file
  for (const file of files) {
    await processFile(file);
  }
  
  console.log(`\n${colors.green}✅ Migration complete!${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Please review files marked with TODO comments for async logger usage${colors.reset}`);
  console.log(`${colors.blue}ℹ️  Run 'pnpm biome check' to verify no console statements remain${colors.reset}`);
}

// Run the script
main().catch(console.error);