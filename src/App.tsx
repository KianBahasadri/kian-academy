import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownAZ, ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp, Cloud, HardDrive, Library, Moon, NotebookPen, Plus, Search, Sun, X } from 'lucide-react';
import type { Library as LibraryData, Practice, Resource } from './model';
import { practiceFormats, resourceFormats, safeUrl, wordCount } from './model';
import { useLibrary } from './useLibrary';
import { FormatIcon, ResourceMark, Select, Status } from './components/ui';
import ResourceForm from './components/ResourceForm';
import PracticeForm from './components/PracticeForm';
import { PracticeDetails, ResourceDetails } from './components/Details';
import LibrarySettings from './components/LibrarySettings';
import { useAcademyAuth } from './auth';

type Page = 'resources' | 'practice';
type Filters = { search: string; status: string; subject: string; format: string; resource: string; sort: string };
type Modal = { type: 'resource'; id: string } | { type: 'practice'; id: string } | { type: 'resource-form'; id?: string } | { type: 'practice-form'; id?: string; resourceId?: string } | { type: 'settings' } | null;
type Notice = { message: string; undo?: () => void } | null;

const emptyFilters = (): Filters => ({ search: '', status: 'all', subject: 'all', format: 'all', resource: 'all', sort: 'recent' });
const currentPage = (): Page => window.location.hash.startsWith('#/practice') ? 'practice' : 'resources';
const readableDate = (date: string) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function App() {
  const auth = useAcademyAuth();
  return <AcademySession key={!auth.loaded ? 'loading' : auth.userId ?? 'device'} />;
}

function AcademySession() {
  const auth = useAcademyAuth();
  const { library, commit, error, corrupt, backup, restore, deviceLibrary, cloud, busy, saving, dirty, conflict, retry, reloadSaved, flush } = useLibrary();
  const [page, setPage] = useState<Page>(currentPage);
  const [allFilters, setAllFilters] = useState<Record<Page, Filters>>({ resources: emptyFilters(), practice: emptyFilters() });
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'dark');
  const searchRef = useRef<HTMLInputElement>(null);
  const filters = allFilters[page];
  const isResources = page === 'resources';
  const updateFilters = (patch: Partial<Filters>) => setAllFilters(current => ({ ...current, [page]: { ...current[page], ...patch } }));
  const clearFilters = () => setAllFilters(current => ({ ...current, [page]: emptyFilters() }));
  const add = () => { if (!corrupt && !busy) setModal({ type: isResources ? 'resource-form' : 'practice-form' }); };

  useEffect(() => {
    const sync = () => { setPage(currentPage()); setModal(null); };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => { document.title = `Kian Academy · ${isResources ? 'Resources' : 'Practice'}`; }, [isResources]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#080b0d' : '#ecefec');
    try { localStorage.setItem('kian-academy:theme', theme); } catch { /* Theme remains usable without storage. */ }
  }, [theme]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), notice.undo ? 10000 : 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    function shortcuts(event: KeyboardEvent) {
      if (modal || event.defaultPrevented) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); searchRef.current?.focus(); return;
      }
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); add(); }
    }
    window.addEventListener('keydown', shortcuts);
    return () => window.removeEventListener('keydown', shortcuts);
  });

  const collection = isResources ? library.resources : library.practice;
  const subjectOptions = [...new Set(collection.map(item => item.subject))].sort();
  const counts = Object.fromEntries(['all', 'planned', 'learning', 'completed', 'draft', 'finished'].map(status => [status, status === 'all' ? collection.length : collection.filter(item => item.status === status).length]));
  const resourceById = useMemo(() => new Map(library.resources.map(resource => [resource.id, resource])), [library.resources]);
  const practiceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of library.practice) if (item.resourceId) counts.set(item.resourceId, (counts.get(item.resourceId) ?? 0) + 1);
    return counts;
  }, [library.practice]);
  const visible = collection.filter(item => {
    const relatedResource = 'resourceId' in item && item.resourceId ? resourceById.get(item.resourceId)?.title ?? '' : '';
    const searchable = [item.title, item.subject, item.format, relatedResource, 'creator' in item ? item.creator : item.content, 'notes' in item ? item.notes : '', 'description' in item ? item.description : ''].join(' ').toLocaleLowerCase();
    return searchable.includes(filters.search.trim().toLocaleLowerCase()) &&
      (filters.status === 'all' || item.status === filters.status) &&
      (filters.subject === 'all' || item.subject === filters.subject) &&
      (filters.format === 'all' || item.format === filters.format) &&
      (isResources || filters.resource === 'all' || ('resourceId' in item && (filters.resource === 'independent' ? !item.resourceId : item.resourceId === filters.resource)));
  }).sort((a, b) => filters.sort === 'title' ? a.title.localeCompare(b.title) : filters.sort === 'progress' && 'progress' in a && 'progress' in b ? b.progress - a.progress : b.updatedAt.localeCompare(a.updatedAt));
  const hasFilters = filters.search !== '' || filters.status !== 'all' || filters.subject !== 'all' || filters.format !== 'all' || filters.resource !== 'all';

  function updateResource(resource: Resource) {
    commit(current => ({ ...current, resources: current.resources.map(item => item.id === resource.id ? { ...resource, updatedAt: new Date().toISOString() } : item) }));
  }

  function saveResource(resource: Resource) {
    const exists = library.resources.some(item => item.id === resource.id);
    if (commit(current => ({ ...current, resources: exists ? current.resources.map(item => item.id === resource.id ? { ...resource, progress: item.progress, status: item.status, notes: item.notes } : item) : [resource, ...current.resources] }))) {
      clearFilters();
      setModal({ type: 'resource', id: resource.id });
      setNotice({ message: exists ? 'Resource updated' : 'Resource added to your library' });
    }
  }

  function savePractice(practice: Practice) {
    const exists = library.practice.some(item => item.id === practice.id);
    if (commit(current => ({ ...current, practice: exists ? current.practice.map(item => item.id === practice.id ? { ...practice, updatedAt: new Date().toISOString() } : item) : [practice, ...current.practice] }))) {
      setAllFilters(current => ({ ...current, practice: emptyFilters() }));
      setModal({ type: 'practice', id: practice.id });
      setNotice({ message: exists ? 'Practice updated' : 'Practice added to your library' });
    }
  }

  function removeResource(resource: Resource) {
    const related = library.practice.filter(item => item.resourceId === resource.id).map(item => item.id);
    if (commit(current => ({ ...current, resources: current.resources.filter(item => item.id !== resource.id), practice: current.practice.map(item => item.resourceId === resource.id ? { ...item, resourceId: null } : item) }))) {
      setModal(null);
      setAllFilters(current => ({ ...current, practice: { ...current.practice, resource: current.practice.resource === resource.id ? 'all' : current.practice.resource } }));
      setNotice({ message: 'Resource removed. Your practice is kept.', undo: () => commit(current => ({ ...current, resources: [resource, ...current.resources.filter(item => item.id !== resource.id)], practice: current.practice.map(item => related.includes(item.id) && !item.resourceId ? { ...item, resourceId: resource.id } : item) })) });
    }
  }

  function removePractice(practice: Practice) {
    if (commit(current => ({ ...current, practice: current.practice.filter(item => item.id !== practice.id) }))) {
      setModal(null);
      setNotice({ message: 'Practice removed', undo: () => commit(current => ({ ...current, practice: [{ ...practice, resourceId: current.resources.some(resource => resource.id === practice.resourceId) ? practice.resourceId : null }, ...current.practice.filter(item => item.id !== practice.id)] })) });
    }
  }

  function viewPractice(resource: Resource) {
    setAllFilters(current => ({ ...current, practice: { ...emptyFilters(), resource: resource.id } }));
    window.location.hash = '/practice';
    setPage('practice');
    setModal(null);
  }

  async function restoreLibrary(data: LibraryData) {
    if (await restore(data) === false) return;
    setAllFilters({ resources: emptyFilters(), practice: emptyFilters() });
    setModal(null);
    setNotice({ message: 'Library restored from backup' });
  }

  async function signOut() {
    if (!dirty || await flush()) await auth.signOut();
  }

  const selectedResource = modal && 'id' in modal && modal.id ? resourceById.get(modal.id) : undefined;
  const selectedPractice = modal && 'id' in modal ? library.practice.find(item => item.id === modal.id) : undefined;
  const statuses = isResources ? [['all', 'All resources'], ['learning', 'In progress'], ['planned', 'To learn'], ['completed', 'Completed']] : [['all', 'All practice'], ['draft', 'Drafts'], ['finished', 'Finished']];

  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    <header className="topbar">
      <a href="#/resources" className="brand" aria-label="Kian Academy home"><svg className="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 7v18M24 7 12 18m5-5 8 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg><span>Kian<span className="brand-secondary"> Academy</span></span></a>
      <nav aria-label="Main navigation" className="main-nav"><a href="#/resources" aria-current={isResources ? 'page' : undefined}><Library size={17} /><span>Resources</span></a><a href="#/practice" aria-current={!isResources ? 'page' : undefined}><NotebookPen size={17} /><span>Practice</span>{library.practice.length > 0 && <span className="nav-count">{library.practice.length}</span>}</a></nav>
      <div className="topbar-utilities"><button type="button" className="icon-button" title="Search (Ctrl / ⌘ K)" aria-label="Search collection" onClick={() => searchRef.current?.focus()}><Search size={17} /></button><button type="button" className="icon-button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><span className="utility-divider" /><button type="button" className="device-button" aria-label={cloud ? 'Your account' : 'This device'} title="Library storage and backups" onClick={() => setModal({ type: 'settings' })}>{cloud ? <Cloud size={15} /> : <HardDrive size={15} />}<span>{cloud ? auth.name || 'Your account' : 'This device'}</span><ChevronRight size={13} /></button>{auth.configured && !cloud && <button type="button" className="button secondary sign-in-button" disabled={!auth.loaded} onClick={auth.signIn}>Sign in</button>}</div>
    </header>

    <main id="main-content" tabIndex={-1}>
      {error && <div className="storage-error" role="alert"><p>{error}</p><button type="button" className="button secondary small-button" onClick={backup}>Download backup</button>{cloud ? <><button type="button" className="button secondary small-button" disabled={saving || busy} onClick={() => void retry()}>Try again</button>{conflict && <button type="button" className="button secondary small-button" onClick={() => { if (window.confirm('Load the saved version and discard your unsaved changes? Download a backup first to keep them.')) void reloadSaved(); }}>Load saved version</button>}</> : corrupt && <button type="button" className="button secondary small-button" onClick={() => setModal({ type: 'settings' })}>Restore a backup</button>}</div>}
      <div className="page-heading"><div><div className="heading-title"><h1>{isResources ? 'Learning resources' : 'Practice'}</h1><span className="count">{collection.length}</span></div><p>{isResources ? 'Keep what you’re learning in one place.' : 'The things you create from what you learn.'}</p></div><button type="button" className="button primary add-button" onClick={add} disabled={corrupt || busy}><Plus size={16} />{isResources ? 'Add resource' : 'Create practice'}</button></div>

      <div className="collection-tabs" role="group" aria-label={isResources ? 'Resource status filters' : 'Practice status filters'}>{statuses.map(([key, label]) => <button key={key} type="button" aria-pressed={filters.status === key} className={filters.status === key ? 'active' : ''} onClick={() => updateFilters({ status: key })}>{label}<span>{counts[key]}</span></button>)}</div>

      <div className="toolbar"><div className="search-field"><Search size={16} /><input ref={searchRef} type="search" aria-label={isResources ? 'Search resources' : 'Search practice'} placeholder={isResources ? 'Search resources…' : 'Search your practice…'} value={filters.search} onChange={event => updateFilters({ search: event.target.value })} />{filters.search ? <button type="button" className="clear-search" aria-label="Clear search" onClick={() => { updateFilters({ search: '' }); searchRef.current?.focus(); }}><X size={13} /></button> : <kbd>/</kbd>}</div>
        <Select label="Filter by subject" value={filters.subject} onChange={subject => updateFilters({ subject })}><option value="all">All subjects</option>{subjectOptions.map(subject => <option key={subject}>{subject}</option>)}</Select>
        <Select label="Filter by format" value={filters.format} onChange={format => updateFilters({ format })}><option value="all">All formats</option>{(isResources ? resourceFormats : practiceFormats).map(format => <option key={format}>{format}</option>)}</Select>
        {!isResources && library.practice.length > 0 && <Select label="Filter by resource" value={filters.resource} onChange={resource => updateFilters({ resource })} className="resource-filter"><option value="all">All resources</option><option value="independent">Independent practice</option>{library.resources.map(resource => <option value={resource.id} key={resource.id}>{resource.title}</option>)}</Select>}
        {hasFilters && <button type="button" className="button quiet small-button reset-filters" onClick={clearFilters}><X size={13} />Clear</button>}
        <div className="toolbar-end"><span className="result-count" aria-live="polite">{visible.length} of {collection.length}</span><span className="sort-control"><ArrowDownAZ size={16} /><Select label="Sort collection" value={filters.sort} onChange={sort => updateFilters({ sort })}><option value="recent">Recently updated</option><option value="title">Title, A–Z</option>{isResources && <option value="progress">Progress</option>}</Select></span></div>
      </div>

      {filters.resource !== 'all' && !isResources && <div className="active-filter"><span>Related to <strong>{filters.resource === 'independent' ? 'Independent practice' : resourceById.get(filters.resource)?.title ?? 'Removed resource'}</strong></span><button type="button" className="icon-button" aria-label="Clear resource filter" onClick={() => updateFilters({ resource: 'all' })}><X size={14} /></button></div>}

      {busy ? <div className="account-loading" role="status">Loading your library…</div> : visible.length > 0 ? <div className="table-scroll"><table className={`collection-table ${isResources ? 'resources-table' : 'practice-table'}`}><caption className="sr-only">{isResources ? 'Your learning resources. Select a title to view details, update progress, and create practice.' : 'Your practice. Select a title to read or edit your work.'}</caption><thead><tr><th scope="col" className="identity-heading"><button type="button" className="sort-heading" onClick={() => updateFilters({ sort: filters.sort === 'title' ? 'recent' : 'title' })}>{isResources ? 'Resource' : 'Your work'}{filters.sort === 'title' && <ArrowDownAZ size={13} />}</button></th><th scope="col">Format</th><th scope="col">Subject</th><th scope="col">{isResources ? 'Progress' : 'Status'}</th><th scope="col">{isResources ? 'Practice' : 'Related resource'}</th>{!isResources && <th scope="col">Updated</th>}<th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(item => 'creator' in item ? <tr key={item.id} onClick={event => { if (!(event.target as HTMLElement).closest('a,button')) setModal({ type: 'resource', id: item.id }); }}>
        <td className="identity-cell"><button type="button" className="item-title" onClick={() => setModal({ type: 'resource', id: item.id })}><ResourceMark format={item.format} subject={item.subject} /><span className="item-identity"><span>{item.title}</span><small>{item.creator || item.subject}</small></span></button></td><td><span className="format-label"><FormatIcon format={item.format} size={14} />{item.format}</span></td><td className="subject-cell">{item.subject}</td><td className="progress-cell">{item.status === 'planned' ? <span className="not-started"><span className="status-dot" />Not started</span> : <div className={`table-progress ${item.status === 'completed' ? 'complete' : ''}`}><div>{item.status === 'completed' ? <><Check size={13} /><span>Completed</span></> : <><span>In progress</span><span className="mono">{item.progress}%</span></>}</div><progress aria-label={`${item.title} progress`} value={item.progress} max={100} /></div>}</td><td><button type="button" className={`practice-count${practiceCounts.get(item.id) ? ' has-practice' : ''}`} aria-label={practiceCounts.get(item.id) ? `View practice for ${item.title}` : `Create practice for ${item.title}`} onClick={() => practiceCounts.get(item.id) ? viewPractice(item) : setModal({ type: 'practice-form', resourceId: item.id })}>{practiceCounts.get(item.id) ? <><NotebookPen size={14} /><span>{practiceCounts.get(item.id)}</span></> : <><Plus size={13} /><span className="add-practice-label">Create</span></>}</button></td><td className="row-actions">{safeUrl(item.url) && <a className="icon-button row-external" href={safeUrl(item.url)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.title} website`} title="Open resource website"><ArrowUpRight size={16} /></a>}<button type="button" className="icon-button" aria-label={`Details for ${item.title}`} onClick={() => setModal({ type: 'resource', id: item.id })}><ChevronRight size={16} /></button></td>
      </tr> : <tr key={item.id} onClick={event => { if (!(event.target as HTMLElement).closest('a,button')) setModal({ type: 'practice', id: item.id }); }}><td className="identity-cell"><button type="button" className="item-title" onClick={() => setModal({ type: 'practice', id: item.id })}><ResourceMark format={item.format} subject={item.subject} /><span className="item-identity"><span>{item.title}</span><small>{wordCount(item.content) ? `${wordCount(item.content).toLocaleString()} words` : item.url ? 'Linked work' : 'New draft'}</small></span></button></td><td><span className="format-label"><FormatIcon format={item.format} size={14} />{item.format}</span></td><td className="subject-cell">{item.subject}</td><td><Status value={item.status} /></td><td className="related-cell">{item.resourceId && resourceById.has(item.resourceId) ? <button type="button" className="table-resource-link" onClick={() => setModal({ type: 'resource', id: item.resourceId! })}>{resourceById.get(item.resourceId)!.title}</button> : <span className="muted">Independent</span>}</td><td className="date-cell"><time dateTime={item.updatedAt} title={new Date(item.updatedAt).toLocaleString()}>{readableDate(item.updatedAt)}</time></td><td className="row-actions"><button type="button" className="icon-button" aria-label={`Details for ${item.title}`} onClick={() => setModal({ type: 'practice', id: item.id })}><ChevronRight size={16} /></button></td></tr>)}</tbody></table></div> : <div className="empty-state">{hasFilters ? <Search size={31} strokeWidth={1.2} /> : isResources ? <BookOpen size={36} strokeWidth={1.2} /> : <NotebookPen size={36} strokeWidth={1.2} />}<h2>{hasFilters ? 'No matches here' : isResources ? 'Your library starts here' : 'Make something with what you learn'}</h2><p>{hasFilters ? 'Try another search or clear your filters.' : isResources ? 'Add a book, playlist, or course you want to learn from.' : 'An essay in your own words. A video explaining an idea. A project that puts it to work.'}</p><button type="button" className="button secondary" onClick={hasFilters ? clearFilters : add} disabled={!hasFilters && (corrupt || busy)}>{hasFilters ? <><X size={14} />Clear filters</> : <><Plus size={15} />{isResources ? 'Add your first resource' : 'Create your first practice'}</>}</button>{!isResources && !hasFilters && <span className="empty-note">Your work can stand alone or connect to a resource.</span>}</div>}

      <div className="collection-footer"><span>{isResources ? 'Select a resource to track progress, add notes, or create practice.' : 'Write here or link to work you created elsewhere.'}</span><button type="button" onClick={() => setModal({ type: 'settings' })} className="text-button"><CircleHelp size={13} />Shortcuts</button></div>
    </main>
    <footer className="app-footer"><span>Kian Academy</span><button type="button" className="text-button save-status" onClick={() => setModal({ type: 'settings' })}><span className={`save-dot${error ? ' warning' : ''}`} />{busy ? 'Loading…' : error ? 'Changes need attention' : cloud ? saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved to your account' : 'Stored on this device'}</button></footer>

    {modal?.type === 'resource-form' && <ResourceForm key={modal.id ?? 'new-resource'} resource={selectedResource} onSave={saveResource} onClose={() => setModal(modal.id ? { type: 'resource', id: modal.id } : null)} />}
    {modal?.type === 'practice-form' && <PracticeForm key={modal.id ?? `new-practice-${modal.resourceId ?? ''}`} practice={selectedPractice} resources={library.resources} resourceId={modal.resourceId} onSave={savePractice} onClose={() => setModal(modal.id ? { type: 'practice', id: modal.id } : modal.resourceId ? { type: 'resource', id: modal.resourceId } : null)} />}
    {modal?.type === 'resource' && selectedResource && <ResourceDetails key={selectedResource.id} saveError={error} saveState={cloud ? saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved to account' : 'Autosaved'} resource={selectedResource} practice={library.practice.filter(item => item.resourceId === selectedResource.id)} onUpdate={updateResource} onEdit={() => setModal({ type: 'resource-form', id: selectedResource.id })} onCreatePractice={() => setModal({ type: 'practice-form', resourceId: selectedResource.id })} onPractice={id => setModal({ type: 'practice', id })} onRemove={() => removeResource(selectedResource)} onClose={() => setModal(null)} />}
    {modal?.type === 'practice' && selectedPractice && <PracticeDetails key={selectedPractice.id} saveError={error} practice={selectedPractice} resource={selectedPractice.resourceId ? resourceById.get(selectedPractice.resourceId) : undefined} onEdit={() => setModal({ type: 'practice-form', id: selectedPractice.id })} onResource={() => selectedPractice.resourceId && setModal({ type: 'resource', id: selectedPractice.resourceId })} onUpdate={savePractice} onRemove={() => removePractice(selectedPractice)} onClose={() => setModal(null)} />}
    {modal?.type === 'settings' && <LibrarySettings library={library} deviceLibrary={deviceLibrary} cloud={cloud} dirty={dirty} saving={saving || busy} error={error} onBackup={backup} onRestore={restoreLibrary} onClose={() => setModal(null)} onSignIn={auth.configured ? () => { setModal(null); setTimeout(auth.signIn, 0); } : undefined} onSignUp={auth.configured ? () => { setModal(null); setTimeout(auth.signUp, 0); } : undefined} onManageAccount={() => { setModal(null); setTimeout(auth.manageAccount, 0); }} onSignOut={() => void signOut()} onForceSignOut={() => void auth.signOut()} />}
    {notice && <div className="toast" role="status"><Check size={16} /><span>{notice.message}</span>{notice.undo && <button type="button" className="text-button" onClick={() => { notice.undo?.(); setNotice(null); }}>Undo</button>}<button type="button" className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={14} /></button></div>}
  </div>;
}
