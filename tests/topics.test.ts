import test from 'node:test';
import assert from 'node:assert/strict';
import { topicName, topicSlugs, topics } from '../src/lib/topics.ts';

test('topic slugs are unique and non-empty', () => {
  assert.equal(new Set(topicSlugs).size, topicSlugs.length);
  assert.ok(topicSlugs.every((slug) => slug.length > 0));
});

test('every topic has a name and blurb', () => {
  assert.ok(topics.every((topic) => topic.name.length > 0 && topic.blurb.length > 0));
});

test('topicName resolves known slugs and falls back to the slug', () => {
  assert.equal(topicName('medical-signal'), 'Medical Signal Processing');
  assert.equal(topicName('unknown' as never), 'unknown');
});
