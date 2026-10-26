import { useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, ExternalLink, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react';
import { resourceProgress, resourceStatus, safeUrl, sourceHost, wordCount } from '../model';
import type { Practice, Resource, ResourceStatus } from '../model';
import { Dialog, FormatIcon, ResourceMark, Status } from './ui';

const fullDate = (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

function RemoveConfirmation({ kind, related = 0, onCancel, onConfirm }: { kind: string; related?: number; onCancel: () => void; onConfirm: () => void }) {
  return <div className="remove-confirmation" role="alert"><strong>Remove this {kind}?</strong><p>{related ? 'Your related practice will stay in your library.' : 'You can undo this immediately after removing it.'}</p><div><button type="button" className="button secondary" onClick={onCancel}>Keep it</button><button type="button" className="button danger-button" onClick={onConfirm}>Remove {kind}</button></div></div>;
}

export function ResourceDetails({ saveError, saveState, resource, practice, onUpdate, onEdit, onCreatePractice, onPractice, onRemove, onClose }: { saveError: string; saveState: string; resource: Resource; practice: Practice[]; onUpdate: (resource: Resource) => void; onEdit: () => void; onCreatePractice: () => void; onPractice: (id: string) => void; onRemove: () => void; onClose: () => void }) {
  const [removing, setRemoving] = useState(false);
  return <Dialog title="Resource details" onClose={onClose} drawer>
    <div className="dialog-body detail-body">
      {saveError && <p className="detail-save-error" role="alert">{saveError}</p>}
      <div className="detail-identity"><ResourceMark format={resource.format} subject={resource.subject} large /><span className="eyebrow">{resource.format}<span>·</span>{resource.subject}</span></div>
      <h3 className="detail-title">{resource.title}</h3>
      {resource.creator && <p className="detail-creator">{resource.creator}</p>}
      {resource.description && <p className="detail-description">{resource.description}</p>}
      <div className="detail-actions">{safeUrl(resource.url) && <a className="button primary" href={safeUrl(resource.url)} target="_blank" rel="noopener noreferrer">Open resource<ArrowUpRight size={16} /></a>}<button type="button" className="button secondary" onClick={onEdit}><Pencil size={14} />Edit details</button></div>
      {resource.url && <span className="source-host"><ExternalLink size={12} />{sourceHost(resource.url)}</span>}

      <section className="detail-section">
        <div className="detail-section-heading"><h3>Your progress</h3><Status value={resource.status} /></div>
        <label className="field">Status<select aria-label="Resource status" value={resource.status} onChange={event => onUpdate(resourceStatus(resource, event.target.value as ResourceStatus))}><option value="planned">To learn</option><option value="learning">In progress</option><option value="completed">Completed</option></select></label>
        <div className="progress-editor"><label htmlFor="resource-progress">Progress<span className="mono">{resource.progress}%</span></label><input id="resource-progress" aria-label="Resource progress" type="range" min="0" max="100" step="5" value={resource.progress} onChange={event => onUpdate(resourceProgress(resource, Number(event.target.value)))} /><div className="progress-labels"><span>Not started</span><span>Complete</span></div></div>
        {resource.status !== 'completed' && <button type="button" className="button secondary small-button" onClick={() => onUpdate(resourceStatus(resource, resource.status === 'planned' ? 'learning' : 'completed'))}>{resource.status === 'planned' ? <><Plus size={14} />Start learning</> : <><Check size={14} />Mark completed</>}</button>}
      </section>

      <section className="detail-section"><div className="detail-section-heading"><h3>Your notes</h3><span className="subtle-label">{saveError ? saveState === 'Autosaved' ? 'Not saved to device' : 'Not saved to account' : saveState}</span></div><label className="sr-only" htmlFor="resource-notes">Your notes</label><textarea id="resource-notes" rows={4} placeholder="Where you left off, questions, ideas…" value={resource.notes} onChange={event => onUpdate({ ...resource, notes: event.target.value })} /></section>

      <section className="detail-section"><div className="detail-section-heading"><h3>Related practice <span className="count">{practice.length}</span></h3><button type="button" className="button quiet small-button" onClick={onCreatePractice}><Plus size={14} />Create</button></div>{practice.length ? <div className="related-list">{practice.map(item => <button key={item.id} type="button" onClick={() => onPractice(item.id)}><FormatIcon format={item.format} /><span>{item.title}<small>{item.format} · {item.status === 'draft' ? 'Draft' : 'Finished'}</small></span><ChevronRight size={15} /></button>)}</div> : <div className="related-empty"><NotebookPen size={23} strokeWidth={1.4} /><p>Put what you learn into your own words, a video, or a project.</p><button type="button" className="text-button" onClick={onCreatePractice}>Create your first practice<ChevronRight size={14} /></button></div>}</section>

      <div className="detail-bottom"><span>Added {fullDate(resource.createdAt)}</span><button type="button" className="icon-button delete-button" aria-label="Remove resource" title="Remove resource" onClick={() => setRemoving(true)}><Trash2 size={16} /></button></div>
      {removing && <RemoveConfirmation kind="resource" related={practice.length} onCancel={() => setRemoving(false)} onConfirm={onRemove} />}
    </div>
  </Dialog>;
}

export function PracticeDetails({ saveError, practice, resource, onEdit, onResource, onUpdate, onRemove, onClose }: { saveError: string; practice: Practice; resource?: Resource; onEdit: () => void; onResource: () => void; onUpdate: (practice: Practice) => void; onRemove: () => void; onClose: () => void }) {
  const [removing, setRemoving] = useState(false);
  return <Dialog title="Your practice" onClose={onClose} drawer>
    <div className="dialog-body detail-body">
      {saveError && <p className="detail-save-error" role="alert">{saveError}</p>}
      <div className="detail-identity"><ResourceMark format={practice.format} subject={practice.subject} large /><span className="eyebrow">{practice.format}<span>·</span>{practice.subject}</span></div>
      <h3 className="detail-title">{practice.title}</h3>
      <div className="practice-detail-meta"><Status value={practice.status} /><span>{wordCount(practice.content).toLocaleString()} words</span></div>
      <div className="detail-actions"><button type="button" className="button primary" onClick={onEdit}><Pencil size={15} />Edit practice</button>{safeUrl(practice.url) && <a className="button secondary" href={safeUrl(practice.url)} target="_blank" rel="noopener noreferrer">Open work<ArrowUpRight size={16} /></a>}</div>
      {resource && <section className="detail-section"><div className="detail-section-heading"><h3>Learning resource</h3></div><button type="button" className="resource-link" onClick={onResource}><FormatIcon format={resource.format} /><span>{resource.title}<small>{resource.creator}</small></span><ChevronRight size={16} /></button></section>}
      <section className="detail-section"><div className="detail-section-heading"><h3>{practice.format === 'Essay' || practice.format === 'Notes' ? 'Your writing' : 'About this work'}</h3></div>{practice.content.trim() ? <div className="practice-content">{practice.content}</div> : <p className="muted">{practice.url ? 'Your work is saved at the link above.' : 'A new draft. Open the editor to start writing or add a link.'}</p>}</section>
      {practice.status === 'draft' && (practice.content.trim() || practice.url) && <button type="button" className="button secondary" onClick={() => onUpdate({ ...practice, status: 'finished' })}><Check size={15} />Mark finished</button>}
      {practice.status === 'finished' && <button type="button" className="button quiet" onClick={() => onUpdate({ ...practice, status: 'draft' })}>Move back to drafts</button>}
      <div className="detail-bottom"><span>Updated {fullDate(practice.updatedAt)}</span><button type="button" className="icon-button delete-button" aria-label="Remove practice" title="Remove practice" onClick={() => setRemoving(true)}><Trash2 size={16} /></button></div>
      {removing && <RemoveConfirmation kind="practice" onCancel={() => setRemoving(false)} onConfirm={onRemove} />}
    </div>
  </Dialog>;
}
