import { useState } from 'react';
import { Cloud, Download, HardDrive, LogOut, Upload } from 'lucide-react';
import type { Library } from '../model';
import { parseLibrary } from '../model';
import { Dialog } from './ui';

export default function LibrarySettings({ library, deviceLibrary, cloud, dirty, saving, error: saveError, onBackup, onRestore, onClose, onSignIn, onSignUp, onManageAccount, onSignOut, onForceSignOut }: {
  library: Library; deviceLibrary: Library; cloud: boolean; dirty: boolean; saving: boolean; error: string;
  onBackup: () => void; onRestore: (library: Library) => Promise<void>; onClose: () => void;
  onSignIn?: () => void; onSignUp?: () => void; onManageAccount: () => void; onSignOut: () => void; onForceSignOut: () => void;
}) {
  const [pending, setPending] = useState<Library | null>(null);
  const [pendingSource, setPendingSource] = useState<'backup' | 'device'>('backup');
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');

  async function readFile(file?: File) {
    setPending(null);
    setError('');
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Choose a backup smaller than 10 MB.'); return; }
    try { setPending(parseLibrary(await file.text())); setPendingSource('backup'); }
    catch { setError('This file is not a valid Kian Academy backup. Your current library has not changed.'); }
  }

  return <Dialog title="Your library" onClose={onClose}>
    <div className="dialog-body">
      <div className="storage-explainer">{cloud ? <Cloud size={25} strokeWidth={1.5} /> : <HardDrive size={25} strokeWidth={1.5} />}<div><h3>{cloud ? 'Saved to your account' : 'Saved on this device'}</h3><p>{cloud ? 'Your resources and practice save automatically and follow you to other devices.' : 'Your resources and practice stay in this browser. Download a backup to keep a copy or move to another device.'}</p></div></div>
      {!cloud && onSignIn && <div className="account-sign-in"><p>Sign in to save your library across devices.</p><div className="heading-actions"><button type="button" className="button primary" onClick={onSignIn}>Sign in</button><button type="button" className="button secondary" onClick={onSignUp}>Create account</button></div></div>}
      <div className="library-summary"><span><strong>{library.resources.length}</strong> resources</span><span><strong>{library.practice.length}</strong> practice</span></div>
      <div className="backup-actions"><button type="button" className="button primary" onClick={onBackup}><Download size={15} />Download backup</button><label className="button secondary file-button"><Upload size={15} />Choose backup<input type="file" accept="application/json,.json" aria-label="Choose backup" onChange={event => { void readFile(event.target.files?.[0]); event.target.value = ''; }} /></label></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {saveError && <p className="form-error" role="alert">{saveError}</p>}
      {cloud && <section className="detail-section"><h3>Library on this device</h3><p className="settings-copy">Your original device library is kept separately. Copy it into this account when you’re ready.</p><button type="button" className="button secondary" disabled={saving || restoring} onClick={() => { setPending(deviceLibrary); setPendingSource('device'); }}>Use device library</button></section>}
      {pending && <div className="restore-preview"><h3>{pendingSource === 'device' ? 'Use this device’s library?' : 'Restore this backup?'}</h3><p>This will replace your {cloud ? 'account library' : 'library'} with {pending.resources.length} resources and {pending.practice.length} practice entries. Download your current library first if you want to keep it.</p><div className="heading-actions"><button type="button" className="button secondary" disabled={restoring} onClick={() => setPending(null)}>Cancel</button><button type="button" className="button primary" disabled={saving || restoring} onClick={async () => { setRestoring(true); try { await onRestore(pending); } finally { setRestoring(false); } }}>{restoring ? 'Restoring…' : 'Restore library'}</button></div></div>}
      {cloud && <section className="detail-section account-settings-actions"><button type="button" className="button secondary" onClick={onManageAccount}>Manage account</button><button type="button" className="button quiet" disabled={saving || restoring} onClick={onSignOut}><LogOut size={14} />Sign out</button>{dirty && saveError && <button type="button" className="button quiet" onClick={() => { if (window.confirm('Sign out with unsaved changes? Download a backup first to keep them.')) onForceSignOut(); }}>Sign out without saving</button>}</section>}
      <section className="detail-section"><h3>Keyboard shortcuts</h3><dl className="shortcuts"><div><dt>Search this collection</dt><dd><kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd></dd></div><div><dt>Add to this collection</dt><dd><kbd>N</kbd></dd></div><div><dt>Close details</dt><dd><kbd>Esc</kbd></dd></div></dl></section>
    </div>
  </Dialog>;
}
