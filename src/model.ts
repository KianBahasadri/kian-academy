export const resourceFormats = ['Playlist', 'Course', 'Book', 'Textbook', 'Article', 'Other'] as const;
export const practiceFormats = ['Essay', 'Video', 'Project', 'Notes', 'Other'] as const;
export const subjects = ['Mathematics', 'Computer science', 'Writing', 'Biology', 'Learning', 'Physics', 'History', 'Art'] as const;

export type ResourceFormat = typeof resourceFormats[number];
export type PracticeFormat = typeof practiceFormats[number];
export type ResourceStatus = 'planned' | 'learning' | 'completed';
export type PracticeStatus = 'draft' | 'finished';

export interface Resource {
  id: string;
  title: string;
  creator: string;
  format: ResourceFormat;
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

export const STORAGE_KEY = 'kian-academy:library:v1';

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

export function resourceProgress(resource: Resource, progress: number): Resource {
  const value = Math.max(0, Math.min(100, Math.round(progress)));
  return { ...resource, progress: value, status: value === 100 ? 'completed' : value > 0 || resource.status !== 'planned' ? 'learning' : 'planned' };
}

export function resourceStatus(resource: Resource, status: ResourceStatus): Resource {
  return { ...resource, status, progress: status === 'completed' ? 100 : status === 'planned' ? 0 : resource.progress === 100 ? 0 : resource.progress };
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// Validate saved data before using it. A damaged or newer save is never replaced by examples.
export function parseLibrary(raw: string): Library {
  const data: unknown = JSON.parse(raw);
  const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
  const strings = (value: Record<string, unknown>, keys: string[]) => keys.every(key => typeof value[key] === 'string');
  const dates = (value: Record<string, unknown>) => ['createdAt', 'updatedAt'].every(key => typeof value[key] === 'string' && Number.isFinite(Date.parse(value[key] as string)));
  const link = (value: unknown) => typeof value === 'string' && (value === '' || Boolean(safeUrl(value)));
  if (!object(data) || data.version !== 1 || !Array.isArray(data.resources) || !Array.isArray(data.practice)) throw new Error('Unsupported library');
  if (!data.resources.every(r => object(r) && strings(r, ['id', 'title', 'creator', 'subject', 'description', 'notes']) && r.id && r.title && dates(r) && resourceFormats.includes(r.format as ResourceFormat) && ['planned', 'learning', 'completed'].includes(r.status as string) && typeof r.progress === 'number' && Number.isInteger(r.progress) && r.progress >= 0 && r.progress <= 100 && (r.status !== 'completed' || r.progress === 100) && (r.status !== 'planned' || r.progress === 0) && (r.status !== 'learning' || r.progress < 100) && link(r.url))) throw new Error('Invalid resources');
  const ids = new Set(data.resources.map(r => r.id));
  if (ids.size !== data.resources.length) throw new Error('Duplicate resources');
  if (!data.practice.every(p => object(p) && strings(p, ['id', 'title', 'subject', 'content']) && p.id && p.title && dates(p) && practiceFormats.includes(p.format as PracticeFormat) && ['draft', 'finished'].includes(p.status as string) && (p.resourceId === null || ids.has(p.resourceId)) && link(p.url))) throw new Error('Invalid practice');
  if (new Set(data.practice.map(p => p.id)).size !== data.practice.length) throw new Error('Duplicate practice');
  return data as unknown as Library;
}
