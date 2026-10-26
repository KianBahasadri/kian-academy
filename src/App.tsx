import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownAZ, ArrowUpRight, BookOpen, ChevronRight, Github, Info, Library, Moon, NotebookPen, Search, Sun, X } from 'lucide-react';
import { practiceFormats, resourceFormats, resourceTiers, safeUrl, wordCount } from './model';
import { library, repositoryUrl } from './library';
import { FormatIcon, ResourceMark, Select, Status, Tier } from './components/ui';
import { PracticeDetails, ResourceDetails } from './components/Details';
import { CollectionInfo } from './components/CollectionInfo';
import { Commands, KeyboardShortcuts } from './components/Commands';
import type { Command, CommandMode } from './components/Commands';

type Page = 'resources' | 'practice';
type Filters = { search: string; status: string; subject: string; format: string; tier: string; resource: string; sort: string };
type Modal = { type: 'resource' | 'practice'; id: string } | { type: 'info' | 'shortcuts' } | { type: 'commands'; mode: CommandMode } | null;
const emptyFilters = (): Filters => ({ search: '', status: 'all', subject: 'all', format: 'all', tier: 'all', resource: 'all', sort: 'recent' });
const currentPage = (): Page => window.location.hash.startsWith('#/practice') ? 'practice' : 'resources';
const readableDate = (date: string) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function App() {
  const [page, setPage] = useState<Page>(currentPage);
  const [allFilters, setAllFilters] = useState<Record<Page, Filters>>({ resources: emptyFilters(), practice: emptyFilters() });
  const [modal, setModal] = useState<Modal>(null);
  const [theme, setTheme] = useState('dark');
  const searchRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const filters = allFilters[page];
  const isResources = page === 'resources';
  const infoLabel = isResources ? 'About learning resources' : 'About practice';
  const updateFilters = (patch: Partial<Filters>) => setAllFilters(current => ({ ...current, [page]: { ...current[page], ...patch } }));
  const clearFilters = () => setAllFilters(current => ({ ...current, [page]: emptyFilters() }));

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
  const subjectOptions = [...new Set(collection.map(item => item.subject))].sort();
  const counts = Object.fromEntries(['all', 'planned', 'learning', 'completed', 'draft', 'finished'].map(status => [status, status === 'all' ? collection.length : collection.filter(item => item.status === status).length]));
  const resourceById = useMemo(() => new Map(library.resources.map(resource => [resource.id, resource])), []);
  const practiceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of library.practice) if (item.resourceId) counts.set(item.resourceId, (counts.get(item.resourceId) ?? 0) + 1);
    return counts;
  }, []);
  const visible = collection.filter(item => {
    const related = 'resourceId' in item && item.resourceId ? resourceById.get(item.resourceId)?.title ?? '' : '';
    const searchable = [item.title, item.subject, item.format, related, 'creator' in item ? item.creator : item.content, 'notes' in item ? item.notes : '', 'description' in item ? item.description : ''].join(' ').toLocaleLowerCase();
    return searchable.includes(filters.search.trim().toLocaleLowerCase()) &&
      (filters.status === 'all' || item.status === filters.status) && (filters.subject === 'all' || item.subject === filters.subject) &&
      (filters.format === 'all' || item.format === filters.format) && (!isResources || filters.tier === 'all' || ('tier' in item && item.tier === Number(filters.tier))) &&
      (isResources || filters.resource === 'all' || ('resourceId' in item && (filters.resource === 'independent' ? !item.resourceId : item.resourceId === filters.resource)));
  }).sort((a, b) => filters.sort === 'title' ? a.title.localeCompare(b.title) : filters.sort === 'tier' && 'tier' in a && 'tier' in b ? a.tier - b.tier || a.title.localeCompare(b.title) : filters.sort === 'progress' && 'progress' in a && 'progress' in b ? b.progress - a.progress : b.updatedAt.localeCompare(a.updatedAt));
  const hasFilters = filters.search !== '' || filters.status !== 'all' || filters.subject !== 'all' || filters.format !== 'all' || filters.tier !== 'all' || filters.resource !== 'all';
  const selectedResource = modal && 'id' in modal ? resourceById.get(modal.id) : undefined;
  const selectedPractice = modal && 'id' in modal ? library.practice.find(item => item.id === modal.id) : undefined;
  const statuses = isResources ? [['all', 'All resources'], ['learning', 'In progress'], ['planned', 'To learn'], ['completed', 'Completed']] : [['all', 'All practice'], ['draft', 'Drafts'], ['finished', 'Finished']];
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
    window.location.hash = '/practice'; setPage('practice'); setModal(null);
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    <header className="topbar">
      <a href="#/resources" className="brand" aria-label="Kian Academy home"><svg className="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 7v18M24 7 12 18m5-5 8 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg><span>Kian<span className="brand-secondary"> Academy</span></span></a>
      <nav aria-label="Main navigation" className="main-nav"><a href="#/resources" aria-current={isResources ? 'page' : undefined}><Library size={17} /><span>Resources</span></a><a href="#/practice" aria-current={!isResources ? 'page' : undefined}><NotebookPen size={17} /><span>Practice</span>{library.practice.length > 0 && <span className="nav-count">{library.practice.length}</span>}</a></nav>
      <div className="topbar-utilities"><button ref={launcherRef} type="button" className="search-launcher" title="Open search and commands" aria-label="Open search and commands" aria-keyshortcuts="Control+k Meta+k Control+Space" aria-haspopup="dialog" aria-expanded={modal?.type === 'commands'} onClick={() => setModal({ type: 'commands', mode: 'commands' })}><Search size={15} aria-hidden="true" focusable="false" /></button><button type="button" className="icon-button theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><span className="utility-divider" /><a className="source-button" aria-label="View source" href={repositoryUrl} target="_blank" rel="noopener noreferrer"><Github size={16} /><span>View source</span><ArrowUpRight size={13} /></a></div>
    </header>
    <main id="main-content" tabIndex={-1}>
      <div className="page-heading"><div><div className="heading-title"><h1>{isResources ? 'Learning resources' : 'Practice'}</h1><button type="button" className="icon-button heading-info" aria-label={infoLabel} title={infoLabel} aria-haspopup="dialog" onClick={() => setModal({ type: 'info' })}><Info size={18} aria-hidden="true" focusable="false" /></button></div></div></div>
      <div className="collection-tabs" role="group" aria-label={isResources ? 'Resource status filters' : 'Practice status filters'}>{statuses.map(([key, label]) => <button key={key} type="button" aria-pressed={filters.status === key} className={filters.status === key ? 'active' : ''} onClick={() => updateFilters({ status: key })}>{label}<span>{counts[key]}</span></button>)}</div>
      <div className="toolbar"><div className="search-field"><Search size={16} /><input ref={searchRef} type="search" aria-label={isResources ? 'Search resources' : 'Search practice'} placeholder={isResources ? 'Search resources…' : 'Search published work…'} value={filters.search} onChange={event => updateFilters({ search: event.target.value })} />{filters.search && <button type="button" className="clear-search" aria-label="Clear search" onClick={() => { updateFilters({ search: '' }); searchRef.current?.focus(); }}><X size={13} /></button>}</div>
        <Select label="Filter by subject" value={filters.subject} onChange={subject => updateFilters({ subject })}><option value="all">All subjects</option>{subjectOptions.map(subject => <option key={subject}>{subject}</option>)}</Select>
        <Select label="Filter by format" value={filters.format} onChange={format => updateFilters({ format })}><option value="all">All formats</option>{(isResources ? resourceFormats : practiceFormats).map(format => <option key={format}>{format}</option>)}</Select>
        {isResources && <Select label="Filter by tier" value={filters.tier} onChange={tier => updateFilters({ tier })} className="tier-filter"><option value="all">All tiers</option>{resourceTiers.map(tier => <option key={tier.value} value={tier.value}>{tier.value} · {tier.name}</option>)}</Select>}
        {!isResources && library.practice.length > 0 && <Select label="Filter by resource" value={filters.resource} onChange={resource => updateFilters({ resource })} className="resource-filter"><option value="all">All resources</option><option value="independent">Independent practice</option>{library.resources.map(resource => <option value={resource.id} key={resource.id}>{resource.title}</option>)}</Select>}
        {hasFilters && <button type="button" className="button quiet small-button reset-filters" onClick={clearFilters}><X size={13} />Clear</button>}
        <div className="toolbar-end"><span className="result-count" aria-live="polite">{visible.length} of {collection.length}</span><span className="sort-control"><ArrowDownAZ size={16} /><Select label="Sort collection" value={filters.sort} onChange={sort => updateFilters({ sort })}><option value="recent">Recently updated</option><option value="title">Title, A–Z</option>{isResources && <><option value="tier">Tier, 1–5</option><option value="progress">Progress</option></>}</Select></span></div>
      </div>
      {filters.resource !== 'all' && !isResources && <div className="active-filter"><span>Related to <strong>{filters.resource === 'independent' ? 'Independent practice' : resourceById.get(filters.resource)?.title}</strong></span><button type="button" className="icon-button" aria-label="Clear resource filter" onClick={() => updateFilters({ resource: 'all' })}><X size={14} /></button></div>}
      {visible.length > 0 ? <div className="table-scroll"><table className={`collection-table ${isResources ? 'resources-table' : 'practice-table'}`}><caption className="sr-only">{isResources ? 'Published learning resources. Select a title to read notes and see related work.' : 'Published practice. Select a title to read the work or open its link.'}</caption><thead><tr><th scope="col" className="identity-heading"><button type="button" className="sort-heading" onClick={() => updateFilters({ sort: filters.sort === 'title' ? 'recent' : 'title' })}>{isResources ? 'Resource' : 'Work'}{filters.sort === 'title' && <ArrowDownAZ size={13} />}</button></th><th scope="col">Format</th><th scope="col">Subject</th>{isResources && <th scope="col">Tier</th>}<th scope="col">{isResources ? 'Progress' : 'Status'}</th><th scope="col">{isResources ? 'Practice' : 'Related resource'}</th>{!isResources && <th scope="col">Updated</th>}<th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(item => 'creator' in item ? <tr key={item.id} onClick={event => { if (!(event.target as HTMLElement).closest('a,button')) setModal({ type: 'resource', id: item.id }); }}>
        <td className="identity-cell"><button type="button" className="item-title" onClick={() => setModal({ type: 'resource', id: item.id })}><ResourceMark format={item.format} subject={item.subject} /><span className="item-identity"><span>{item.title}</span><small>{item.creator || item.subject}</small></span></button></td><td><span className="format-label"><FormatIcon format={item.format} size={14} />{item.format}</span></td><td className="subject-cell">{item.subject}</td><td className="tier-cell"><Tier value={item.tier} /></td><td className="progress-cell">{item.status === 'planned' ? <span className="not-started"><span className="status-dot" />Not started</span> : <div className={`table-progress ${item.status === 'completed' ? 'complete' : ''}`}><div><Status value={item.status} /><span className="mono">{item.progress}%</span></div><progress aria-label={`${item.title} progress`} value={item.progress} max={100} /></div>}</td><td className="resource-practice-cell">{practiceCounts.get(item.id) ? <button type="button" className="practice-count has-practice" aria-label={`View practice for ${item.title}`} onClick={() => viewPractice(item.id)}><NotebookPen size={14} /><span>{practiceCounts.get(item.id)}</span></button> : <span className="muted">—</span>}</td><td className="row-actions">{safeUrl(item.url) && <a className="icon-button row-external" href={safeUrl(item.url)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.title} website`} title="Open resource website"><ArrowUpRight size={16} /></a>}<button type="button" className="icon-button" aria-label={`Details for ${item.title}`} onClick={() => setModal({ type: 'resource', id: item.id })}><ChevronRight size={16} /></button></td>
      </tr> : <tr key={item.id} onClick={event => { if (!(event.target as HTMLElement).closest('a,button')) setModal({ type: 'practice', id: item.id }); }}><td className="identity-cell"><button type="button" className="item-title" onClick={() => setModal({ type: 'practice', id: item.id })}><ResourceMark format={item.format} subject={item.subject} /><span className="item-identity"><span>{item.title}</span><small>{wordCount(item.content) ? `${wordCount(item.content).toLocaleString()} words` : item.url ? 'Linked work' : 'Draft'}</small></span></button></td><td><span className="format-label"><FormatIcon format={item.format} size={14} />{item.format}</span></td><td className="subject-cell">{item.subject}</td><td><Status value={item.status} /></td><td className="related-cell">{item.resourceId ? <button type="button" className="table-resource-link" onClick={() => setModal({ type: 'resource', id: item.resourceId! })}>{resourceById.get(item.resourceId)!.title}</button> : <span className="muted">Independent</span>}</td><td className="date-cell"><time dateTime={item.updatedAt} title={new Date(item.updatedAt).toLocaleString()}>{readableDate(item.updatedAt)}</time></td><td className="row-actions"><button type="button" className="icon-button" aria-label={`Details for ${item.title}`} onClick={() => setModal({ type: 'practice', id: item.id })}><ChevronRight size={16} /></button></td></tr>)}</tbody></table></div> : <div className="empty-state">{hasFilters ? <Search size={31} strokeWidth={1.2} /> : isResources ? <BookOpen size={36} strokeWidth={1.2} /> : <NotebookPen size={36} strokeWidth={1.2} />}<h2>{hasFilters ? 'No matches here' : isResources ? 'No resources published yet' : 'No practice published yet'}</h2><p>{hasFilters ? 'Try another search or clear your filters.' : isResources ? 'Books, playlists, and courses will appear here.' : 'Published essays, videos, and projects will appear here.'}</p>{hasFilters && <button type="button" className="button secondary" onClick={clearFilters}><X size={14} />Clear filters</button>}</div>}
    </main>
    {modal?.type === 'commands' && <Commands key={modal.mode} commands={commands} destinations={destinations} initialMode={modal.mode} onClose={() => setModal(null)} returnFocus={launcherRef.current} />}
    {modal?.type === 'shortcuts' && <KeyboardShortcuts onClose={() => setModal(null)} returnFocus={launcherRef.current} />}
    {modal?.type === 'info' && <CollectionInfo collection={page} onClose={() => setModal(null)} />}
    {modal?.type === 'resource' && selectedResource && <ResourceDetails key={selectedResource.id} resource={selectedResource} practice={library.practice.filter(item => item.resourceId === selectedResource.id)} onPractice={id => setModal({ type: 'practice', id })} onClose={() => setModal(null)} />}
    {modal?.type === 'practice' && selectedPractice && <PracticeDetails key={selectedPractice.id} practice={selectedPractice} resource={selectedPractice.resourceId ? resourceById.get(selectedPractice.resourceId) : undefined} onResource={() => selectedPractice.resourceId && setModal({ type: 'resource', id: selectedPractice.resourceId })} onClose={() => setModal(null)} />}
  </div>;
}
