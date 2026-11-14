import { z } from 'zod';
import { areaSlugs, subtopicSlugs } from './topics';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');
const month = z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM');
const topic = z.enum(subtopicSlugs);
const area = z.enum(areaSlugs);

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
  area: area,
  topics: z.array(topic).min(1),
  doi: z.string().min(3).optional(),
  url: z.string().url().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  articleNumber: z.string().optional(),
  relatedWork: z.array(z.string()).default([]),
  selected: z.boolean().default(false),
  date: isoDate.optional(),
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
    zh: z
      .object({
        title: z.string().min(1).max(80).optional(),
        summary: z.string().min(1).max(200).optional(),
        highlights: z.array(z.string().min(1)).optional(),
      })
      .optional(),
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

export const blogCategories = [
  'ai-agent',
  'llm-engineering',
  'ai-application',
  'software-engineering',
  'data-science',
  'time-series',
  'paper-reading',
  'notes',
] as const;

export const changelogEntrySchema = z.object({
  date: isoDate,
  note: z.string().min(1).max(200),
});

export const blogSchema = z
  .object({
    title: z.string().min(1),
    date: isoDate,
    updated: isoDate.optional(),
    reviewed: isoDate.optional(),
    lang: z.enum(['en', 'zh']),
    category: z.enum(blogCategories).default('notes'),
    tags: z
      .array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'tag must be kebab-case'))
      .min(1),
    summary: z.string().min(1).max(160),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    changelog: z.array(changelogEntrySchema).default([]),
    /** Publication id or DOI this note is about. Validated at build time. */
    paper: z.string().min(3).optional(),
    /** Slug of the post this one translates, in the other language. */
    translationOf: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'translationOf must be a kebab-case slug')
      .optional(),
  })
  .superRefine((post, ctx) => {
    if (post.updated && post.updated < post.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['updated'],
        message: 'updated must not be earlier than date',
      });
    }
    const lastChange = post.updated ?? post.date;
    if (post.reviewed && post.reviewed < lastChange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reviewed'],
        message: 'reviewed must not be earlier than updated',
      });
    }
    let previous = post.date;
    post.changelog.forEach((entry, index) => {
      if (entry.date < previous) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['changelog', index, 'date'],
          message: 'changelog entries must be in chronological order',
        });
      }
      previous = entry.date;
    });
  });

export const projectCategories = [
  'ai-agent',
  'ai-application',
  'enterprise-software',
  'data-intelligence',
  'research',
] as const;

export const projectZhSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  summary: z.string().min(1).max(220).optional(),
  goal: z.string().optional(),
  architecture: z.string().optional(),
  role: z.string().optional(),
  results: z.string().optional(),
  todo: z.array(z.string()).optional(),
});

export const projectSchema = z.object({
  title: z.string().min(1),
  category: z.enum(projectCategories),
  summary: z.string().min(1).max(220),
  zh: projectZhSchema.optional(),
  status: z.enum(['complete', 'ongoing', 'planned']).default('complete'),
  period: z.string().optional(),
  stack: z.array(z.string()).default([]),
  links: z
    .array(z.object({ label: z.string().min(1), url: z.string().url() }))
    .default([]),
  cover: z.string().optional(),
  goal: z.string().optional(),
  architecture: z.string().optional(),
  role: z.string().optional(),
  results: z.string().optional(),
  todo: z.array(z.string()).default([]),
  /** Internal project: listed with a Private badge, details withheld from public pages. */
  private: z.boolean().default(false),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const pageSchema = z.object({
  title: z.string().min(1),
  updated: isoDate,
  summary: z.string().min(1).max(200).optional(),
});

export type Publication = z.infer<typeof publicationSchema>;
export type Work = z.infer<typeof workSchema>;
export type BlogPost = z.infer<typeof blogSchema>;
