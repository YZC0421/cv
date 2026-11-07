import { z } from 'zod';
import { topicSlugs } from './topics';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');
const month = z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM');
const topic = z.enum(topicSlugs);

export const publicationSchema = z.object({
  title: z.string().min(1),
  authors: z.array(z.string().min(1)).min(1),
  venue: z.string().min(1),
  venueShort: z.string().optional(),
  year: z.number().int().min(2000).max(2100),
  type: z.enum(['journal', 'conference']),
  indexing: z.enum(['Q1', 'Q2', 'Q3', 'Q4', 'EI', 'none']).default('none'),
  role: z.enum(['first', 'second', 'third', 'other']),
  authorNote: z.string().max(40).optional(),
  topics: z.array(topic).min(1),
  doi: z.string().min(3),
  url: z.string().url().optional(),
  volume: z.string().optional(),
  pages: z.string().optional(),
  relatedWork: z.array(z.string()).default([]),
  selected: z.boolean().default(false),
  date: isoDate,
});

export const workSchema = z
  .object({
    title: z.string().min(1),
    org: z.string().min(1),
    kind: z.enum(['experience', 'project']),
    role: z.string().min(1),
    start: month,
    end: z.union([month, z.literal('present')]),
    summary: z.string().min(1).max(200),
    stack: z.array(z.string()).default([]),
    links: z
      .array(z.object({ label: z.string().min(1), url: z.string().url() }))
      .default([]),
    topics: z.array(topic).default([]),
    problem: z.string().max(600).optional(),
    approach: z.string().max(600).optional(),
    results: z.string().max(600).optional(),
    relatedPublications: z.array(z.string()).default([]),
    highlights: z.array(z.string().min(1)).min(1),
    order: z.number().int().default(0),
  })
  .refine((w) => w.end === 'present' || w.start <= w.end, {
    message: 'start must not be later than end',
    path: ['end'],
  });

export const blogSchema = z.object({
  title: z.string().min(1),
  date: isoDate,
  lang: z.enum(['en', 'zh']),
  tags: z
    .array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'tag must be kebab-case'))
    .min(1),
  summary: z.string().min(1).max(160),
  draft: z.boolean().default(false),
});

export const pageSchema = z.object({
  title: z.string().min(1),
  updated: isoDate,
  summary: z.string().min(1).max(200).optional(),
});

export type Publication = z.infer<typeof publicationSchema>;
export type Work = z.infer<typeof workSchema>;
export type BlogPost = z.infer<typeof blogSchema>;
