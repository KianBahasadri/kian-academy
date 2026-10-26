import data from '../data/library.json';
import { parseLibrary } from './model';

export const library = parseLibrary(JSON.stringify(data));
export const repositoryUrl = 'https://github.com/KianBahasadri/kian-academy';
