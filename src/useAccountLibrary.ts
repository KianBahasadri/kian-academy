import { useCallback, useEffect, useRef, useState } from 'react';
import type { Library } from './model';
import { parseLibrary } from './model';
import { downloadJson } from './download';

const emptyLibrary = (): Library => ({ version: 1, resources: [], practice: [] });
// Unsent work remains private to this account in memory if Clerk changes sessions.
const pending = new Map<string, { library: Library; revision: number }>();
class SaveError extends Error { constructor(public status: number, message: string) { super(message); } }

export function useAccountLibrary(userId: string | null, getToken: () => Promise<string | null>) {
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(userId));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState(false);
  const current = useRef({ library, revision: -1, dirty: false, blocked: false });
  const active = useRef(false);
  const tokenRef = useRef(getToken);
  tokenRef.current = getToken;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savingPromise = useRef<Promise<boolean> | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const lastLoaded = useRef(0);
  const loadingRequest = useRef<AbortController | null>(null);
  const saveRequest = useRef<AbortController | null>(null);

  async function request(path: string, signal: AbortSignal, body?: unknown) {
    const token = await tokenRef.current();
    if (!token) throw new SaveError(401, 'Your session expired. Sign in again to save your changes.');
    const response = await fetch(`/api/account/${path}`, {
      method: body === undefined ? 'GET' : 'PUT', credentials: 'omit', signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-Academy-Request': '1' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    let value;
    try { value = await response.json(); } catch { throw new SaveError(503, 'The save server returned an unreadable response. Your changes are still available here.'); }
    if (!response.ok) throw new SaveError(response.status, typeof value.error === 'string' ? value.error : 'Your library could not be saved. Try again.');
    return value;
  }

  const load = useCallback(async (discardPending = false) => {
    if (!userId) return;
    loadingRequest.current?.abort();
    const controller = new AbortController();
    loadingRequest.current = controller;
    if (current.current.revision < 0) setLoading(true);
    try {
      const snapshot = await request('session', controller.signal);
      if (snapshot.user?.id !== userId || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0) throw new Error('Your account changed. Sign in again.');
      const saved = parseLibrary(JSON.stringify(snapshot.library));
      if (!active.current || controller.signal.aborted) return;
      if (discardPending) pending.delete(userId);
      const unsent = pending.get(userId);
      const changed = Boolean(unsent && unsent.revision !== snapshot.revision);
      const next = unsent?.library ?? saved;
      current.current = { library: next, revision: unsent?.revision ?? snapshot.revision, dirty: Boolean(unsent), blocked: changed };
      setLibrary(next); setDirty(Boolean(unsent)); setConflict(changed); setLoading(false); setSaving(false);
      setError(changed ? 'Unsent changes from this session differ from your saved library. Download a backup before loading the saved version.' : '');
      lastLoaded.current = Date.now();
      if (unsent && !changed) schedule();
    } catch (failure) {
      if (!active.current || controller.signal.aborted) return;
      current.current.blocked = true;
      setLoading(false);
      setError(failure instanceof Error ? failure.message : 'Your account library could not be loaded. Try again.');
    }
  // The token getter can change without changing the account being loaded.
  }, [userId]);

  function schedule() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, 650);
  }

  async function flush(force = false): Promise<boolean> {
    clearTimeout(timer.current);
    if (savingPromise.current) return savingPromise.current;
    if (!userId || current.current.revision < 0) return false;
    if (!current.current.dirty) return true;
    if (current.current.blocked && !force) return false;
    const snapshot = { ...current.current };
    const controller = new AbortController();
    saveRequest.current = controller;
    setSaving(true);
    const task = (async () => {
      try {
        const reply = await request('profile', controller.signal, { accountId: userId, revision: snapshot.revision, library: snapshot.library });
        if (reply.revision !== snapshot.revision + 1) throw new Error('The save response could not be verified. Download your changes before reloading.');
        if (!active.current || controller.signal.aborted) return false;
        const stillDirty = current.current.library !== snapshot.library;
        current.current.revision = reply.revision;
        current.current.dirty = stillDirty;
        current.current.blocked = false;
        setDirty(stillDirty); setConflict(false); setError('');
        if (stillDirty) pending.set(userId, { library: current.current.library, revision: reply.revision });
        else pending.delete(userId);
        channel.current?.postMessage({ userId, revision: reply.revision });
        return !stillDirty;
      } catch (failure) {
        if (!active.current || controller.signal.aborted) return false;
        current.current.blocked = true;
        setConflict(failure instanceof SaveError && failure.status === 409);
        setError(failure instanceof Error ? failure.message : 'Your changes could not be saved. Download a backup to keep them.');
        return false;
      } finally {
        savingPromise.current = null;
        if (active.current) {
          setSaving(false);
          if (current.current.dirty && !current.current.blocked) schedule();
        }
      }
    })();
    savingPromise.current = task;
    return task;
  }

  useEffect(() => {
    active.current = true;
    if (!userId) return () => { active.current = false; };
    void load();
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('kian-academy:account');
      channel.current.onmessage = event => {
        if (event.data?.userId === userId && event.data.revision > current.current.revision && !current.current.dirty) void load();
      };
    }
    const focus = () => { if (!current.current.dirty && !savingPromise.current && Date.now() - lastLoaded.current > 30000) void load(); };
    const beforeUnload = (event: BeforeUnloadEvent) => { if (current.current.dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('focus', focus);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      active.current = false;
      clearTimeout(timer.current);
      loadingRequest.current?.abort();
      saveRequest.current?.abort();
      channel.current?.close(); channel.current = null;
      window.removeEventListener('focus', focus);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [userId, load]);

  function commit(update: (value: Library) => Library): boolean {
    if (!userId || current.current.revision < 0) return false;
    const next = update(current.current.library);
    current.current.library = next; current.current.dirty = true;
    pending.set(userId, { library: next, revision: current.current.revision });
    setLibrary(next); setDirty(true);
    if (!current.current.blocked) schedule();
    return true;
  }

  async function restore(next: Library) {
    if (!userId) return false;
    // Replacement is an explicit, reviewed action; fetch the current revision first.
    if (savingPromise.current) await savingPromise.current;
    const controller = new AbortController();
    try {
      const snapshot = await request('session', controller.signal);
      if (snapshot.user?.id !== userId || !Number.isSafeInteger(snapshot.revision)) throw new Error('The signed-in account changed.');
      if (!active.current) return false;
      current.current.revision = snapshot.revision; current.current.blocked = false;
      setConflict(false); setError('');
      commit(() => next);
      return await flush();
    } catch (failure) { if (active.current) setError(failure instanceof Error ? failure.message : 'Your library could not be restored.'); return false; }
  }

  return {
    library, error, loading, saving, dirty, conflict, corrupt: Boolean(userId && current.current.revision < 0), commit, restore,
    backup: () => downloadJson(JSON.stringify(current.current.library, null, 2)),
    retry: () => current.current.revision < 0 ? load() : flush(true),
    reloadSaved: () => load(true),
    flush: async () => { if (await flush()) return true; if (!current.current.blocked && current.current.dirty) return flush(); return false; },
  };
}
