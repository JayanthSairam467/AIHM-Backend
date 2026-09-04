import fs from 'fs';
import yaml from 'yaml';
try {
  const file = fs.readFileSync('openapi.yaml', 'utf8');
  const doc = yaml.parse(file);
  if (!doc.openapi || !doc.info || !doc.paths) {
    throw new Error('Invalid OpenAPI document');
  }
  console.log('OpenAPI validation successful.');
} catch (err) {
  console.error('Validation failed:', err.message);
  process.exit(1);
}
