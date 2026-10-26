import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { tokenFor } from './support/clerk';

async function mountAccounts(page: Page, baseURL: string, suffix: string) {
  const users = [`user_browser_${suffix}_alice`, `user_browser_${suffix}_bob`];
  const tokens = Object.fromEntries(users.map(id => [id, tokenFor(id, { azp: baseURL })]));
  // Replace only the test browser's entry module. Production code uses real Clerk.
  await page.route('**/src/main.tsx', route => route.fulfill({ contentType: 'application/javascript', body: `
    import React from '/node_modules/.vite/deps/react.js';
    import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
    import {AuthContext} from '/src/auth.tsx';
    import App from '/src/App.tsx';
    import '/src/styles.css';
    const {useState,useEffect}=React;
    const tokens=${JSON.stringify(tokens)};
    function TestApp(){
      const [userId,setUser]=useState(null);
      useEffect(()=>{window.setAcademyTestUser=setUser;},[]);
      const value={configured:true,loaded:true,userId,name:userId?'Test learner':null,getToken:async()=>tokens[userId]??null,signIn:()=>setUser(${JSON.stringify(users[0])}),signUp:()=>setUser(${JSON.stringify(users[0])}),signOut:async()=>setUser(null),manageAccount:()=>{}};
      return React.createElement(AuthContext.Provider,{value},React.createElement(App));
    }
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(TestApp));
  ` }));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  const changeUser = (userId: string | null) => page.evaluate(id => (window as unknown as { setAcademyTestUser: (id: string | null) => void }).setAcademyTestUser(id), userId);
  return { users, tokens, changeUser };
}

test('device library is copied only after review, and account saves survive signing out and back in', async ({ page, baseURL }) => {
  const { users, changeUser } = await mountAccounts(page, baseURL!, `migration_${Date.now()}`);
  await page.getByRole('button', { name: 'Details for Essence of linear algebra' }).click();
  await page.getByRole('textbox', { name: 'Your notes' }).fill('My original device notes.');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved to your account' })).toBeVisible();
  await page.getByRole('button', { name: 'Details for Essence of linear algebra' }).click();
  await expect(page.getByRole('textbox', { name: 'Your notes' })).toHaveValue('');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Your account', exact: true }).click();
  await page.getByRole('button', { name: 'Use device library' }).click();
  await expect(page.getByRole('heading', { name: 'Use this device’s library?' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore library', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Saved to your account' })).toBeVisible();
  await page.getByRole('button', { name: 'Details for Essence of linear algebra' }).click();
  await expect(page.getByRole('textbox', { name: 'Your notes' })).toHaveValue('My original device notes.');
  await page.getByRole('textbox', { name: 'Your notes' }).fill('Private account notes.');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('button', { name: 'Saved to your account' })).toBeVisible();
  await page.getByRole('button', { name: 'Your account', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Details for Essence of linear algebra' }).click();
  await expect(page.getByRole('textbox', { name: 'Your notes' })).toHaveValue('My original device notes.');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await changeUser(users[0]);
  await expect(page.getByRole('button', { name: 'Saved to your account' })).toBeVisible();
  await page.getByRole('button', { name: 'Details for Essence of linear algebra' }).click();
  await expect(page.getByRole('textbox', { name: 'Your notes' })).toHaveValue('Private account notes.');
});

test('account switching keeps unsent work private, and stale saves preserve edits until reviewed', async ({ page, baseURL, request }) => {
  const { users, tokens, changeUser } = await mountAccounts(page, baseURL!, `conflict_${Date.now()}`);
  await changeUser(users[0]);
  await expect(page.getByRole('button', { name: 'Saved to your account' })).toBeVisible();
  await page.getByRole('button', { name: 'Details for Essence of linear algebra' }).click();
  await page.getByRole('textbox', { name: 'Your notes' }).fill('Alice’s unsent private work.');
  await changeUser(users[1]);
  await expect(page.getByRole('button', { name: 'Saved to your account' })).toBeVisible();
  await page.getByRole('button', { name: 'Details for Essence of linear algebra' }).click();
  await expect(page.getByRole('textbox', { name: 'Your notes' })).toHaveValue('');
  await changeUser(users[0]);
  await expect(page.getByRole('button', { name: 'Saved to your account' })).toBeVisible();
  const headers = { Authorization: `Bearer ${tokens[users[0]]}`, Origin: baseURL!, 'X-Academy-Request': '1' };
  const snapshot = await (await request.get('/api/account/session', { headers })).json();
  expect(snapshot.library.resources[0].notes).toBe('Alice’s unsent private work.');
  snapshot.library.resources[0].notes = 'An edit saved on another device.';
  expect((await request.put('/api/account/profile', { headers, data: { accountId: users[0], revision: snapshot.revision, library: snapshot.library } })).status()).toBe(200);
  await page.getByRole('button', { name: 'Details for Essence of linear algebra' }).click();
  await page.getByRole('textbox', { name: 'Your notes' }).fill('Local work that must not overwrite the other device.');
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('changed in another tab or device');
  await expect(page.getByRole('textbox', { name: 'Your notes' })).toHaveValue('Local work that must not overwrite the other device.');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Load saved version' }).click();
  await expect(page.getByRole('button', { name: 'Saved to your account' })).toBeVisible();
  await page.getByRole('button', { name: 'Details for Essence of linear algebra' }).click();
  await expect(page.getByRole('textbox', { name: 'Your notes' })).toHaveValue('An edit saved on another device.');
});
