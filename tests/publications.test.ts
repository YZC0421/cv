import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findPublication,
  notesByPublication,
  selectHomepage,
  sortPaperReading,
  sortPublications,
} from '../src/lib/publications.ts';

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

test('findPublication resolves by id, doi and doi URL', () => {
  const pubs = [make({ id: 'jpcs-2026-csddnet', doi: '10.1/x' })];
  assert.equal(findPublication(pubs, 'jpcs-2026-csddnet')?.id, 'jpcs-2026-csddnet');
  assert.equal(findPublication(pubs, '10.1/x')?.id, 'jpcs-2026-csddnet');
  assert.equal(findPublication(pubs, 'https://doi.org/10.1/x')?.id, 'jpcs-2026-csddnet');
  assert.equal(findPublication(pubs, 'missing'), undefined);
});

test('notesByPublication groups notes under their resolved paper', () => {
  const pubs = [make({ id: 'p1', doi: '10.1/x' }), make({ id: 'p2', doi: '10.2/y' })];
  const posts = [
    { id: 'n1', data: { paper: '10.1/x' } },
    { id: 'n2', data: { paper: 'p2' } },
    { id: 'n3', data: { paper: 'missing' } },
    { id: 'n4', data: {} },
  ] as any;
  const notes = notesByPublication(posts, pubs);
  assert.deepEqual(notes.get('p1')?.map((post: any) => post.id), ['n1']);
  assert.deepEqual(notes.get('p2')?.map((post: any) => post.id), ['n2']);
  assert.equal(notes.size, 2);
});

test('sortPaperReading orders by publication year, then post date', () => {
  const pubs = [
    make({ id: 'old', year: 2023 }),
    make({ id: 'new', year: 2026 }),
  ];
  const posts = [
    { id: 'a', data: { paper: 'old', date: '2026-01-01' } },
    { id: 'b', data: { paper: 'new', date: '2026-01-01' } },
    { id: 'c', data: { date: '2026-02-01' } },
  ] as any;
  assert.deepEqual(
    sortPaperReading(posts, pubs).map((post: any) => post.id),
    ['b', 'a', 'c']
  );
});
