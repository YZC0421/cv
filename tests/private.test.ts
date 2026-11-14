import test from 'node:test';
import assert from 'node:assert/strict';
import { decryptBundle, encryptBundle } from '../src/lib/private.ts';
import type { PrivateBundle, PrivatePayload } from '../src/lib/private.ts';

const bundle: PrivateBundle = {
  en: {
    summary: 'Internal enterprise project.',
    stack: ['TypeScript'],
    links: [{ label: 'Contact', url: 'https://example.com' }],
    images: [{ alt: 'Architecture', type: 'image/png', data: 'iVBORw0KGgo=' }],
    documents: [{ id: 'notes', title: 'Notes', html: '<p>Notes</p>' }],
  },
  zh: { summary: '企业内部项目。' },
};
const password = 'correct horse battery staple';

test('private payload round-trips both languages', async () => {
  const payload = await encryptBundle(bundle, password);
  assert.equal(payload.v, 1);
  assert.equal(payload.kdf, 'PBKDF2-SHA-256');
  assert.ok(payload.iterations >= 600_000);
  assert.deepEqual(await decryptBundle(payload, password), bundle);
});

test('private payload carries no plaintext', async () => {
  const serialized = JSON.stringify(await encryptBundle(bundle, password));
  assert.equal(serialized.includes('Internal enterprise project.'), false);
  assert.equal(serialized.includes('企业内部项目。'), false);
});

test('private payload rejects a wrong password', async () => {
  const payload = await encryptBundle(bundle, password);
  await assert.rejects(() => decryptBundle(payload, 'wrong password'), /invalid password/);
});

test('private payload rejects tampered ciphertext', async () => {
  const payload = await encryptBundle(bundle, password);
  const bytes = Buffer.from(payload.ciphertext, 'base64');
  bytes[0] ^= 0xff;
  await assert.rejects(() =>
    decryptBundle({ ...payload, ciphertext: bytes.toString('base64') }, password)
  );
});

test('private payload rejects an unsupported version', async () => {
  const payload = await encryptBundle(bundle, password);
  await assert.rejects(
    () => decryptBundle({ ...payload, v: 2 } as unknown as PrivatePayload, password),
    /unsupported payload/
  );
});
