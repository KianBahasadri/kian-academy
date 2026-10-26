import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tokenFor, testOrigin } from './clerk.ts';
import type { AccountSnapshot } from '../../server/accountStore.ts';

export interface AccountRuntime {
  request: (path: string, body?: unknown, token?: string, headers?: Record<string, string>) => Promise<{ status: number; headers: { get: (name: string) => string | null }; json: () => Promise<unknown>; text: () => Promise<string> }>;
  corrupt: (userId: string) => Promise<void>;
  close: () => Promise<void>;
}

export function accountSuite(name: string, factory: () => Promise<AccountRuntime>) {
  describe(name, () => {
    it('verifies sessions, isolates accounts, saves private writing, and enforces revisions', async () => {
      const api = await factory();
      try {
        assert.deepEqual(await (await api.request('session')).json(), { user: null });
        const alice = tokenFor('user_alice'), bob = tokenFor('user_bob');
        const a = await (await api.request('session', undefined, alice)).json() as AccountSnapshot;
        const b = await (await api.request('session', undefined, bob)).json() as AccountSnapshot;
        assert.equal(a.user.id, 'user_alice'); assert.equal(a.revision, 0); assert.equal(a.library.resources.length, 8); assert.equal(a.library.practice.length, 0);
        a.library.resources[0].notes = 'Private notes belonging to Alice.';
        const body = { accountId: a.user.id, revision: a.revision, library: a.library };
        assert.equal((await api.request('profile', body)).status, 401);
        assert.equal((await api.request('profile', body, bob)).status, 409);
        assert.equal((await api.request('profile', body, alice, { Origin: 'https://evil.test' })).status, 403);
        const saves = await Promise.all([api.request('profile', body, alice), api.request('profile', body, alice)]);
        assert.deepEqual(saves.map(result => result.status).sort(), [200, 409]);
        const saved = await (await api.request('session', undefined, alice)).json() as AccountSnapshot;
        assert.equal(saved.revision, 1); assert.equal(saved.library.resources[0].notes, 'Private notes belonging to Alice.');
        assert.deepEqual((await (await api.request('session', undefined, bob)).json() as AccountSnapshot).library, b.library);
        assert.equal((await api.request('profile', { ...body, revision: 1, library: { version: 1, resources: [], practice: [{ id: 'invalid' }] } }, alice)).status, 400);
        assert.equal((await api.request('session', undefined, alice)).headers.get('cache-control'), 'no-store');
      } finally { await api.close(); }
    });

    it('rejects expired, foreign-origin, wrong-issuer, and unsigned sessions', async () => {
      const api = await factory();
      try {
        for (const token of [tokenFor('user_alice', { exp: 1 }), tokenFor('user_alice', { azp: 'https://evil.test' }), tokenFor('user_alice', { iss: 'https://other.clerk.accounts.dev' }), tokenFor('user_alice', { azp: undefined }), 'not-a-jwt']) {
          assert.equal((await api.request('session', undefined, token)).status, 401);
        }
        const response = await api.request('profile', {}, tokenFor(), { 'X-Academy-Request': '', Origin: testOrigin });
        assert.equal(response.status, 403);
      } finally { await api.close(); }
    });

    it('round-trips large Unicode essays and preserves damaged saved data', async () => {
      const api = await factory();
      try {
        const token = tokenFor();
        const snapshot = await (await api.request('session', undefined, token)).json() as AccountSnapshot;
        const now = new Date().toISOString();
        const content = '数学📚 '.repeat(200000);
        snapshot.library.practice.push({ id: 'essay', title: 'A long essay', format: 'Essay', subject: 'Mathematics', resourceId: snapshot.library.resources[0].id, url: '', content, status: 'draft', createdAt: now, updatedAt: now });
        const body = { accountId: snapshot.user.id, revision: 0, library: snapshot.library };
        const saved = await api.request('profile', body, token);
        assert.equal(saved.status, 200, await saved.text());
        const restored = await (await api.request('session', undefined, token)).json() as AccountSnapshot;
        assert.equal(restored.library.practice[0].content, content);
        await api.corrupt(snapshot.user.id);
        assert.equal((await api.request('session', undefined, token)).status, 503);
        assert.equal((await api.request('profile', { ...body, revision: 1 }, token)).status, 503);
      } finally { await api.close(); }
    });
  });
}
