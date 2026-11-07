### 任务 2：内容 schema 与排序规则（TDD）

**文件：**
- 创建：`src/lib/schema.ts`、`src/lib/publications.ts`、`src/lib/format.ts`、`src/content.config.ts`
- 测试：`tests/schema.test.ts`、`tests/publications.test.ts`、`tests/format.test.ts`

- [ ] **步骤 1：写失败的 schema 测试**

`tests/schema.test.ts`：

```ts
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
```

- [ ] **步骤 2：运行测试确认失败**

运行：`npm test`
预期：FAIL，报错 `Cannot find module '../src/lib/schema.ts'`。

- [ ] **步骤 3：写 `src/lib/schema.ts`**

```ts
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');
const month = z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM');

export const publicationSchema = z.object({
  title: z.string().min(1),
  authors: z.array(z.string().min(1)).min(1),
  venue: z.string().min(1),
  venueShort: z.string().optional(),
  year: z.number().int().min(2000).max(2100),
  type: z.enum(['journal', 'conference']),
  indexing: z.enum(['Q1', 'Q2', 'Q3', 'Q4', 'EI', 'none']).default('none'),
  role: z.enum(['first', 'second', 'third', 'other']),
  doi: z.string().min(3),
  url: z.string().url().optional(),
  bibtex: z.string().optional(),
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
    cover: z.string().optional(),
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
  tags: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1).max(160),
  draft: z.boolean().default(false),
});

export const pageSchema = z.object({
  title: z.string().min(1),
  updated: isoDate,
});

export type Publication = z.infer<typeof publicationSchema>;
export type Work = z.infer<typeof workSchema>;
export type BlogPost = z.infer<typeof blogSchema>;
```

- [ ] **步骤 4：运行测试确认通过**

运行：`npm test`
预期：6 个测试全部 PASS。

- [ ] **步骤 5：写失败的选择规则测试**

`tests/publications.test.ts`：

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { sortPublications, selectHomepage } from '../src/lib/publications.ts';

const make = (over: Record<string, unknown>) => ({
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
```

- [ ] **步骤 6：运行测试确认失败**

运行：`npm test`
预期：FAIL，`Cannot find module '../src/lib/publications.ts'`。

- [ ] **步骤 7：写 `src/lib/publications.ts`**

```ts
import type { CollectionEntry } from 'astro:content';

type Pub = CollectionEntry<'publications'>;

const roleRank: Record<string, number> = { first: 0, second: 1, third: 2, other: 3 };

export function sortPublications<T extends Pub>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const byDate = b.data.date.localeCompare(a.data.date);
    if (byDate !== 0) return byDate;
    return (roleRank[a.data.role] ?? 3) - (roleRank[b.data.role] ?? 3);
  });
}

export function selectHomepage<T extends Pub>(items: T[], limit = 3): T[] {
  const chosen: T[] = [];
  const take = (list: T[]) => {
    for (const item of list) {
      if (chosen.length >= limit) break;
      if (!chosen.some((c) => c.id === item.id)) chosen.push(item);
    }
  };
  const sorted = sortPublications(items);
  take(sorted.filter((p) => p.data.selected));
  take(sorted.filter((p) => p.data.role === 'first'));
  take(sorted);
  return chosen.slice(0, limit);
}
```

- [ ] **步骤 8：写 `src/lib/format.ts` 与测试**

`tests/format.test.ts`：

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { boldSelf, toBibtex } from '../src/lib/format.ts';

test('boldSelf wraps the configured name only', () => {
  assert.equal(
    boldSelf(['Zicong Yang', 'A. Other'], 'Zicong Yang'),
    '<strong>Zicong Yang</strong>, A. Other'
  );
});

test('toBibtex produces an article entry with doi and year', () => {
  const bib = toBibtex({
    title: 'A paper',
    authors: ['Zicong Yang', 'A. Other'],
    venue: 'Scientific Reports',
    year: 2024,
    doi: '10.1038/s41598-024-71700-z',
    type: 'journal',
  });
  assert.match(bib, /@article\{/);
  assert.match(bib, /doi = \{10\.1038\/s41598-024-71700-z\}/);
  assert.match(bib, /year = \{2024\}/);
});
```

`src/lib/format.ts`：

```ts
export function boldSelf(authors: string[], self = 'Zicong Yang'): string {
  return authors
    .map((name) => (name.trim() === self ? `<strong>${name}</strong>` : name))
    .join(', ');
}

export function toBibtex(input: {
  title: string;
  authors: string[];
  venue: string;
  year: number;
  doi: string;
  type: 'journal' | 'conference';
}): string {
  const key = `${input.authors[0]?.split(' ').pop() ?? 'anon'}${input.year}`;
  const kind = input.type === 'journal' ? 'article' : 'inproceedings';
  const venueField = input.type === 'journal' ? 'journal' : 'booktitle';
  return `@${kind}{${key},
  author = {${input.authors.join(' and ')}},
  title = {${input.title}},
  ${venueField} = {${input.venue}},
  year = {${input.year}},
  doi = {${input.doi}}
}`;
}
```

运行：`npm test`
预期：全部 PASS。

- [ ] **步骤 9：写 `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { publicationSchema, workSchema, blogSchema, pageSchema } from './lib/schema';

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: publicationSchema,
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: workSchema,
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: blogSchema,
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: pageSchema,
});

export const collections = { publications, work, blog, pages };
```

- [ ] **步骤 10：Commit**

```bash
git add src/lib src/content.config.ts tests/ package.json package-lock.json
git commit -m "feat: 定义内容 schema 与论文排序规则"
```

---

