export const resourceFormats = ['YouTube playlist', 'Course', 'Book', 'Textbook', 'Article', 'Other'] as const;
export const practiceFormats = ['Essay', 'Video', 'Project', 'Notes', 'Other'] as const;
export const resourceTiers = [
  { value: 1, description: 'Made for a general reader. No prior study, no university background, and a manageable scope for independent learning.' },
  { value: 2, description: 'Builds on entry-level familiarity with the topic.' },
  { value: 3, description: 'Assumes established foundations and broader relevant reading.' },
  { value: 4, description: 'Assumes substantial knowledge of the subject and its methods.' },
  { value: 5, description: 'Written for specialists in a narrow area, beyond general expertise in the wider discipline.' },
] as const;

export type ResourceFormat = typeof resourceFormats[number];
export type ResourceTier = typeof resourceTiers[number]['value'];
export type PracticeFormat = typeof practiceFormats[number];
export type ResourceStatus = 'prerequisites' | 'planned' | 'learning' | 'completed';
export type PracticeStatus = 'draft' | 'finished';

export interface ResourcePublication {
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

// Invalid published data must fail the build instead of being silently replaced.
export function parseLibrary(raw: string): Library {
  const data: unknown = JSON.parse(raw);
  const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
  const strings = (value: Record<string, unknown>, keys: string[]) => keys.every(key => typeof value[key] === 'string');
  const dates = (value: Record<string, unknown>) => ['createdAt', 'updatedAt'].every(key => typeof value[key] === 'string' && Number.isFinite(Date.parse(value[key] as string)));
  const link = (value: unknown) => typeof value === 'string' && (value === '' || Boolean(safeUrl(value)));
  const subjects = (value: unknown) => Array.isArray(value) && value.length > 0 && value.every(subject => typeof subject === 'string' && subject.trim().length > 0) && new Set(value).size === value.length;
  const publication = (value: unknown, book: boolean) => {
    if (value === undefined) return true;
    if (!object(value)) return false;
    return typeof value.year === 'number' && Number.isInteger(value.year) && value.year > 0 && value.year <= 9999 &&
      typeof value.publisher === 'string' && value.publisher.trim().length > 0 &&
      ['edition', 'binding'].every(key => value[key] === undefined || (typeof value[key] === 'string' && (value[key] as string).trim().length > 0)) &&
      (book ? validIsbn13(value.isbn) : value.isbn === undefined) &&
      (value.pages === undefined || (typeof value.pages === 'number' && Number.isInteger(value.pages) && value.pages > 0)) &&
      typeof value.sourceUrl === 'string' && Boolean(safeUrl(value.sourceUrl));
  };
  if (!object(data) || data.version !== 1 || !Array.isArray(data.resources) || !Array.isArray(data.practice)) throw new Error('Unsupported library');
  if (!data.resources.every(r => object(r) && strings(r, ['id', 'title', 'creator', 'description', 'notes']) && subjects(r.subjects) && r.id && r.title && dates(r) && resourceFormats.includes(r.format as ResourceFormat) && resourceTiers.some(tier => tier.value === r.tier) && ['prerequisites', 'planned', 'learning', 'completed'].includes(r.status as string) && typeof r.progress === 'number' && Number.isInteger(r.progress) && r.progress >= 0 && r.progress <= 100 && (r.status !== 'completed' || r.progress === 100) && (!['prerequisites', 'planned'].includes(r.status as string) || r.progress === 0) && (r.status !== 'learning' || r.progress < 100) && link(r.url))) throw new Error('Invalid resources');
  if (!data.resources.every(r => publication(r.publication, r.format === 'Book' || r.format === 'Textbook'))) throw new Error('Invalid resource publication metadata');
  const ids = new Set(data.resources.map(r => r.id));
  if (ids.size !== data.resources.length) throw new Error('Duplicate resources');
  if (!data.practice.every(p => object(p) && strings(p, ['id', 'title', 'subject', 'content']) && p.id && p.title && dates(p) && practiceFormats.includes(p.format as PracticeFormat) && ['draft', 'finished'].includes(p.status as string) && (p.resourceId === null || ids.has(p.resourceId)) && link(p.url))) throw new Error('Invalid practice');
  if (new Set(data.practice.map(p => p.id)).size !== data.practice.length) throw new Error('Duplicate practice');
  return data as unknown as Library;
}
