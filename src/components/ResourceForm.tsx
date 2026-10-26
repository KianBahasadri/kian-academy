import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link2 } from 'lucide-react';
import { resourceFormats, safeUrl, subjects } from '../model';
import type { Resource, ResourceFormat } from '../model';
import { Dialog } from './ui';

export default function ResourceForm({ resource, onSave, onClose }: { resource?: Resource; onSave: (resource: Resource) => void; onClose: () => void }) {
  const dirty = useRef(false);
  const [error, setError] = useState('');
  const close = () => { if (!dirty.current || window.confirm('Discard your unsaved resource changes?')) onClose(); };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const text = (name: string) => String(values.get(name) ?? '').trim();
    if (!text('title')) { setError('Give this resource a title.'); return; }
    const url = safeUrl(text('url'));
    if (text('url') && !url) { setError('Use a complete link beginning with https:// or http://.'); return; }
    const now = new Date().toISOString();
    onSave({
      id: resource?.id ?? crypto.randomUUID(),
      title: text('title'), creator: text('creator'), format: text('format') as ResourceFormat,
      subject: text('subject') || 'General', url, description: text('description'),
      notes: resource?.notes ?? '', status: resource?.status ?? 'planned', progress: resource?.progress ?? 0,
      createdAt: resource?.createdAt ?? now, updatedAt: now,
    });
  }

  return <Dialog title={resource ? 'Edit resource' : 'Add a resource'} onClose={close}>
    <form onSubmit={submit} onChange={() => { dirty.current = true; }}>
      <div className="dialog-body form-fields">
        <p className="form-intro">Something to learn from. A playlist, a book, a course, or anything else.</p>
        <label className="field">Title<input name="title" placeholder="e.g. Essence of linear algebra" required maxLength={200} defaultValue={resource?.title} data-autofocus /></label>
        <label className="field">Link <span className="optional">optional</span><span className="input-with-icon"><Link2 size={16} /><input name="url" type="url" placeholder="https://…" defaultValue={resource?.url} /></span></label>
        <div className="field-row"><label className="field">Format<select name="format" defaultValue={resource?.format ?? 'Course'}>{resourceFormats.map(format => <option key={format}>{format}</option>)}</select></label><label className="field">Subject<input name="subject" list="resource-subjects" placeholder="e.g. Mathematics" maxLength={80} defaultValue={resource?.subject} /><datalist id="resource-subjects">{subjects.map(subject => <option key={subject} value={subject} />)}</datalist></label></div>
        <label className="field">Author or creator <span className="optional">optional</span><input name="creator" placeholder="Who made this?" maxLength={160} defaultValue={resource?.creator} /></label>
        <label className="field">Description <span className="optional">optional</span><textarea name="description" rows={3} placeholder="What will you learn?" defaultValue={resource?.description} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <div className="dialog-footer"><button type="button" className="button secondary" onClick={close}>Cancel</button><button className="button primary" type="submit">{resource ? 'Save changes' : 'Add resource'}</button></div>
    </form>
  </Dialog>;
}
