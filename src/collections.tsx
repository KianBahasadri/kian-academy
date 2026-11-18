import type { ReactNode } from 'react';
import { ArrowUpRight, NotebookPen } from 'lucide-react';
import type { Library, Practice, Resource } from './model';
import { practiceFormats, resourceFormats, safeUrl, sourceHost, wordCount } from './model';
import type { TableColumn, TableModel } from './table';
import { ResourceMark, Status, Subjects } from './components/ui';

export type LearningItem = Resource | Practice;
export type CollectionPage = 'resources' | 'practice';

const statusLabels: Record<string, string> = { prerequisites: 'Prerequisites needed', planned: 'To learn', learning: 'In progress', completed: 'Completed', draft: 'Draft', finished: 'Finished' };
const dates: TableColumn[] = [
  { key: 'updatedAt', title: 'Updated', width: 150, align: 'right' },
  { key: 'createdAt', title: 'Added', width: 150, align: 'right' },
];
const website: TableColumn = { key: 'url', title: 'Website', wrap: true, width: 180 };
export const resourceColumns: TableColumn[] = [
  { key: 'title', title: 'Resource', required: true, width: 340, minWidth: 220 },
  { key: 'creator', title: 'Creator', wrap: true, width: 200 },
  { key: 'format', title: 'Format', choices: resourceFormats.map(value => ({ value, label: value })), width: 130 },
  { key: 'subjects', title: 'Subjects', choices: 'values', wrap: true, width: 180 },
  { key: 'tier', title: 'Tier', number: { min: 1, max: 5 }, width: 110 },
  { key: 'progress', title: 'Progress', number: { min: 0, max: 100 }, minWidth: 156, width: 180 },
  { key: 'status', title: 'Status', choices: ['prerequisites', 'planned', 'learning', 'completed'].map(value => ({ value, label: statusLabels[value] })), width: 150 },
  { key: 'practice', title: 'Practice', number: { min: 0, max: Number.MAX_SAFE_INTEGER }, width: 130 },
  { key: 'notes', title: 'Notes', wrap: true, width: 260 },
  { key: 'description', title: 'Description', wrap: true, width: 300 },
  ...dates, website,
];
export const practiceColumns: TableColumn[] = [
  { key: 'title', title: 'Work', required: true, width: 340, minWidth: 220 },
  { key: 'format', title: 'Format', choices: practiceFormats.map(value => ({ value, label: value })), width: 130 },
  { key: 'subject', title: 'Subject', choices: 'values', width: 150 },
  { key: 'status', title: 'Status', choices: ['draft', 'finished'].map(value => ({ value, label: statusLabels[value] })), width: 130 },
  { key: 'resource', title: 'Related resource', wrap: true, width: 260 },
  { key: 'words', title: 'Words', number: { min: 0, max: Number.MAX_SAFE_INTEGER }, width: 120 },
  { key: 'content', title: 'Writing', wrap: true, width: 300 },
  ...dates, website,
];
export const defaultResourceColumns = ['title', 'format', 'subjects', 'tier', 'progress', 'practice'];
export const defaultPracticeColumns = ['title', 'format', 'subject', 'status', 'resource', 'updatedAt'];

export function collectionModel(library: Library): TableModel<LearningItem> {
  const resources = new Map(library.resources.map(resource => [resource.id, resource]));
  const counts = new Map<string, number>();
  for (const item of library.practice) if (item.resourceId) counts.set(item.resourceId, (counts.get(item.resourceId) ?? 0) + 1);
  return {
    value: (item, key) => {
      switch (key) {
        case 'title': return item.title;
        case 'creator': return 'creator' in item ? item.creator || null : null;
        case 'format': return item.format;
        case 'subjects': return 'subjects' in item ? item.subjects : null;
        case 'subject': return 'subject' in item ? item.subject : null;
        case 'tier': return 'tier' in item ? item.tier : null;
        case 'progress': return 'progress' in item ? item.progress : null;
        case 'status': return item.status;
        case 'practice': return counts.get(item.id) ?? 0;
        case 'notes': return 'notes' in item ? item.notes || null : null;
        case 'description': return 'description' in item ? item.description || null : null;
        case 'resource':
          if (!('resourceId' in item)) return null;
          return item.resourceId ? resources.get(item.resourceId)!.title : 'Independent';
        case 'words': return 'content' in item ? wordCount(item.content) : null;
        case 'content': return 'content' in item ? item.content || null : null;
        case 'createdAt': return item.createdAt;
        case 'updatedAt': return item.updatedAt;
        case 'url': return item.url || null;
        default: throw new Error(`Unknown collection column: ${key}`);
      }
    },
    compare: (a, b, key) => {
      if (key === 'createdAt' || key === 'updatedAt') return Date.parse(a[key]) - Date.parse(b[key]);
      if (key === 'status') {
        const ranks: Record<string, number> = { prerequisites: -1, planned: 0, learning: 1, completed: 2, draft: 0, finished: 1 };
        return ranks[a.status] - ranks[b.status];
      }
      return undefined;
    },
    matchesChoice: (item, key, choice) => key === 'resource' && 'resourceId' in item ? (item.resourceId ?? 'independent') === choice : undefined,
  };
}

export function renderCollectionCell(
  item: LearningItem,
  column: TableColumn,
  model: TableModel<LearningItem>,
  onPractice: (resourceId: string) => void,
  onResource: (id: string) => void,
): ReactNode {
  switch (column.key) {
    case 'title': {
      let byline = '';
      if ('content' in item) {
        const words = wordCount(item.content);
        const emptyByline = item.url ? 'Linked work' : 'Draft';
        byline = words ? `${words.toLocaleString()} words` : emptyByline;
      }
      return <>
        <ResourceMark format={item.format} subjects={'subjects' in item ? item.subjects : [item.subject]} />
        <span className="item-identity"><span>{item.title}</span>{byline && <small>{byline}</small>}</span>
      </>;
    }
    case 'format': return <span className="format-label">{item.format}</span>;
    case 'subjects': return 'subjects' in item ? <Subjects values={item.subjects} /> : null;
    case 'tier': return 'tier' in item ? <span className="tier-label">{item.tier}</span> : null;
    case 'status': return <Status value={item.status} />;
    case 'progress': {
      if (!('progress' in item)) return null;
      if (item.status === 'prerequisites') return <Status value={item.status} />;
      if (item.status === 'planned') return <span className="not-started">Not started</span>;
      return <div className={`table-progress ${item.status === 'completed' ? 'complete' : ''}`}>
        <div><Status value={item.status} /><span className="mono">{item.progress}%</span></div>
        <progress aria-label={`${item.title} progress`} value={item.progress} max={100} />
      </div>;
    }
    case 'practice': {
      const count = model.value(item, column.key);
      if (!count) return <span className="muted">0</span>;
      return <button type="button" className="practice-count" aria-label={`View practice for ${item.title}`} onClick={() => onPractice(item.id)}>
        <NotebookPen size={14} aria-hidden="true" />{count}
      </button>;
    }
    case 'resource': {
      const resourceId = 'resourceId' in item ? item.resourceId : null;
      if (!resourceId) return <span className="muted">Independent</span>;
      return <button type="button" className="table-resource-link" onClick={() => onResource(resourceId)}>{model.value(item, column.key)}</button>;
    }
    case 'createdAt':
    case 'updatedAt': {
      const value = item[column.key];
      const date = new Date(value);
      return <time dateTime={value} title={date.toLocaleString()}>{date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time>;
    }
    case 'url': {
      const url = safeUrl(item.url);
      if (!url) return <span className="muted">—</span>;
      return <a className="table-website" href={url} target="_blank" rel="noopener noreferrer">{sourceHost(item.url)}<ArrowUpRight size={13} aria-hidden="true" /></a>;
    }
    default: {
      const value = model.value(item, column.key);
      return value === '' || value === null ? <span className="muted">—</span> : String(value);
    }
  }
}
