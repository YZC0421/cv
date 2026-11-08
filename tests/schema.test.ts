import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationSchema, workSchema, blogSchema } from '../src/lib/schema.ts';

const paper = {
  title: 'A paper',
  authors: ['Zicong Yang', 'Someone Else'],
  venue: 'Scientific Reports',
  year: 2024,
  type: 'journal' as const,
  indexing: 'Q1' as const,
  area: 'biomedical-signal' as const,
  role: 'first' as const,
  topics: ['ecg-classification'],
  doi: '10.1038/s41598-024-71700-z',
  date: '2024-09-01',
};

test('publication accepts a valid entry', () => {
  assert.equal(publicationSchema.safeParse(paper).success, true);
});

test('publication accepts an entry without a doi', () => {
  const { doi, ...rest } = paper;
  const result = publicationSchema.safeParse(rest);
  assert.equal(result.success, true);
});

test('publication rejects a year below 2000', () => {
  assert.equal(publicationSchema.safeParse({ ...paper, year: 1999 }).success, false);
});

test('work rejects start later than end', () => {
  const job = {
    title: 'Software Engineer',
    org: 'Acme',
    kind: 'experience' as const,
    role: 'Engineer',
    start: '2025-09',
    end: '2025-01',
    summary: 'Built things.',
    highlights: ['Did work'],
  };
  assert.equal(workSchema.safeParse(job).success, false);
});

test('work accepts present as end', () => {
  const job = {
    title: 'Software Engineer',
    org: 'Acme',
    kind: 'experience' as const,
    role: 'Engineer',
    start: '2025-09',
    end: 'present',
    summary: 'Built things.',
    highlights: ['Did work'],
  };
  assert.equal(workSchema.safeParse(job).success, true);
});

test('blog rejects summary longer than 160 chars', () => {
  const post = {
    title: 'Post',
    date: '2026-01-01',
    lang: 'zh' as const,
    tags: ['astro'],
    summary: 'x'.repeat(161),
  };
  assert.equal(blogSchema.safeParse(post).success, false);
});

test('publication rejects empty authors', () => {
  assert.equal(publicationSchema.safeParse({ ...paper, authors: [] }).success, false);
});

test('publication rejects a year above 2100', () => {
  assert.equal(publicationSchema.safeParse({ ...paper, year: 2101 }).success, false);
});

test('publication rejects an invalid date format', () => {
  assert.equal(publicationSchema.safeParse({ ...paper, date: '2024/09/01' }).success, false);
});

test('publication ignores unknown frontmatter fields', () => {
  const result = publicationSchema.safeParse({ ...paper, unknownField: 'ignored' });
  assert.equal(result.success, true);
  assert.equal('unknownField' in (result.success ? result.data : {}), false);
});

test('publication rejects missing topics', () => {
  const { topics, ...rest } = paper;
  assert.equal(publicationSchema.safeParse(rest).success, false);
});

test('publication rejects an empty topics list', () => {
  assert.equal(publicationSchema.safeParse({ ...paper, topics: [] }).success, false);
});

test('publication rejects an authorNote longer than 40 characters', () => {
  assert.equal(
    publicationSchema.safeParse({ ...paper, authorNote: 'x'.repeat(41) }).success,
    false
  );
});

test('work rejects a problem statement longer than 600 characters', () => {
  const job = {
    title: 'Project',
    org: 'Lab',
    kind: 'project' as const,
    role: 'Lead',
    start: '2024-01',
    end: '2024-06',
    summary: 'Short summary.',
    highlights: ['A highlight'],
    problem: 'x'.repeat(601),
  };
  assert.equal(workSchema.safeParse(job).success, false);
});
