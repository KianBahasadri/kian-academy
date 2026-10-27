import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, CircleHelp, Github, Library, Moon, NotebookPen, Search, Sun, X } from 'lucide-react';
import { practiceFormats, resourceFormats, resourceTiers } from './model';
import { library, repositoryUrl } from './library';
import { Select } from './components/ui';
import { PracticeDetails, ResourceDetails } from './components/Details';
import { CollectionInfo } from './components/CollectionInfo';
import { Commands, KeyboardShortcuts } from './components/Commands';
import type { Command, CommandMode } from './components/Commands';
import { CollectionTable } from './components/CollectionTable';
import { collectionModel, defaultPracticeColumns, defaultResourceColumns, practiceColumns, renderCollectionCell, resourceColumns } from './collections';
import type { CollectionPage, LearningItem } from './collections';
import { createTableView } from './table';
import type { ColumnFilter, TableView } from './table';
import type { TableViewUpdate } from './components/CollectionTable';

type Page = CollectionPage;
type Filters = { search: string; status: string; subject: string; format: string; tier: string; resource: string };
type Modal = { type: 'resource' | 'practice'; id: string } | { type: 'info' | 'shortcuts' } | { type: 'commands'; mode: CommandMode } | null;
const emptyFilters = (): Filters => ({ search: '', status: 'all', subject: 'all', format: 'all', tier: 'all', resource: 'all' });
const currentPage = (): Page => window.location.hash.startsWith('#/practice') ? 'practice' : 'resources';

export default function App() {
  const [page, setPage] = useState<Page>(currentPage);
  const [allFilters, setAllFilters] = useState<Record<Page, Filters>>({ resources: emptyFilters(), practice: emptyFilters() });
  const [modal, setModal] = useState<Modal>(null);
  const [theme, setTheme] = useState('dark');
  const [tableViews, setTableViews] = useState<Record<Page, TableView>>(() => ({ resources: createTableView(resourceColumns, defaultResourceColumns), practice: createTableView(practiceColumns, defaultPracticeColumns) }));
  const model = useMemo(() => collectionModel(library), []);
  const practiceDefinition = useMemo(() => practiceColumns.map(column => column.key === 'resource' ? { ...column, choices: [{ value: 'independent', label: 'Independent' }, ...library.resources.map(resource => ({ value: resource.id, label: resource.title }))] } : column), []);
  const searchRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const filters = allFilters[page];
  const isResources = page === 'resources';
  const updateFilters = (patch: Partial<Filters>) => {
    setAllFilters(current => ({ ...current, [page]: { ...current[page], ...patch } }));
    setTableViews(current => {
      const columnFilters = { ...current[page].filters };
      for (const key of Object.keys(patch)) if (key !== 'search') delete columnFilters[key === 'subject' && isResources ? 'subjects' : key];
      return { ...current, [page]: { ...current[page], filters: columnFilters } };
    });
  };
  const clearFilters = () => {
    setAllFilters(current => ({ ...current, [page]: emptyFilters() }));
    setTableViews(current => ({ ...current, [page]: { ...current[page], filters: {} } }));
  };
  const updateTable = (update: TableViewUpdate) => setTableViews(current => ({ ...current, [page]: update(current[page]) }));
  const updateColumnFilter = (key: string, filter?: ColumnFilter) => {
    setTableViews(current => {
      const next = { ...current[page].filters };
      if (filter) next[key] = filter; else delete next[key];
      return { ...current, [page]: { ...current[page], filters: next } };
    });
    const quickKey = key === 'subjects' ? 'subject' : key;
    if (['status', 'subject', 'format', 'tier', 'resource'].includes(quickKey)) setAllFilters(current => ({ ...current, [page]: { ...current[page], [quickKey]: 'all' } }));
  };

  useEffect(() => {
    const sync = () => { setPage(currentPage()); setModal(null); };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => { document.title = `Kian Academy · ${isResources ? 'Resources' : 'Practice'}`; }, [isResources]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#080b0d' : '#ecefec');
  }, [theme]);
  useEffect(() => {
    function shortcuts(event: KeyboardEvent) {
      const inCommands = modal?.type === 'commands';
      if (event.defaultPrevented || event.isComposing || (modal && !inCommands)) return;
      if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') || (event.ctrlKey && event.code === 'Space')) {
        event.preventDefault(); setModal({ type: 'commands', mode: 'commands' }); return;
      }
      if (!inCommands && event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        if (!event.shiftKey && event.code === 'KeyJ') { event.preventDefault(); setModal({ type: 'commands', mode: 'pages' }); }
        else if (!event.shiftKey && (event.code === 'Digit1' || event.code === 'Digit2')) {
          event.preventDefault(); setModal(null); window.location.hash = event.code === 'Digit1' ? '/resources' : '/practice';
        } else if (event.shiftKey && event.code === 'KeyT') { event.preventDefault(); setModal(null); setTheme(current => current === 'dark' ? 'light' : 'dark'); }
        else if (!event.shiftKey && event.code === 'Slash') { event.preventDefault(); setModal({ type: 'shortcuts' }); }
      } else if (!modal && event.key === '/' && !event.ctrlKey && !event.metaKey) { event.preventDefault(); searchRef.current?.focus(); }
    }
    window.addEventListener('keydown', shortcuts);
    return () => window.removeEventListener('keydown', shortcuts);
  }, [modal]);

  const collection = isResources ? library.resources : library.practice;
  const subjectOptions = [...new Set(collection.flatMap(item => 'subjects' in item ? item.subjects : [item.subject]))].sort();
  const counts = Object.fromEntries(['all', 'prerequisites', 'planned', 'learning', 'completed', 'draft', 'finished'].map(status => [status, status === 'all' ? collection.length : collection.filter(item => item.status === status).length]));
  const resourceById = useMemo(() => new Map(library.resources.map(resource => [resource.id, resource])), []);
  const candidates = collection.filter(item => {
    const related = 'resourceId' in item && item.resourceId ? resourceById.get(item.resourceId)?.title ?? '' : '';
    const subjects = 'subjects' in item ? item.subjects : [item.subject];
    const searchable = [item.title, ...subjects, item.format, related, 'creator' in item ? item.creator : item.content, 'notes' in item ? item.notes : '', 'description' in item ? item.description : ''].join(' ').toLocaleLowerCase();
    return searchable.includes(filters.search.trim().toLocaleLowerCase()) &&
      (filters.status === 'all' || item.status === filters.status) && (filters.subject === 'all' || subjects.includes(filters.subject)) &&
      (filters.format === 'all' || item.format === filters.format) && (!isResources || filters.tier === 'all' || ('tier' in item && item.tier === Number(filters.tier))) &&
      (isResources || filters.resource === 'all' || ('resourceId' in item && (filters.resource === 'independent' ? !item.resourceId : item.resourceId === filters.resource)));
  });
  const hasFilters = filters.search !== '' || filters.status !== 'all' || filters.subject !== 'all' || filters.format !== 'all' || filters.tier !== 'all' || filters.resource !== 'all';
  const selectedResource = modal && 'id' in modal ? resourceById.get(modal.id) : undefined;
  const selectedPractice = modal && 'id' in modal ? library.practice.find(item => item.id === modal.id) : undefined;
  const statuses = isResources ? [['all', 'All resources'], ['learning', 'In progress'], ['planned', 'To learn'], ['prerequisites', 'Prerequisites needed'], ['completed', 'Completed']] : [['all', 'All practice'], ['draft', 'Drafts'], ['finished', 'Finished']];
  const commands: Command[] = [
    { label: 'Search this collection', keys: ['/'], run: () => searchRef.current?.focus() },
    { label: 'Toggle theme', keys: ['Alt', 'Shift', 'T'], run: () => setTheme(current => current === 'dark' ? 'light' : 'dark') },
    { label: 'Keyboard shortcuts', keys: ['Alt', '/'], run: () => setModal({ type: 'shortcuts' }) },
  ];
  const destinations: Command[] = [
    { label: 'Resources', keys: ['Alt', '1'], run: () => { window.location.hash = '/resources'; } },
    { label: 'Practice', keys: ['Alt', '2'], run: () => { window.location.hash = '/practice'; } },
  ];

  function viewPractice(resourceId: string) {
    setAllFilters(current => ({ ...current, practice: { ...emptyFilters(), resource: resourceId } }));
    setTableViews(current => ({ ...current, practice: { ...current.practice, filters: {} } }));
    window.location.hash = '/practice'; setPage('practice'); setModal(null);
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    <header className="topbar">
      <a href="#/resources" className="brand" aria-label="Kian Academy home"><svg className="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 7v18M24 7 12 18m5-5 8 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg><span>Kian<span className="brand-secondary"> Academy</span></span></a>
      <nav aria-label="Main navigation" className="main-nav"><a href="#/resources" aria-current={isResources ? 'page' : undefined}><Library size={17} /><span>Resources</span></a><a href="#/practice" aria-current={!isResources ? 'page' : undefined}><NotebookPen size={17} /><span>Practice</span>{library.practice.length > 0 && <span className="nav-count">{library.practice.length}</span>}</a></nav>
      <div className="topbar-utilities"><button ref={launcherRef} type="button" className="search-launcher" title="Open search and commands" aria-label="Open search and commands" aria-keyshortcuts="Control+k Meta+k Control+Space" aria-haspopup="dialog" aria-expanded={modal?.type === 'commands'} onClick={() => setModal({ type: 'commands', mode: 'commands' })}><Search size={15} aria-hidden="true" focusable="false" /></button><button type="button" className="icon-button theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><span className="utility-divider" /><a className="source-button" aria-label="View source" href={repositoryUrl} target="_blank" rel="noopener noreferrer"><Github size={16} /><span>View source</span><ArrowUpRight size={13} /></a></div>
    </header>
    <main id="main-content" className={`${page}-page`} tabIndex={-1}>
      <h1 className="sr-only">{isResources ? 'Learning resources' : 'Practice'}</h1>
      <div className="collection-navigation">
        <div className="collection-tabs" role="group" aria-label={isResources ? 'Resource status filters' : 'Practice status filters'}>{statuses.map(([key, label]) => <button key={key} type="button" aria-pressed={filters.status === key} className={filters.status === key ? 'active' : ''} onClick={() => updateFilters({ status: key })}>{label}<span>{counts[key]}</span></button>)}</div>
        <button type="button" className="button quiet help-button" aria-haspopup="dialog" aria-expanded={modal?.type === 'info'} onClick={() => setModal({ type: 'info' })}><CircleHelp size={16} aria-hidden="true" focusable="false" />Help</button>
      </div>
      <CollectionTable<LearningItem> key={page} label={isResources ? 'Resources' : 'Practice'} columns={isResources ? resourceColumns : practiceDefinition} defaults={isResources ? defaultResourceColumns : defaultPracticeColumns} rows={candidates} allRows={collection} model={model} rowLabel={item => item.title} view={tableViews[page]} onViewChange={updateTable} onColumnFilter={updateColumnFilter} onResetFilters={clearFilters} hasFilters={hasFilters}
        onOpen={item => setModal({ type: 'creator' in item ? 'resource' : 'practice', id: item.id })}
        renderCell={(item, column) => renderCollectionCell(item, column, library, viewPractice, id => setModal({ type: 'resource', id }))}
        emptyTitle={isResources ? 'No resources published yet' : 'No practice published yet'} emptyDescription={isResources ? 'Books, playlists, and courses will appear here.' : 'Published essays, videos, and projects will appear here.'}
        toolbar={<>
          <div className="search-field"><Search size={16} aria-hidden="true" /><input ref={searchRef} type="search" aria-label={isResources ? 'Search resources' : 'Search practice'} placeholder={isResources ? 'Search resources…' : 'Search published work…'} value={filters.search} onChange={event => updateFilters({ search: event.target.value })} />{filters.search && <button type="button" className="clear-search" aria-label="Clear search" onClick={() => { updateFilters({ search: '' }); searchRef.current?.focus(); }}><X size={13} aria-hidden="true" /></button>}</div>

        </>}
        quickFilterCount={['subject', 'format', 'tier', 'resource'].filter(key => filters[key as keyof Filters] !== 'all').length}
        quickFilters={showAll => <>
          {(showAll || filters.subject !== 'all') && <label>{isResources ? 'Subjects' : 'Subject'}<Select label={isResources ? 'Filter by subjects' : 'Filter by subject'} mode="list-only" value={filters.subject} onChange={subject => updateFilters({ subject })} options={[{ value: 'all', label: 'All subjects' }, ...subjectOptions.map(value => ({ value, label: value }))]} /></label>}
          {(showAll || filters.format !== 'all') && <label>Format<Select label="Filter by format" mode="list-only" value={filters.format} onChange={format => updateFilters({ format })} options={[{ value: 'all', label: 'All formats' }, ...(isResources ? resourceFormats : practiceFormats).map(value => ({ value, label: value }))]} /></label>}
          {isResources && (showAll || filters.tier !== 'all') && <label>Tier<Select label="Filter by tier" mode="list-only" value={filters.tier} onChange={tier => updateFilters({ tier })} options={[{ value: 'all', label: 'All tiers' }, ...resourceTiers.map(tier => ({ value: String(tier.value), label: `Tier ${tier.value}` }))]} /></label>}
          {!isResources && library.practice.length > 0 && (showAll || filters.resource !== 'all') && <label>Related resource<Select label="Filter by resource" mode="list-only" value={filters.resource} onChange={resource => updateFilters({ resource })} className="resource-filter" options={[{ value: 'all', label: 'All resources' }, { value: 'independent', label: 'Independent practice' }, ...library.resources.map(resource => ({ value: resource.id, label: resource.title }))]} /></label>}
        </>}
        notice={filters.resource !== 'all' && !isResources && <div className="active-filter"><span>Related to <strong>{filters.resource === 'independent' ? 'Independent practice' : resourceById.get(filters.resource)?.title}</strong></span><button type="button" className="icon-button" aria-label="Clear resource filter" onClick={() => updateFilters({ resource: 'all' })}><X size={14} /></button></div>} />
    </main>
    {modal?.type === 'commands' && <Commands key={modal.mode} commands={commands} destinations={destinations} initialMode={modal.mode} onClose={() => setModal(null)} returnFocus={launcherRef.current} />}
    {modal?.type === 'shortcuts' && <KeyboardShortcuts onClose={() => setModal(null)} returnFocus={launcherRef.current} />}
    {modal?.type === 'info' && <CollectionInfo collection={page} onClose={() => setModal(null)} />}
    {modal?.type === 'resource' && selectedResource && <ResourceDetails key={selectedResource.id} resource={selectedResource} practice={library.practice.filter(item => item.resourceId === selectedResource.id)} onPractice={id => setModal({ type: 'practice', id })} onClose={() => setModal(null)} />}
    {modal?.type === 'practice' && selectedPractice && <PracticeDetails key={selectedPractice.id} practice={selectedPractice} resource={selectedPractice.resourceId ? resourceById.get(selectedPractice.resourceId) : undefined} onResource={() => selectedPractice.resourceId && setModal({ type: 'resource', id: selectedPractice.resourceId })} onClose={() => setModal(null)} />}
  </div>;
}
