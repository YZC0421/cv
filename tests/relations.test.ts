import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRelations } from '../src/lib/relations.ts';

const pub = (over: Record<string, unknown> = {}) =>
  ({
    id: 'paper',
    data: { doi: '10.1/x', relatedWork: [], ...over },
  }) as any;

const work = (over: Record<string, unknown> = {}) =>
  ({
    id: 'project',
    data: { relatedPublications: [], ...over },
  }) as any;

test('validateRelations accepts resolvable references', () => {
  assert.deepEqual(
    validateRelations(
      [pub({ relatedWork: ['project'] })],
      [work({ relatedPublications: ['10.1/x'] })]
    ),
    []
  );
});

test('validateRelations reports missing work slugs', () => {
  const errors = validateRelations([pub({ relatedWork: ['missing'] })], [work()]);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!, /relatedWork "missing" not found/);
});

test('validateRelations reports missing dois', () => {
  const errors = validateRelations([pub()], [work({ relatedPublications: ['10.9/x'] })]);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!, /relatedPublications "10\.9\/x" not found/);
});
