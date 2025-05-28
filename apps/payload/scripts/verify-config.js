#!/usr/bin/env node

/**
 * Payload CMS Configuration Verification Script
 * 
 * This script helps verify that all required environment variables
 * are properly configured for Payload CMS to work correctly.
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Logs a message with the specified color.
 * @param {string} color - The color code to use for the message.
 * @param {string} message - The message to log.
 */
function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Checks if an environment variable is set.
 * @param {string} name - The name of the environment variable.
 * @param {boolean} [required=true] - Whether the variable is required.
 * @returns {boolean} - True if the variable is set or optional and not set, false if required and missing.
 */
function checkEnvVar(name, required = true) {
  const value = process.env[name];
  const exists = !!value;
  
  if (required && !exists) {
    log(colors.red, `❌ ${name}: MISSING (Required)`);
    return false;
  } else if (!required && !exists) {
    log(colors.yellow, `⚠️  ${name}: Not set (Optional)`);
    return true;
  } else {
    const displayValue = name.includes('SECRET') || name.includes('PASSWORD') || name.includes('KEY')
      ? (value ? `${value.substring(0, 8)}...` : '')
      : value;
    log(colors.green, `✅ ${name}: ${displayValue}`);
    return true;
  }
}

function main() {
  log(colors.blue + colors.bold, '\n🔍 Payload CMS Configuration Verification\n');
  
  let allGood = true;
  
  // Database Configuration
  log(colors.blue + colors.bold, '📊 Database Configuration:');
  allGood &&= checkEnvVar('DATABASE_URI', true);
  allGood &&= checkEnvVar('NODE_ENV', true);
  
  // Payload Configuration
  log(colors.blue + colors.bold, '\n⚙️  Payload Configuration:');
  allGood &&= checkEnvVar('PAYLOAD_SECRET', true);
  allGood &&= checkEnvVar('PAYLOAD_PUBLIC_SERVER_URL', true);
  
  // Storage Configuration
  log(colors.blue + colors.bold, '\n💾 Storage Configuration:');
  
  // Check for your existing Cloudflare R2 configuration
  const hasR2 = process.env.R2_ACCESS_KEY_ID &&
                process.env.R2_SECRET_ACCESS_KEY &&
                process.env.R2_ACCOUNT_ID &&
                process.env.R2_MEDIA_BUCKET;
  
  // Check for legacy Cloudflare R2 format
  const hasLegacyR2 = process.env.CLOUDFLARE_R2_BUCKET &&
                      process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
                      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
                      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  
  // Check for AWS S3
  const hasS3 = process.env.S3_BUCKET &&
                process.env.S3_REGION &&
                process.env.AWS_ACCESS_KEY_ID &&
                process.env.AWS_SECRET_ACCESS_KEY;
  
  if (hasR2) {
    log(colors.green, '🟢 Cloudflare R2 Storage (Your Configuration):');
    allGood &&= checkEnvVar('R2_ACCOUNT_ID', true);
    allGood &&= checkEnvVar('R2_MEDIA_BUCKET', true);
    checkEnvVar('R2_DOWNLOADS_BUCKET', false);
    allGood &&= checkEnvVar('R2_ACCESS_KEY_ID', true);
    allGood &&= checkEnvVar('R2_SECRET_ACCESS_KEY', true);
    checkEnvVar('R2_ENDPOINT', false);
    checkEnvVar('R2_REGION', false);
    
    // Check optional public URLs
    log(colors.blue, '\n📡 Optional Public URLs:');
    checkEnvVar('PAYLOAD_PUBLIC_MEDIA_BASE_URL', false);
    checkEnvVar('PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL', false);
    
  } else if (hasLegacyR2) {
    log(colors.green, '🟢 Cloudflare R2 Storage (Legacy Format):');
    allGood &&= checkEnvVar('CLOUDFLARE_R2_ACCOUNT_ID', true);
    allGood &&= checkEnvVar('CLOUDFLARE_R2_BUCKET', true);
    allGood &&= checkEnvVar('CLOUDFLARE_R2_ACCESS_KEY_ID', true);
    allGood &&= checkEnvVar('CLOUDFLARE_R2_SECRET_ACCESS_KEY', true);
  } else if (hasS3) {
    log(colors.green, '🟢 AWS S3 Storage:');
    allGood &&= checkEnvVar('S3_BUCKET', true);
    allGood &&= checkEnvVar('S3_REGION', true);
    allGood &&= checkEnvVar('AWS_ACCESS_KEY_ID', true);
    allGood &&= checkEnvVar('AWS_SECRET_ACCESS_KEY', true);
  } else {
    log(colors.red, '❌ No cloud storage configured!');
    log(colors.yellow, '   This will cause errors in production/serverless environments.');
    log(colors.yellow, '   Please configure either Cloudflare R2 or AWS S3.');
    allGood = false;
  }
  
  // Results Summary
  log(colors.blue + colors.bold, '\n📋 Configuration Summary:');
  
  if (allGood) {
    log(colors.green + colors.bold, '🎉 All configuration looks good!');
    
    if (hasR2) {
      log(colors.green, '   ✅ Cloudflare R2 storage configured with your custom environment variables');
      log(colors.green, '   ✅ Media bucket: ' + process.env.R2_MEDIA_BUCKET);
      if (process.env.R2_DOWNLOADS_BUCKET) {
        log(colors.green, '   ✅ Downloads bucket: ' + process.env.R2_DOWNLOADS_BUCKET);
      }
    } else if (hasLegacyR2) {
      log(colors.green, '   ✅ Cloudflare R2 storage configured (legacy format)');
    } else if (hasS3) {
      log(colors.green, '   ✅ AWS S3 storage configured');
    }
    
    log(colors.blue, '\n📝 Next steps:');
    log(colors.blue, '   1. Test your configuration by starting the app: npm run dev');
    log(colors.blue, '   2. Navigate to /admin and try uploading a file');
    log(colors.blue, '   3. Verify files appear in your R2 buckets');
    log(colors.blue, '   4. Deploy to production and test again');
    
  } else {
    log(colors.red + colors.bold, '❌ Configuration issues detected!');
    log(colors.yellow, '\n📝 Required actions:');
    log(colors.yellow, '   1. Set all missing required environment variables');
    log(colors.yellow, '   2. Ensure your R2 configuration is complete');
    log(colors.yellow, '   3. Run this script again to verify');
    log(colors.yellow, '   4. Review ENVIRONMENT.md and CLOUDFLARE_R2_SETUP.md for guidance');
  }
  
  // Environment-specific warnings
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production' && !hasR2 && !hasLegacyR2 && !hasS3) {
    log(colors.red + colors.bold, '\n🚨 CRITICAL: Production environment without cloud storage!');
    log(colors.red, '   This WILL cause the "mkdir \'media\'" error in serverless environments.');
  }
  
  // R2 Configuration Details
  if (hasR2) {
    log(colors.blue + colors.bold, '\n🔧 R2 Configuration Details:');
    const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    log(colors.blue, `   Endpoint: ${endpoint}`);
    log(colors.blue, `   Region: ${process.env.R2_REGION || 'auto'}`);
    log(colors.blue, `   Account ID: ${process.env.R2_ACCOUNT_ID}`);
  }
  
  console.log(); // Final newline
  process.exit(allGood ? 0 : 1);
}

// Handle different ways this script might be run
import url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

if (process.argv[1] === __filename) {
  main();
}

export { checkEnvVar, main };