export const resourceFormats = ['YouTube playlist', 'Course', 'Book', 'Textbook', 'Article', 'Other'] as const;
export const practiceFormats = ['Essay', 'Video', 'Project', 'Notes', 'Other'] as const;
export const resourceTiers = [
  { value: 1, description: 'You can start here on your own, without prior study or a university background.' },
  { value: 2, description: 'You have seen the basic ideas before and recognize the main terms.' },
  { value: 3, description: 'You understand the core concepts and have read about related topics.' },
  { value: 4, description: 'You know the field well and can apply its methods to unfamiliar problems.' },
  { value: 5, description: 'You already know the research questions and techniques of a particular specialty within the field.' },
] as const;

type ResourceFormat = typeof resourceFormats[number];
export type ResourceTier = typeof resourceTiers[number]['value'];
type PracticeFormat = typeof practiceFormats[number];
type ResourceStatus = 'prerequisites' | 'planned' | 'learning' | 'completed';
type PracticeStatus = 'draft' | 'finished';

interface ResourcePublication {
  year: number;
  publisher: string;
  edition?: string;
  binding?: string;
  isbn?: string;
  pages?: number;
  sourceUrl: string;
}

export interface Resource {
  id: string;
  title: string;
  creator: string;
  format: ResourceFormat;
  tier: ResourceTier;
  subjects: string[];
  url: string;
  description: string;
  notes: string;
  publication?: ResourcePublication;
  status: ResourceStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Practice {
  id: string;
  title: string;
  format: PracticeFormat;
  subject: string;
  resourceId: string | null;
  url: string;
  content: string;
  status: PracticeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Library {
  version: 1;
  resources: Resource[];
  practice: Practice[];
}

export function safeUrl(value: string): string {
  if (!value.trim()) return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export function sourceHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return ''; }
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function validIsbn13(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const digits = value.replace(/[ -]/g, '');
  return /^97[89]\d{10}$/.test(digits) && [...digits].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0) % 10 === 0;
}

function validProgress(status: unknown, progress: unknown): boolean {
  if (typeof progress !== 'number' || !Number.isInteger(progress)) return false;
  switch (status) {
    case 'prerequisites':
    case 'planned': return progress === 0;
    case 'learning': return progress >= 0 && progress < 100;
    case 'completed': return progress === 100;
    default: return false;
  }
}

export function validateLibrary(data: unknown): Library {
  const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
  const hasStrings = (value: Record<string, unknown>, keys: string[]): boolean => keys.every(key => typeof value[key] === 'string');
  const validDates = (value: Record<string, unknown>): boolean => ['createdAt', 'updatedAt'].every(key => {
    const date = value[key];
    return typeof date === 'string' && Number.isFinite(Date.parse(date));
  });
  const validLink = (value: unknown): boolean => typeof value === 'string' && (value === '' || Boolean(safeUrl(value)));
  const validSubjects = (value: unknown): boolean => Array.isArray(value) && value.length > 0 &&
    value.every(subject => typeof subject === 'string' && subject.trim().length > 0) && new Set(value).size === value.length;
  const validPublication = (value: unknown, book: boolean): boolean => {
    if (value === undefined) return true;
    if (!isRecord(value)) return false;
    return typeof value.year === 'number' && Number.isInteger(value.year) && value.year > 0 && value.year <= 9999 &&
      typeof value.publisher === 'string' && value.publisher.trim().length > 0 &&
      [value.edition, value.binding].every(text => text === undefined || (typeof text === 'string' && text.trim().length > 0)) &&
      (book ? validIsbn13(value.isbn) : value.isbn === undefined) &&
      (value.pages === undefined || (typeof value.pages === 'number' && Number.isInteger(value.pages) && value.pages > 0)) &&
      typeof value.sourceUrl === 'string' && Boolean(safeUrl(value.sourceUrl));
  };

  if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.resources) || !Array.isArray(data.practice)) throw new Error('Unsupported library');
  const { resources, practice } = data;
  if (!resources.every(resource =>
    isRecord(resource) &&
    hasStrings(resource, ['id', 'title', 'creator', 'description', 'notes']) && resource.id && resource.title &&
    validSubjects(resource.subjects) && validDates(resource) &&
    resourceFormats.some(format => format === resource.format) &&
    resourceTiers.some(tier => tier.value === resource.tier) &&
    validProgress(resource.status, resource.progress) && validLink(resource.url)
  )) throw new Error('Invalid resources');
  if (!resources.every(resource => validPublication(resource.publication, resource.format === 'Book' || resource.format === 'Textbook'))) throw new Error('Invalid resource publication metadata');

  const resourceIds = new Set(resources.map(resource => resource.id));
  if (resourceIds.size !== resources.length) throw new Error('Duplicate resources');
  if (!practice.every(item =>
    isRecord(item) &&
    hasStrings(item, ['id', 'title', 'subject', 'content']) && item.id && item.title && validDates(item) &&
    practiceFormats.some(format => format === item.format) &&
    (item.status === 'draft' || item.status === 'finished') &&
    (item.resourceId === null || resourceIds.has(item.resourceId)) && validLink(item.url)
  )) throw new Error('Invalid practice');
  if (new Set(practice.map(item => item.id)).size !== practice.length) throw new Error('Duplicate practice');
  return data as unknown as Library;
}
