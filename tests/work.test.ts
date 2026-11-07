import test from 'node:test';
import assert from 'node:assert/strict';
import { sortExperience, sortProjects, sortWork, workTitleMap } from '../src/lib/work.ts';

const make = (over: Record<string, unknown> = {}) =>
  ({
    id: over.id ?? 'x',
    data: { title: 'T', order: 0, start: '2024-01', ...over },
  }) as any;

test('sortProjects orders by order ascending, then id', () => {
  const first = make({ id: 'z', order: 1 });
  const secondA = make({ id: 'a', order: 2 });
  const secondB = make({ id: 'b', order: 2 });
  assert.deepEqual(
    sortProjects([secondB, secondA, first]).map((item) => item.id),
    ['z', 'a', 'b']
  );
});

test('sortWork orders by start descending, then id', () => {
  const a = make({ id: 'a', start: '2023-01' });
  const b = make({ id: 'b', start: '2025-01' });
  const c = make({ id: 'c', start: '2025-01' });
  assert.deepEqual(
    sortWork([a, b, c]).map((item) => item.id),
    ['b', 'c', 'a']
  );
});

test('sortExperience matches the sortWork ordering', () => {
  const a = make({ id: 'a', start: '2023-01' });
  const b = make({ id: 'b', start: '2024-01' });
  assert.deepEqual(
    sortExperience([a, b]).map((item) => item.id),
    ['b', 'a']
  );
});

test('workTitleMap maps ids to titles', () => {
  const item = make({ id: 'project', title: 'A Project' });
  assert.deepEqual(workTitleMap([item]), { project: 'A Project' });
});
