export const resourceFormats = ['Playlist', 'Course', 'Book', 'Textbook', 'Article', 'Other'] as const;
export const practiceFormats = ['Essay', 'Video', 'Project', 'Notes', 'Other'] as const;
export const resourceTiers = [
  { value: 1, name: 'Entry point', description: 'Made for a general reader. No prior study, no university background, and a manageable scope for independent learning.' },
  { value: 2, name: 'Foundations', description: 'Builds on entry-level familiarity with the topic.' },
  { value: 3, name: 'Intermediate', description: 'Assumes established foundations and broader relevant reading.' },
  { value: 4, name: 'Advanced', description: 'Assumes substantial knowledge of the subject and its methods.' },
  { value: 5, name: 'Specialist', description: 'Written for specialists in a narrow area, beyond general expertise in the wider discipline.' },
] as const;

export type ResourceFormat = typeof resourceFormats[number];
export type ResourceTier = typeof resourceTiers[number]['value'];
export type PracticeFormat = typeof practiceFormats[number];
export type ResourceStatus = 'planned' | 'learning' | 'completed';
export type PracticeStatus = 'draft' | 'finished';

export interface Resource {
  id: string;
  title: string;
  creator: string;
  format: ResourceFormat;
  tier: ResourceTier;
  subject: string;
  url: string;
  description: string;
  notes: string;
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

// Invalid published data must fail the build instead of being silently replaced.
export function parseLibrary(raw: string): Library {
  const data: unknown = JSON.parse(raw);
  const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
  const strings = (value: Record<string, unknown>, keys: string[]) => keys.every(key => typeof value[key] === 'string');
  const dates = (value: Record<string, unknown>) => ['createdAt', 'updatedAt'].every(key => typeof value[key] === 'string' && Number.isFinite(Date.parse(value[key] as string)));
  const link = (value: unknown) => typeof value === 'string' && (value === '' || Boolean(safeUrl(value)));
  if (!object(data) || data.version !== 1 || !Array.isArray(data.resources) || !Array.isArray(data.practice)) throw new Error('Unsupported library');
  if (!data.resources.every(r => object(r) && strings(r, ['id', 'title', 'creator', 'subject', 'description', 'notes']) && r.id && r.title && dates(r) && resourceFormats.includes(r.format as ResourceFormat) && resourceTiers.some(tier => tier.value === r.tier) && ['planned', 'learning', 'completed'].includes(r.status as string) && typeof r.progress === 'number' && Number.isInteger(r.progress) && r.progress >= 0 && r.progress <= 100 && (r.status !== 'completed' || r.progress === 100) && (r.status !== 'planned' || r.progress === 0) && (r.status !== 'learning' || r.progress < 100) && link(r.url))) throw new Error('Invalid resources');
  const ids = new Set(data.resources.map(r => r.id));
  if (ids.size !== data.resources.length) throw new Error('Duplicate resources');
  if (!data.practice.every(p => object(p) && strings(p, ['id', 'title', 'subject', 'content']) && p.id && p.title && dates(p) && practiceFormats.includes(p.format as PracticeFormat) && ['draft', 'finished'].includes(p.status as string) && (p.resourceId === null || ids.has(p.resourceId)) && link(p.url))) throw new Error('Invalid practice');
  if (new Set(data.practice.map(p => p.id)).size !== data.practice.length) throw new Error('Duplicate practice');
  return data as unknown as Library;
}
