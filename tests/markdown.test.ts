import test from 'node:test';
import assert from 'node:assert/strict';
import { hasMermaid, parseCodeMeta } from '../src/lib/markdown.ts';

test('parseCodeMeta reads a title and highlight ranges', () => {
  assert.deepEqual(parseCodeMeta('title="src/lib/posts.ts" {2-4,7}'), {
    title: 'src/lib/posts.ts',
    highlight: [
      [2, 4],
      [7, 7],
    ],
  });
});

test('parseCodeMeta tolerates missing metadata', () => {
  assert.deepEqual(parseCodeMeta(''), { title: undefined, highlight: [] });
});

test('parseCodeMeta ignores malformed ranges', () => {
  assert.deepEqual(parseCodeMeta('{a,b}'), { title: undefined, highlight: [] });
});

test('parseCodeMeta accepts single-line ranges and spaces', () => {
  assert.deepEqual(parseCodeMeta('{ 3 , 5-6 }'), {
    title: undefined,
    highlight: [
      [3, 3],
      [5, 6],
    ],
  });
});

test('hasMermaid detects fenced mermaid blocks', () => {
  assert.equal(hasMermaid('```mermaid\ngraph TD; A-->B;\n```'), true);
  assert.equal(hasMermaid('text\n```mermaid\ngraph TD;\n```'), true);
  assert.equal(hasMermaid('```ts\nconst a = 1;\n```'), false);
  assert.equal(hasMermaid('inline ```mermaid is not a fence'), false);
});
