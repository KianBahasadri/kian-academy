import { readFile } from 'node:fs/promises';
import { parseLibrary } from '../src/model.ts';

try {
  const library = parseLibrary(await readFile(process.argv[2] || 'data/library.json', 'utf8'));
  console.log(`Validated ${library.resources.length} resources and ${library.practice.length} practice entries.`);
} catch (error) {
  console.error(`Learning data is invalid: ${error.message}`);
  process.exitCode = 1;
}
