import test from 'node:test';
import assert from 'node:assert/strict';
import { sortPublications, selectHomepage } from '../src/lib/publications.ts';

const make = (over: Record<string, unknown>) =>
  ({
    id: String(over.id ?? 'x'),
    data: {
      title: 'T',
      authors: ['Zicong Yang'],
      venue: 'V',
      year: 2024,
      type: 'journal',
      indexing: 'Q1',
      role: 'other',
      doi: '10.1/x',
      selected: false,
      date: '2024-01-01',
      ...over,
    },
  }) as any;

test('sortPublications orders by date desc, then role rank', () => {
  const a = make({ id: 'a', date: '2024-01-01' });
  const b = make({ id: 'b', date: '2025-01-01' });
  const c = make({ id: 'c', date: '2025-01-01', role: 'first' });
  assert.deepEqual(sortPublications([a, b, c]).map((p: any) => p.id), ['c', 'b', 'a']);
});

test('selectHomepage lists JCR papers first, then first-author EI', () => {
  const q1Third = make({ id: 'q1-third', indexing: 'Q1', role: 'third', date: '2025-01-01' });
  const q4First = make({ id: 'q4-first', indexing: 'Q4', role: 'first', date: '2024-01-01' });
  const eiFirst = make({ id: 'ei-first', indexing: 'EI', role: 'first', date: '2024-06-01' });
  const eiSecond = make({ id: 'ei-second', indexing: 'EI', role: 'second', date: '2025-01-01' });
  const noneFirst = make({ id: 'none-first', indexing: 'none', role: 'first', date: '2025-01-01' });

  const result = selectHomepage([q4First, q1Third, eiFirst, eiSecond, noneFirst]);
  assert.deepEqual(
    result.map((pub: any) => pub.id),
    ['q1-third', 'q4-first', 'ei-first']
  );
});

test('selectHomepage orders JCR by quartile, then author role, then date', () => {
  const q1Other = make({ id: 'q1-other', indexing: 'Q1', role: 'other', date: '2025-01-01' });
  const q1First = make({ id: 'q1-first', indexing: 'Q1', role: 'first', date: '2023-01-01' });
  const q2First = make({ id: 'q2-first', indexing: 'Q2', role: 'first', date: '2026-01-01' });

  const result = selectHomepage([q1Other, q1First, q2First]);
  assert.deepEqual(
    result.map((pub: any) => pub.id),
    ['q1-first', 'q1-other', 'q2-first']
  );
});

test('sortPublications falls back to id for identical date and role', () => {
  const b = make({ id: 'b', date: '2024-01-01' });
  const a = make({ id: 'a', date: '2024-01-01' });
  assert.deepEqual(
    sortPublications([b, a]).map((pub: any) => pub.id),
    ['a', 'b']
  );
});

test('selectHomepage returns only JCR and first-author EI entries', () => {
  const one = make({ id: 'one', indexing: 'EI', role: 'first' });
  const other = make({ id: 'other', indexing: 'EI', role: 'second' });
  assert.deepEqual(
    selectHomepage([one, other]).map((pub: any) => pub.id),
    ['one']
  );
});
