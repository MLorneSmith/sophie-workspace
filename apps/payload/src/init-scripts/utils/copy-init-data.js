import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Adjust paths relative to the new script location: apps/payload/src/init-scripts/utils
const sourceDir = path.join(__dirname, '../data'); // data is sibling to utils
const destDir = path.join(__dirname, '../../dist/src/init-scripts/data'); // dist is sibling to apps/payload/src

try {
  console.log(`Attempting to copy data from ${sourceDir} to ${destDir}...`);
  console.log('Source directory (data):', sourceDir);
  console.log('Destination directory (data):', destDir);

  // Check if source directory exists and list its contents
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }
  console.log('Source directory contents (data):', fs.readdirSync(sourceDir));

  const destParentDir = path.join(__dirname, '../../dist/src/init-scripts');
  fs.mkdirSync(destParentDir, { recursive: true });
  console.log(`Ensured destination parent directory exists: ${destParentDir}`);

  // Explicitly copy survey-definitions.yaml
  const sourceYamlPath = path.join(sourceDir, 'definitions', 'survey-definitions.yaml');
  const destYamlPath = path.join(destDir, 'definitions', 'survey-definitions.yaml');
  console.log(`Attempting to copy ${sourceYamlPath} to ${destYamlPath}...`);
  fs.copyFileSync(sourceYamlPath, destYamlPath);
  console.log(`Successfully copied ${sourceYamlPath} to ${destYamlPath}.`);

  // TODO: Add logic to copy other data files and directories recursively
  console.log('Successfully copied init data files (YAML only for now).');

} catch (err) {
  console.error('Error copying init data files:', err);
  console.error('Error details:', err);
  process.exit(1);
}
