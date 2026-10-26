import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link2 } from 'lucide-react';
import { practiceFormats, safeUrl, subjects, wordCount } from '../model';
import type { Practice, PracticeFormat, PracticeStatus, Resource } from '../model';
import { Dialog } from './ui';

export default function PracticeForm({ practice, resources, resourceId, onSave, onClose }: { practice?: Practice; resources: Resource[]; resourceId?: string; onSave: (practice: Practice) => void; onClose: () => void }) {
  const dirty = useRef(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState(practice?.content ?? '');
  const [subject, setSubject] = useState(practice?.subject ?? resources.find(r => r.id === resourceId)?.subject ?? '');
  const [format, setFormat] = useState<PracticeFormat>(practice?.format ?? 'Essay');
  const close = () => { if (!dirty.current || window.confirm('Discard your unsaved practice changes?')) onClose(); };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? '').trim();
    const url = safeUrl(text('url'));
    if (!text('title')) { setError('Give your work a title.'); return; }
    if (text('url') && !url) { setError('Use a complete link beginning with https:// or http://.'); return; }
    if (text('status') === 'finished' && !content.trim() && !url) { setError('Add your writing or a link to your work before marking it finished.'); return; }
    const selectedResource = text('resourceId') || null;
    if (selectedResource && !resources.some(r => r.id === selectedResource)) { setError('That resource is no longer available. Choose another resource.'); return; }
    const now = new Date().toISOString();
    onSave({ id: practice?.id ?? crypto.randomUUID(), title: text('title'), format, subject: subject.trim() || 'General', resourceId: selectedResource, url, content, status: text('status') as PracticeStatus, createdAt: practice?.createdAt ?? now, updatedAt: now });
  }

  return <Dialog title={practice ? 'Edit practice' : 'Create practice'} onClose={close} wide>
    <form onSubmit={submit} onChange={() => { dirty.current = true; }}>
      <div className="dialog-body form-fields">
        <p className="form-intro">Your own work. Write here or link an essay, video, or project you created.</p>
        <label className="field">Title<input name="title" required maxLength={200} placeholder="e.g. Explaining eigenvectors in my own words" defaultValue={practice?.title} data-autofocus /></label>
        <div className="field-row"><label className="field">Format<select name="format" value={format} onChange={event => setFormat(event.target.value as PracticeFormat)}>{practiceFormats.map(value => <option key={value}>{value}</option>)}</select></label><label className="field">Status<select name="status" defaultValue={practice?.status ?? 'draft'}><option value="draft">Draft</option><option value="finished">Finished</option></select></label></div>
        <label className="field">Related resource <span className="optional">optional</span><select name="resourceId" defaultValue={practice?.resourceId ?? resourceId ?? ''} onChange={event => { const resource = resources.find(r => r.id === event.target.value); if (resource) setSubject(resource.subject); }}><option value="">Independent practice</option>{resources.map(resource => <option value={resource.id} key={resource.id}>{resource.title}</option>)}</select></label>
        <label className="field">Subject<input name="subject" list="practice-subjects" placeholder="e.g. Mathematics" maxLength={80} value={subject} onChange={event => setSubject(event.target.value)} /><datalist id="practice-subjects">{subjects.map(value => <option key={value} value={value} />)}</datalist></label>
        <label className="field editor-field"><span>{format === 'Essay' || format === 'Notes' ? 'Your writing' : 'Notes about your work'}<span className="word-count">{wordCount(content).toLocaleString()} words</span></span><textarea name="content" className="writing-area" rows={9} placeholder={format === 'Essay' ? 'Start with an idea. Put it in your own words…' : 'What did you make? What did you learn?'} value={content} onChange={event => setContent(event.target.value)} /></label>
        <label className="field">Link to your work <span className="optional">optional</span><span className="input-with-icon"><Link2 size={16} /><input name="url" type="url" placeholder={format === 'Video' ? 'https://youtube.com/watch?v=…' : 'https://…'} defaultValue={practice?.url} /></span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <div className="dialog-footer"><button type="button" className="button secondary" onClick={close}>Cancel</button><button type="submit" className="button primary">{practice ? 'Save changes' : 'Save practice'}</button></div>
    </form>
  </Dialog>;
}
