import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the compiled survey definitions file relative to the compiled script's location
const COMPILED_SURVEYS_YAML_PATH = path.resolve(__dirname, '../../data/definitions/survey-definitions.yaml');

async function checkYaml() {
  try {
    console.log(`Reading YAML file from: ${COMPILED_SURVEYS_YAML_PATH}`);
    const fileContent = await fs.readFile(COMPILED_SURVEYS_YAML_PATH, 'utf-8');
    const parsedData = yaml.load(fileContent);
    console.log('Parsed YAML data:');
    console.log(JSON.stringify(parsedData, null, 2));
  } catch (error) {
    console.error('Error reading or parsing YAML:');
    console.error(error);
  }
}

checkYaml();
