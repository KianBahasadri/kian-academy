export const resourceFormats = ['YouTube playlist', 'Course', 'Book', 'Textbook', 'Article', 'Other'] as const;
export const practiceFormats = ['Essay', 'Video', 'Project', 'Notes', 'Other'] as const;
export const resourceTiers = [
  { value: 1, numeral: 'I', description: 'You can start here on your own, without prior study or a university background.' },
  { value: 2, numeral: 'II', description: 'You have seen the basic ideas before and recognize the main terms.' },
  { value: 3, numeral: 'III', description: 'You understand the core concepts and have read about related topics.' },
  { value: 4, numeral: 'IV', description: 'You know the field well and can apply its methods to unfamiliar problems.' },
  { value: 5, numeral: 'V', description: 'You already know the research questions and techniques of the specific specialty this resource covers.' },
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
  overview?: boolean;
  areas?: string[];
  specialty?: string;
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
  disciplines: Record<string, string[]>;
  resources: Resource[];
  practice: Practice[];
}

// Indexed by the completed resource's tier (I–IV).
export const completionTargets = [2, 3, 4, 4] as const;

export function prerequisiteChecks(resource: Resource, resources: Resource[]) {
  const { tier, specialty } = resource;
  const discipline = resource.subjects[0];
  const completed = resources.filter(item => item.status === 'completed' && item.subjects[0] === discipline);
  const checks: { label: string; count: number; required: number }[] = completionTargets.slice(0, tier - 1).map((required, index) => {
    const level = resourceTiers[index];
    const inSpecialty = level.value === 4;
    const count = completed.filter(item => item.tier === level.value && (!inSpecialty || item.specialty === specialty)).length;
    return { label: `Tier ${level.numeral} resources in ${inSpecialty ? specialty : discipline}`, count, required };
  });
  if (tier >= 2) checks.push({
    label: `Tier I overview of ${discipline}`, count: completed.filter(item => item.tier === 1 && item.overview).length, required: 1,
  });
  if (tier >= 3) {
    const areas = (levels: ResourceTier[]) => new Set(completed.filter(item => levels.includes(item.tier)).flatMap(item => item.areas ?? [])).size;
    checks.push({ label: 'Distinct foundational areas in Tier II', count: areas([2]), required: 2 });
    if (tier >= 4) checks.push({ label: 'Distinct foundational areas across Tiers II and III', count: areas([2, 3]), required: 4 });
  }
  return checks;
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
  const validSubjects = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 &&
    value.every(subject => typeof subject === 'string' && subject.trim().length > 0 && subject === subject.trim()) &&
    new Set(value.map(subject => subject.toLowerCase())).size === value.length;
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
  const { resources, practice, disciplines } = data;
  if (!isRecord(disciplines) || Array.isArray(disciplines) ||
    new Set(Object.keys(disciplines).map(name => name.toLowerCase())).size !== Object.keys(disciplines).length ||
    !Object.entries(disciplines).every(([name, areas]) => name.trim() && name === name.trim() &&
      validSubjects(areas) && areas.length >= 4)) throw new Error('Invalid discipline definitions');
  if (!resources.every(resource =>
    isRecord(resource) &&
    hasStrings(resource, ['id', 'title', 'creator', 'description', 'notes']) && resource.id && resource.title &&
    validSubjects(resource.subjects) && validDates(resource) &&
    resourceFormats.some(format => format === resource.format) &&
    resourceTiers.some(tier => tier.value === resource.tier) &&
    validProgress(resource.status, resource.progress) && validLink(resource.url)
  )) throw new Error('Invalid resources');
  for (const resource of resources as Resource[]) {
    const discipline = resource.subjects[0];
    const areas = disciplines[discipline] as string[];
    if (!Object.hasOwn(disciplines, discipline) ||
      (resource.areas !== undefined && (!(resource.tier === 2 || resource.tier === 3) ||
        !validSubjects(resource.areas) || !resource.areas.every(area => areas.includes(area)))) ||
      (resource.overview !== undefined && (resource.tier !== 1 || typeof resource.overview !== 'boolean')) ||
      (resource.specialty !== undefined && (resource.tier < 4 || typeof resource.specialty !== 'string' ||
        !resource.specialty.trim() || resource.specialty !== resource.specialty.trim())) ||
      (resource.tier === 5 && !resource.specialty)) throw new Error(`Invalid prerequisite classification for ${resource.id}`);
  }
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
  const library = data as unknown as Library;
  return { ...library, resources: library.resources.map(resource => {
    if (resource.status === 'planned' && prerequisiteChecks(resource, library.resources).some(check => check.count < check.required)) {
      return { ...resource, status: 'prerequisites' };
    }
    return resource;
  }) };
}
