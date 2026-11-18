import data from '../data/library.json';
import { validateLibrary } from './model';

export const library = validateLibrary(data);
