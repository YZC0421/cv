### 任务 1：主题模型、schema 与内容字段迁移

**文件：**
- 创建：`src/lib/topics.ts`、`src/lib/relations.ts`、`tests/topics.test.ts`、`tests/relations.test.ts`、`scripts/fetch-bib-meta.mjs`
- 修改：`src/lib/schema.ts`、`src/content/publications/*.md`（6 个）、`src/content/work/*.md`（9 个）

- [ ] **步骤 1：写 `src/lib/topics.ts`**

```ts
export const topicSlugs = ['medical-signal', 'industrial-vision'] as const;

export type TopicSlug = (typeof topicSlugs)[number];

export const topics: { slug: TopicSlug; name: string; blurb: string }[] = [
  {
    slug: 'medical-signal',
    name: 'Medical Signal Processing',
    blurb: 'ECG arrhythmia detection and cardiac risk modelling with multiscale deep networks.',
  },
  {
    slug: 'industrial-vision',
    name: 'Industrial Visual Inspection',
    blurb: 'Defect detection and lightweight deployment for manufacturing and agriculture.',
  },
];

export function topicName(slug: TopicSlug): string {
  return topics.find((topic) => topic.slug === slug)?.name ?? slug;
}
```

- [ ] **步骤 2：写失败的测试**

`tests/topics.test.ts`：

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { topicName, topicSlugs, topics } from '../src/lib/topics.ts';

test('topic slugs are unique and non-empty', () => {
  assert.equal(new Set(topicSlugs).size, topicSlugs.length);
  assert.ok(topicSlugs.every((slug) => slug.length > 0));
});

test('every topic has a name and blurb', () => {
  assert.ok(topics.every((topic) => topic.name.length > 0 && topic.blurb.length > 0));
});

test('topicName resolves known slugs and falls back to the slug', () => {
  assert.equal(topicName('medical-signal'), 'Medical Signal Processing');
  assert.equal(topicName('unknown' as never), 'unknown');
});
```

`tests/relations.test.ts`：

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRelations } from '../src/lib/relations.ts';

const pub = (over: Record<string, unknown> = {}) => ({
  id: 'paper',
  data: { doi: '10.1/x', relatedWork: [], ...over },
}) as any;

const work = (over: Record<string, unknown> = {}) => ({
  id: 'project',
  data: { relatedPublications: [], ...over },
}) as any;

test('validateRelations accepts resolvable references', () => {
  assert.deepEqual(
    validateRelations([pub({ relatedWork: ['project'] })], [work({ relatedPublications: ['10.1/x'] })]),
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
```

- [ ] **步骤 3：运行测试确认失败**

运行：`npm test`
预期：FAIL，`Cannot find module '../src/lib/topics.ts'` 与 `relations.ts`。

- [ ] **步骤 4：写 `src/lib/relations.ts`**

```ts
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';

type Pub = CollectionEntry<'publications'>;
type Work = CollectionEntry<'work'>;

export async function assertRelations(): Promise<void> {
  const [publications, work] = await Promise.all([
    getCollection('publications'),
    getCollection('work'),
  ]);
  const errors = validateRelations(publications, work);
  if (errors.length > 0) {
    throw new Error(`Content relations are invalid:\n${errors.join('\n')}`);
  }
}

export function validateRelations(publications: Pub[], work: Work[]): string[] {
  const workIds = new Set(work.map((item) => item.id));
  const dois = new Set(publications.map((pub) => pub.data.doi));
  const errors: string[] = [];

  for (const pub of publications) {
    for (const slug of pub.data.relatedWork ?? []) {
      if (!workIds.has(slug)) {
        errors.push(`publications/${pub.id}.md: relatedWork "${slug}" not found`);
      }
    }
  }

  for (const item of work) {
    for (const doi of (item.data as { relatedPublications?: string[] }).relatedPublications ?? []) {
      if (!dois.has(doi)) {
        errors.push(`work/${item.id}.md: relatedPublications "${doi}" not found`);
      }
    }
  }

  return errors;
}
```

- [ ] **步骤 5：修改 `src/lib/schema.ts`**

```ts
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
  tags: z.array(z.string().min(1)).min(1),
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
```

- [ ] **步骤 6：运行测试确认通过**

运行：`npm test`
预期：全部 PASS（含新增 6 条）。

- [ ] **步骤 7：写 `scripts/fetch-bib-meta.mjs` 并拉取卷期**

```js
const targets = [
  { file: 'scientific-reports-2024', doi: '10.1038/s41598-024-71700-z' },
  { file: 'cisse-2024', doi: '10.1007/978-3-031-57037-7_7' },
  { file: 'mst-2025', doi: '10.1088/1361-6501/ae10d3' },
  { file: 'cvidl-2024-wheat', doi: '10.1109/cvidl62147.2024.10604082' },
  { file: 'cvidl-2024-garbage', doi: '10.1109/cvidl62147.2024.10604280' },
  { file: 'ipmlp-2024', doi: '10.1145/3700906.3700946' },
];

for (const target of targets) {
  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(target.doi)}`, {
    headers: { 'User-Agent': 'cv-site-build/1.0 (mailto:402641915@qq.com)' },
  });
  if (!res.ok) {
    console.log(`${target.file}: fetch failed (${res.status})`);
    continue;
  }
  const { message } = await res.json();
  console.log(
    `${target.file}: volume=${message.volume ?? ''} pages=${message.page ?? ''}`
  );
}
```

运行：`node scripts/fetch-bib-meta.mjs`
预期：逐行输出卷号与页码；抓取失败的条目不填。

- [ ] **步骤 8：迁移 6 篇论文 frontmatter**

每篇补 `topics`，按规格：

| 文件 | topics | authorNote |
| --- | --- | --- |
| `scientific-reports-2024.md` | `["medical-signal"]` | 不填 |
| `cisse-2024.md` | `["medical-signal"]` | 不填 |
| `mst-2025.md` | `["industrial-vision"]` | `"Student 3rd author"` |
| `cvidl-2024-wheat.md` | `["industrial-vision"]` | 不填 |
| `cvidl-2024-garbage.md` | `["industrial-vision"]` | `"Student 2nd author"` |
| `ipmlp-2024.md` | `["industrial-vision"]` | `"Student 4th author"` |

同时：删除所有 `bibtex:` 行（若存在）；按步骤 7 输出补 `volume`/`pages`；`scientific-reports-2024.md` 加 `relatedWork: ["sudden-cardiac-death-prediction"]`，`mst-2025.md` 加 `relatedWork: ["guangzhou-xiyang"]`（扩散模型缺陷检测与线缆检测同属工业视觉线）。

- [ ] **步骤 9：迁移 9 条 work 的 topics**

| 文件 | topics |
| --- | --- |
| `guangzhou-xiyang.md` | `["industrial-vision"]` |
| `ningbo-haizhimingshi.md` | `["industrial-vision"]` |
| `ningbo-jiasi.md` | `[]` |
| `guangzhou-chuzhong.md` | `[]` |
| `campus-startup.md` | `[]` |
| `sudden-cardiac-death-prediction.md` | `["medical-signal"]`，并加 `relatedPublications: ["10.1038/s41598-024-71700-z"]` |
| `wordle-analysis.md` | `[]` |
| `coca-cola-consumer-analysis.md` | `[]` |
| `rural-revitalization.md` | `[]` |

删除所有 `cover:` 行（若存在）。

- [ ] **步骤 10：接入构建期校验并验证**

在 `src/pages/index.astro` 顶部加入：

```ts
import { assertRelations } from '../lib/relations';

await assertRelations();
```

运行：`npm run check && npm run build`
预期：0 errors，构建成功。若报 `topics` 缺失或非法，按提示修正对应文件；若报 `Content relations are invalid`，修正对应 `relatedWork` / `relatedPublications`。

- [ ] **步骤 11：Commit**

```bash
git add src/lib src/content scripts/fetch-bib-meta.mjs tests/
git commit -m "feat: 增加研究主题与位次字段"
```

---

