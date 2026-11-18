import { readFile } from 'node:fs/promises';
import { validateLibrary } from '../src/model.ts';

try {
  const raw = await readFile(process.argv[2] || 'data/library.json', 'utf8');
  const library = validateLibrary(JSON.parse(raw));
  console.log(`Validated ${library.resources.length} resources and ${library.practice.length} practice entries.`);
} catch (error) {
  console.error(`Learning data is invalid: ${error.message}`);
  process.exitCode = 1;
}
