import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalPostPath,
  isStale,
  lastReviewed,
  monthsBetween,
  postTags,
  postsByLang,
  translationFor,
  visiblePosts,
} from '../src/lib/posts.ts';

const make = (over: Record<string, unknown>) =>
  ({
    id: String(over.id ?? Math.random()),
    data: { title: 'T', date: '2026-01-01', lang: 'zh', tags: ['t'], summary: 's', draft: false, ...over },
  }) as any;

test('visiblePosts filters drafts and future dates', () => {
  const posts = [
    make({ id: 'a', date: '2026-01-01' }),
    make({ id: 'b', draft: true }),
    make({ id: 'c', date: '2099-01-01' }),
  ];
  assert.deepEqual(
    visiblePosts(posts, '2026-11-07').map((post: any) => post.id),
    ['a']
  );
});

test('visiblePosts sorts newest first', () => {
  const posts = [
    make({ id: 'old', date: '2025-01-01' }),
    make({ id: 'new', date: '2026-06-01' }),
  ];
  assert.deepEqual(
    visiblePosts(posts, '2026-11-07').map((post: any) => post.id),
    ['new', 'old']
  );
});

test('postTags returns sorted unique tags', () => {
  const posts = [
    make({ id: 'a', tags: ['typescript', 'astro'] }),
    make({ id: 'b', tags: ['astro'] }),
  ];
  assert.deepEqual(postTags(posts), ['astro', 'typescript']);
});

test('visiblePosts can include drafts when explicitly asked', () => {
  const posts = [make({ id: 'draft', draft: true }), make({ id: 'live' })];
  assert.deepEqual(
    visiblePosts(posts, '2026-11-07', { includeDrafts: true }).map((post: any) => post.id),
    ['draft', 'live']
  );
});

test('visiblePosts still hides future-dated drafts in dev mode', () => {
  const posts = [make({ id: 'future', draft: true, date: '2099-01-01' })];
  assert.deepEqual(visiblePosts(posts, '2026-11-07', { includeDrafts: true }), []);
});

test('postsByLang only returns posts written in that language', () => {
  const posts = [make({ id: 'en', lang: 'en' }), make({ id: 'zh', lang: 'zh' })];
  assert.deepEqual(postsByLang(posts, 'zh').map((post: any) => post.id), ['zh']);
  assert.deepEqual(postsByLang(posts, 'en').map((post: any) => post.id), ['en']);
});

test('canonicalPostPath follows the post language', () => {
  assert.equal(canonicalPostPath(make({ id: 'a', lang: 'zh' })), 'zh/blog/a');
  assert.equal(canonicalPostPath(make({ id: 'b', lang: 'en' })), 'blog/b');
});

test('translationFor resolves explicit and inverse declarations', () => {
  const en = make({ id: 'en', lang: 'en' });
  const zh = make({ id: 'zh', lang: 'zh', translationOf: 'en' });
  assert.equal(translationFor([en, zh], zh)?.id, 'en');
  assert.equal(translationFor([en, zh], en)?.id, 'zh');
  assert.equal(translationFor([en], en), undefined);
});

test('translationFor refuses to pair posts in the same language', () => {
  const a = make({ id: 'a', lang: 'zh', translationOf: 'b' });
  const b = make({ id: 'b', lang: 'zh' });
  assert.equal(translationFor([a, b], a), undefined);
});

test('monthsBetween counts whole months only', () => {
  assert.equal(monthsBetween('2025-11-14', '2026-11-14'), 12);
  assert.equal(monthsBetween('2025-11-15', '2026-11-14'), 11);
  assert.equal(monthsBetween('2026-11-15', '2026-11-14'), -1);
});

test('lastReviewed prefers reviewed, then updated, then date', () => {
  assert.equal(lastReviewed(make({ date: '2025-01-01' })), '2025-01-01');
  assert.equal(lastReviewed(make({ date: '2025-01-01', updated: '2025-06-01' })), '2025-06-01');
  assert.equal(
    lastReviewed(make({ date: '2025-01-01', updated: '2025-06-01', reviewed: '2026-01-01' })),
    '2026-01-01'
  );
});

test('isStale flips at twelve months and honours reviewed', () => {
  const old = make({ date: '2025-01-01' });
  assert.equal(isStale(old, '2026-11-14'), true);
  assert.equal(isStale(old, '2025-12-31'), false);
  const reviewed = make({ date: '2023-01-01', reviewed: '2026-06-01' });
  assert.equal(isStale(reviewed, '2026-11-14'), false);
  assert.equal(isStale(reviewed, '2027-06-01'), true);
});
