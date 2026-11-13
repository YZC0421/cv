import test from 'node:test';
import assert from 'node:assert/strict';
import { isInternal, resolveTarget } from '../scripts/check-links.mjs';

test('isInternal accepts base-relative URLs only', () => {
  assert.equal(isInternal('/cv/blog/', '/cv'), true);
  assert.equal(isInternal('/cv', '/cv'), true);
  assert.equal(isInternal('/cv/rss.xml', '/cv'), true);
  assert.equal(isInternal('https://doi.org/10.1/x', '/cv'), false);
  assert.equal(isInternal('mailto:a@b.c', '/cv'), false);
  assert.equal(isInternal('//cdn.example.com/x.js', '/cv'), false);
  assert.equal(isInternal('/other/page/', '/cv'), false);
});

test('resolveTarget maps routes and files', () => {
  assert.equal(resolveTarget('/cv/blog/foo/', '/cv'), 'blog/foo/index.html');
  assert.equal(resolveTarget('/cv/rss.xml', '/cv'), 'rss.xml');
  assert.equal(resolveTarget('/cv/', '/cv'), 'index.html');
  assert.equal(resolveTarget('/cv', '/cv'), 'index.html');
  assert.equal(resolveTarget('/cv/_astro/app.css', '/cv'), '_astro/app.css');
  assert.equal(resolveTarget('/cv/blog/foo/?q=1#top', '/cv'), 'blog/foo/index.html');
});

test('resolveTarget treats extensionless routes as directories', () => {
  assert.equal(resolveTarget('/cv/blog/foo', '/cv'), 'blog/foo/index.html');
});
