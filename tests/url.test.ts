import test from 'node:test';
import assert from 'node:assert/strict';
import { withBase, stripBase } from '../src/lib/url.ts';

test('withBase returns the site root for an empty path', () => {
  assert.equal(withBase('', '/cv'), '/cv/');
  assert.equal(withBase('/', '/cv'), '/cv/');
});

test('withBase adds a trailing slash to routes', () => {
  assert.equal(withBase('publications', '/cv'), '/cv/publications/');
  assert.equal(withBase('/about/zh', '/cv'), '/cv/about/zh/');
});

test('withBase keeps file extensions unslashed', () => {
  assert.equal(withBase('rss.xml', '/cv'), '/cv/rss.xml');
  assert.equal(withBase('favicon.svg', '/cv'), '/cv/favicon.svg');
});

test('withBase preserves query strings and hashes', () => {
  assert.equal(withBase('blog?tag=astro', '/cv'), '/cv/blog/?tag=astro');
  assert.equal(withBase('about#cv', '/cv'), '/cv/about/#cv');
});

test('withBase handles a root deployment', () => {
  assert.equal(withBase('work', ''), '/work/');
});

test('stripBase returns the site root and inner paths', () => {
  assert.equal(stripBase('/cv', '/cv'), '/');
  assert.equal(stripBase('/cv/about/zh/', '/cv'), '/about/zh/');
});

test('stripBase leaves unrelated paths untouched', () => {
  assert.equal(stripBase('/other/page', '/cv'), '/other/page');
});
