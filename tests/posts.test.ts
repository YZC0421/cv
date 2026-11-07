import test from 'node:test';
import assert from 'node:assert/strict';
import { visiblePosts } from '../src/lib/posts.ts';

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
