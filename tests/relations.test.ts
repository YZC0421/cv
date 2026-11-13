import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBlogPapers, validateRelations } from '../src/lib/relations.ts';

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

test('validateBlogPapers accepts resolvable references and reports missing ones', () => {
  assert.deepEqual(validateBlogPapers([{ id: 'note', data: { paper: '10.1/x' } }], [pub()]), []);
  assert.deepEqual(
    validateBlogPapers([{ id: 'note', data: { paper: 'missing' } }], [pub()]),
    ['blog/note.md: paper "missing" not found']
  );
  assert.deepEqual(validateBlogPapers([{ id: 'note', data: {} }], [pub()]), []);
});
