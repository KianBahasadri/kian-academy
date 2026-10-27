import { ArrowUpRight, ChevronRight, ExternalLink, NotebookPen } from 'lucide-react';
import { safeUrl, sourceHost, wordCount } from '../model';
import type { Practice, Resource } from '../model';
import { Dialog, FormatIcon, ResourceMark, Status, Subjects, Tier } from './ui';

const fullDate = (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

export function ResourceDetails({ resource, practice, onPractice, onClose }: { resource: Resource; practice: Practice[]; onPractice: (id: string) => void; onClose: () => void }) {
  return <Dialog title="Resource details" onClose={onClose} drawer><div className="dialog-body detail-body">
    <div className="detail-identity"><ResourceMark format={resource.format} subjects={resource.subjects} large /><div className="eyebrow">{resource.format}<span>·</span><Subjects values={resource.subjects} /><span className="tier-tag"><Tier value={resource.tier} /></span></div></div>
    <h3 className="detail-title">{resource.title}</h3>{resource.creator && <p className="detail-creator">{resource.creator}</p>}
    {resource.publication && <dl className="resource-bibliography" aria-label="Publication details">
      <dt>Publication year</dt><dd>{resource.publication.year}</dd>
      <dt>Publisher</dt><dd>{resource.publication.publisher}</dd>
      {resource.publication.edition && <><dt>Edition</dt><dd>{resource.publication.edition}</dd></>}
      {resource.publication.binding && <><dt>Binding</dt><dd>{resource.publication.binding}</dd></>}
      {resource.publication.isbn && <><dt>ISBN-13</dt><dd className="mono">{resource.publication.isbn}</dd></>}
      {resource.publication.pages !== undefined && <><dt>Pages</dt><dd>{resource.publication.pages}</dd></>}
      <dt>Record</dt><dd><a className="bibliographic-record" href={safeUrl(resource.publication.sourceUrl)} target="_blank" rel="noopener noreferrer">Bibliographic record<ArrowUpRight size={13} aria-hidden="true" /></a></dd>
    </dl>}
    {resource.description && <p className="detail-description">{resource.description}</p>}
    {safeUrl(resource.url) && <><div className="detail-actions"><a className="button primary" href={safeUrl(resource.url)} target="_blank" rel="noopener noreferrer">Open resource<ArrowUpRight size={16} /></a></div><span className="source-host"><ExternalLink size={12} />{sourceHost(resource.url)}</span></>}
    <section className="detail-section"><div className="detail-section-heading"><h3>Learning progress</h3><Status value={resource.status} /></div><div className="published-progress"><progress aria-label={`${resource.title} progress`} value={resource.progress} max={100} /><span className="mono">{resource.progress}%</span></div></section>
    {resource.notes.trim() && <section className="detail-section"><div className="detail-section-heading"><h3>Notes</h3></div><div className="practice-content">{resource.notes}</div></section>}
    <section className="detail-section"><div className="detail-section-heading"><h3>Related practice <span className="count">{practice.length}</span></h3></div>{practice.length ? <div className="related-list">{practice.map(item => <button key={item.id} type="button" onClick={() => onPractice(item.id)}><FormatIcon format={item.format} /><span>{item.title}<small>{item.format} · {item.status === 'draft' ? 'Draft' : 'Finished'}</small></span><ChevronRight size={15} /></button>)}</div> : <div className="related-empty"><NotebookPen size={23} strokeWidth={1.4} /><p>No related work published yet.</p></div>}</section>
    <div className="detail-bottom"><span>Updated <time dateTime={resource.updatedAt}>{fullDate(resource.updatedAt)}</time></span></div>
  </div></Dialog>;
}

export function PracticeDetails({ practice, resource, onResource, onClose }: { practice: Practice; resource?: Resource; onResource: () => void; onClose: () => void }) {
  return <Dialog title="Practice details" onClose={onClose} drawer><div className="dialog-body detail-body">
    <div className="detail-identity"><ResourceMark format={practice.format} subjects={[practice.subject]} large /><span className="eyebrow">{practice.format}<span>·</span>{practice.subject}</span></div>
    <h3 className="detail-title">{practice.title}</h3><div className="practice-detail-meta"><Status value={practice.status} />{wordCount(practice.content) > 0 && <span>{wordCount(practice.content).toLocaleString()} words</span>}</div>
    {safeUrl(practice.url) && <div className="detail-actions"><a className="button primary" href={safeUrl(practice.url)} target="_blank" rel="noopener noreferrer">Open work<ArrowUpRight size={16} /></a></div>}
    {resource && <section className="detail-section"><div className="detail-section-heading"><h3>Learning resource</h3></div><button type="button" className="resource-link" onClick={onResource}><FormatIcon format={resource.format} /><span>{resource.title}<small>{resource.creator}</small></span><ChevronRight size={16} /></button></section>}
    {practice.content.trim() && <section className="detail-section"><div className="detail-section-heading"><h3>{practice.format === 'Essay' || practice.format === 'Notes' ? 'Writing' : 'About this work'}</h3></div><div className="practice-content">{practice.content}</div></section>}
    <div className="detail-bottom"><span>Updated <time dateTime={practice.updatedAt}>{fullDate(practice.updatedAt)}</time></span></div>
  </div></Dialog>;
}
