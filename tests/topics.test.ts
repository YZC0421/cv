import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areaOfSubtopic,
  areaSlugs,
  researchAreas,
  subtopicName,
  subtopicSlugs,
} from '../src/lib/topics.ts';

test('area and subtopic slugs are unique', () => {
  assert.equal(new Set(areaSlugs).size, areaSlugs.length);
  assert.equal(new Set(subtopicSlugs).size, subtopicSlugs.length);
});

test('every subtopic belongs to exactly one area', () => {
  for (const slug of subtopicSlugs) {
    const owners = researchAreas.filter((area) =>
      area.subtopics.some((sub) => sub.slug === slug)
    );
    assert.equal(owners.length, 1, slug);
    assert.equal(areaOfSubtopic(slug), owners[0]!.slug);
  }
});

test('subtopic counts match the merged structure', () => {
  const counts = researchAreas.map((area) => area.subtopics.length);
  assert.deepEqual(counts, [3, 2, 1]);
});

test('merged subtopics are registered', () => {
  assert.equal(
    subtopicName('spatio-temporal-multiscale'),
    'Spatio-Temporal Representation Learning and Multiscale Feature Fusion'
  );
  assert.equal(
    subtopicName('predictive-data-driven'),
    'Predictive Modeling and Data-Driven Decision Making'
  );
});

test('subtopicName resolves known slugs and falls back to the slug', () => {
  assert.equal(subtopicName('ecg-classification'), 'ECG Classification and Arrhythmia Detection');
  assert.equal(subtopicName('unknown' as never), 'unknown');
});
