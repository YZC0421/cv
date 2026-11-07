import test from 'node:test';
import assert from 'node:assert/strict';
import { sortPublications, selectHomepage } from '../src/lib/publications.ts';

const make = (over: Record<string, unknown>) =>
  ({
    id: String(over.id ?? Math.random()),
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

test('selectHomepage prefers selected, then first author, then newest', () => {
  const selected = make({ id: 'sel', selected: true, date: '2020-01-01' });
  const first = make({ id: 'first', role: 'first', date: '2025-01-01' });
  const newestOther = make({ id: 'new', date: '2025-06-01' });
  const old = make({ id: 'old', date: '2019-01-01' });
  const result = selectHomepage([selected, first, newestOther, old]);
  assert.deepEqual(result.map((p: any) => p.id), ['sel', 'first', 'new']);
});

test('selectHomepage returns all entries when fewer than three', () => {
  const one = make({ id: 'one' });
  assert.equal(selectHomepage([one]).length, 1);
});
