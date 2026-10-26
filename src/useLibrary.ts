import { useEffect, useRef, useState } from 'react';
import { parseLibrary, STORAGE_KEY } from './model';
import type { Library } from './model';
import { starterLibrary } from './seed';
import { useAcademyAuth } from './auth';
import { useAccountLibrary } from './useAccountLibrary';
import { downloadJson } from './download';

function readLibrary(): { data: Library; error: string; corrupt: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      try { return { data: parseLibrary(raw), error: '', corrupt: false }; }
      catch { return { data: { version: 1, resources: [], practice: [] }, error: 'This saved library could not be read. Your saved data has been kept untouched.', corrupt: true }; }
    }
    return { data: starterLibrary(), error: '', corrupt: false };
  } catch {
    return { data: starterLibrary(), error: 'Browser storage is unavailable. Changes will only last for this session. Download a backup to keep them.', corrupt: false };
  }
}

function useDeviceLibrary() {
  const [initial] = useState(readLibrary);
  const [library, setLibrary] = useState(initial.data);
  const current = useRef(library);
  const [error, setError] = useState(initial.error);
  const [corrupt, setCorrupt] = useState(initial.corrupt);

  useEffect(() => {
    if (initial.corrupt || initial.error) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === null) localStorage.setItem(STORAGE_KEY, JSON.stringify(initial.data));
    } catch {
      setError('Browser storage is unavailable. Download a backup to keep this library before closing the page.');
    }
  }, [initial]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === null) {
        setError('The saved library was removed in another tab. Download a backup to keep this copy.');
        return;
      }
      try {
        const next = parseLibrary(event.newValue);
        current.current = next;
        setLibrary(next);
        setError('');
        setCorrupt(false);
      } catch {
        setError('The saved library changed in another tab and could not be read. Your current copy is still available.');
        setCorrupt(true);
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  function commit(update: (value: Library) => Library): boolean {
    if (corrupt) return false;
    const next = update(current.current);
    current.current = next;
    setLibrary(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setError('');
    } catch {
      setError('Your latest changes could not be saved on this device. Download a backup to keep them before closing this page.');
    }
    return true;
  }

  function backup() {
    let content = JSON.stringify(current.current, null, 2);
    if (corrupt) {
      try { content = localStorage.getItem(STORAGE_KEY) ?? content; } catch { /* Export the in-memory copy if storage is unavailable. */ }
    }
    downloadJson(content);
  }

  function restore(next: Library) {
    current.current = next;
    setLibrary(next);
    setCorrupt(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setError('');
    } catch {
      setError('The restored library is only available for this session because browser storage is unavailable. Download a backup before closing this page.');
    }
    return true;
  }

  return { library, commit, error, corrupt, backup, restore };
}

export function useLibrary() {
  const auth = useAcademyAuth();
  const device = useDeviceLibrary();
  const account = useAccountLibrary(auth.userId, auth.getToken);
  return {
    ...(auth.userId ? account : device),
    deviceLibrary: device.library,
    cloud: Boolean(auth.userId),
    busy: !auth.loaded || Boolean(auth.userId && account.loading),
    saving: Boolean(auth.userId && account.saving),
    dirty: Boolean(auth.userId && account.dirty),
    conflict: Boolean(auth.userId && account.conflict),
    retry: account.retry, reloadSaved: account.reloadSaved, flush: account.flush,
  };
}
