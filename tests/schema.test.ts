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
  role: 'first' as const,
  doi: '10.1038/s41598-024-71700-z',
  date: '2024-09-01',
};

test('publication accepts a valid entry', () => {
  assert.equal(publicationSchema.safeParse(paper).success, true);
});

test('publication rejects a missing doi', () => {
  const { doi, ...rest } = paper;
  const result = publicationSchema.safeParse(rest);
  assert.equal(result.success, false);
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
