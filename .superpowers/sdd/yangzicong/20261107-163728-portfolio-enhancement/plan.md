# 个人学术主页增强 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 给已上线的 Astro 站点补上研究主题维度、位次信息、项目叙事结构与 CV 下载，并收敛工程重复。

**架构：** 新增 `lib/topics.ts` 作为主题单一来源；`publications` 与 `work` 增加 `topics`、`authorNote`、`problem/approach/results` 与关联引用；首页新增 Research Areas，两个列表页增加主题筛选；关联引用在构建期校验；OG 图与标签页按需静态生成。

**技术栈：** Astro 5、TypeScript、Zod、sharp（仅生图脚本）、GitHub Actions。

**规格：** `.superpowers/sdd/yangzicong/20261107-163728-portfolio-enhancement/spec.md`

**前置状态：** 上一轮实现已合并且线上可用；本计划在 `main` 之上执行，建议新开 `feat/portfolio-enhancement` 分支。

---

## 文件结构

| 路径 | 动作 | 职责 |
| --- | --- | --- |
| `src/lib/topics.ts` | 新增 | 主题 slug、显示名、定位句，唯一来源 |
| `src/lib/relations.ts` | 新增 | 论文与项目关联引用的校验 |
| `src/lib/work.ts` | 新增 | 经历与项目排序，首页与 `/work` 共用 |
| `src/lib/site.ts` | 新增 | 站点常量与 `hasCvPdf()` |
| `src/lib/schema.ts` | 修改 | 新增字段、删除 `bibtex`/`cover` |
| `src/components/ResearchAreas.astro` | 新增 | 首页研究主题区块 |
| `src/components/PublicationItem.astro` | 修改 | 位次徽标、主题徽标、Related work |
| `src/components/WorkCard.astro` | 修改 | 主题徽标与 `data-topics` |
| `src/pages/publications.astro` | 修改 | 三组筛选、查询参数、空结果提示 |
| `src/pages/work/index.astro` | 修改 | 项目主题筛选 |
| `src/pages/work/[slug].astro` | 修改 | 四段式与 Related publication |
| `src/pages/blog/tag/[tag].astro` | 新增 | 标签独立页 |
| `src/pages/blog/index.astro` | 修改 | 标签链接到标签页 |
| `src/layouts/PostLayout.astro` | 修改 | 标签链接 |
| `src/layouts/PageLayout.astro` | 修改 | CV PDF 下载与打印回退 |
| `src/layouts/BaseLayout.astro` | 修改 | OG image 与 twitter card |
| `src/pages/index.astro` | 修改 | Research Areas、CV 下载 |
| `src/content/**` | 修改 | 字段迁移与项目段落 |
| `scripts/fetch-bib-meta.mjs` | 新增 | 拉取 volume/pages 供人工填入 |
| `scripts/make-og.mjs` | 新增 | 生成 `public/og.png` |
| `scripts/verify-build.mjs` | 修改 | 新增主题、标签页、CV 断言 |
| `.github/workflows/deploy.yml` | 修改 | PR 触发与 deploy 条件 |
| `package.json` | 修改 | 精确版本、`og` 脚本、sharp |

**约定：** 站内链接一律 `withBase`；主题名只从 `lib/topics.ts` 读取；不新增运行时依赖。

---

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

### 任务 2：项目四段式内容与待补清单

**文件：**
- 修改：`src/content/work/{sudden-cardiac-death-prediction,wordle-analysis,coca-cola-consumer-analysis,rural-revitalization}.md`
- 创建：`.superpowers/sdd/yangzicong/20261107-163728-portfolio-enhancement/gaps.md`

- [ ] **步骤 1：为心源性猝死项目补三段**

在 `sudden-cardiac-death-prediction.md` 的 frontmatter 中追加（内容取自现有 highlights，不新增事实）：

```yaml
problem: "Multi-lead ECG arrhythmia detection suffers from noisy signals and weak cross-lead temporal modelling, which limits classification accuracy on public datasets."
approach: "Converted multi-lead ECG to 2D grayscale images, fused grayscale features, and designed STFAC-ECGNet with coordinated channel-spatial attention and temporal fusion."
results: "Improved classification accuracy on PTB-XL and CPSC2018, producing two first-author papers (JCR Q1 and Q4)."
```

- [ ] **步骤 2：为 Wordle 项目补两段**

```yaml
problem: "Wordle difficulty is driven by word structure, but the game had no quantitative difficulty model for scheduling or player-behaviour analysis."
approach: "Used Python corpora and machine-learning statistics on word frequency, syllables, and repeated letters, then trained a BiGRU model to predict player trends."
results: "Won the MCM Meritorious Winner award (top 7%)."
```

- [ ] **步骤 3：为可口可乐项目补两段**

```yaml
problem: "Brand teams lacked a quantitative view of consumer sentiment across a very large review corpus."
approach: "Crawled 120,756 JD.com reviews and applied BERT sentiment analysis to build word clouds and user profiles."
results: "National Third Prize in the CP Group Cup market research competition."
```

- [ ] **步骤 4：为乡村振兴项目补两段**

```yaml
problem: "Rural revitalization planning lacked data on tea yield, fertilization, and machinery power for the surveyed region."
approach: "Collected 379 questionnaires (97% valid), integrated government data, and used machine learning to predict yield, fertilization, and total machinery power."
results: "Report recognized as a National Excellent Research Report; the accompanying paper was published as a second-author CNKI-indexed article."
```

- [ ] **步骤 5：写待补清单**

`.superpowers/sdd/yangzicong/20261107-163728-portfolio-enhancement/gaps.md`：

```markdown
# 内容待补清单

以下内容无法从现有 CV 事实中确认，页面暂不渲染；提供素材后可补。

## 项目
- 心源性猝死预测：数据集规模、模型参数量、相对基线的精度提升数值。
- Wordle：参赛队伍规模、模型评估指标。
- 可口可乐调研：样本时间范围、情感极性分布。
- 乡村振兴：调研地区、预测模型的具体指标。

## 论文
- mst-2025、cvidl-2024-garbage、ipmlp-2024 的 volume/pages（Crossref 未返回时需手工补）。

## 站点
- `public/cv.pdf`（提供后 About 与首页自动出现下载按钮）。
- 项目配图（`src/assets/work/`，当前无素材）。
```

- [ ] **步骤 6：构建验证**

运行：`npm run build`
预期：成功；三个段落进入产物，未补的项目仍用 highlights 回退。

- [ ] **步骤 7：Commit**

```bash
git add src/content/work .superpowers/sdd/yangzicong/20261107-163728-portfolio-enhancement/gaps.md
git commit -m "content: 补充项目问题、方法与结果"
```

---

### 任务 3：首页 Research Areas

**文件：**
- 创建：`src/lib/work.ts`、`src/components/ResearchAreas.astro`
- 修改：`src/pages/index.astro`、`src/styles/global.css`

- [ ] **步骤 1：写 `src/lib/work.ts`**

```ts
import type { CollectionEntry } from 'astro:content';

type Work = CollectionEntry<'work'>;

export function sortProjects<T extends Work>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id)
  );
}

export function sortExperience<T extends Work>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => b.data.start.localeCompare(a.data.start) || a.id.localeCompare(b.id)
  );
}

export function sortWork<T extends Work>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => b.data.start.localeCompare(a.data.start) || a.id.localeCompare(b.id)
  );
}
```

- [ ] **步骤 2：写 `ResearchAreas.astro`**

```astro
---
import { getCollection } from 'astro:content';
import { topics } from '../lib/topics';
import { sortPublications } from '../lib/publications';
import { sortWork } from '../lib/work';
import { withBase } from '../lib/url';

const [publications, work] = await Promise.all([
  getCollection('publications'),
  getCollection('work'),
]);

const areas = topics
  .map((topic) => {
    const papers = sortPublications(
      publications.filter(
        (pub) => pub.data.topics.includes(topic.slug) && pub.data.role === 'first'
      )
    );
    const entries = sortWork(work.filter((item) => item.data.topics?.includes(topic.slug)));
    return { ...topic, paper: papers[0], entry: entries[0] };
  })
  .filter((area) => area.paper || area.entry);
---
{areas.length > 0 && (
  <section class="section container measure">
    <div class="section-head"><h2>Research Areas</h2></div>
    <div class="area-grid">
      {areas.map((area) => (
        <article class="area">
          <h3>{area.name}</h3>
          <p class="muted">{area.blurb}</p>
          <ul class="area-items">
            {area.paper && (
              <li>
                <a href={`https://doi.org/${area.paper.data.doi}`} target="_blank" rel="noopener">
                  {area.paper.data.title}
                </a>
                <span class="area-note">
                  {area.paper.data.venueShort ?? area.paper.data.venue} · {area.paper.data.year}
                </span>
              </li>
            )}
            {area.entry && (
              <li>
                <a href={withBase(`work/${area.entry.id}`)}>{area.entry.data.title}</a>
                <span class="area-note">{area.entry.data.org}</span>
              </li>
            )}
          </ul>
          <a class="area-link" href={`${withBase('publications')}?topic=${area.slug}`}>
            View all →
          </a>
        </article>
      ))}
    </div>
  </section>
)}
```

- [ ] **步骤 3：在首页插入区块**

`src/pages/index.astro`：在 `<Hero />` 之后插入 `<ResearchAreas />`，并在 frontmatter 导入。

- [ ] **步骤 4：追加样式**

```css
.area-grid { display: grid; gap: 20px; }
@media (min-width: 768px) { .area-grid { grid-template-columns: 1fr 1fr; } }
.area { border-top: 2px solid var(--accent); padding-top: 14px; }
.area h3 { font-size: 1.05rem; margin-bottom: 6px; }
.area p { margin: 0 0 12px; font-size: 0.88rem; }
.area-items { list-style: none; margin: 0 0 12px; padding: 0; font-size: 0.86rem; }
.area-items li { margin-bottom: 8px; }
.area-note { display: block; color: var(--muted); font-size: 0.76rem; }
.area-link { font-size: 0.85rem; }
```

- [ ] **步骤 5：构建并断言**

运行：
```bash
npm run build
grep -c 'class="area"' dist/index.html
grep -o 'topic=medical-signal\|topic=industrial-vision' dist/index.html | sort -u
```
预期：区块数 `2`；两个主题链接均出现。

- [ ] **步骤 6：Commit**

```bash
git add src/lib/work.ts src/components/ResearchAreas.astro src/pages/index.astro src/styles/global.css
git commit -m "feat: 首页增加研究主题区块"
```

---

### 任务 4：论文页三组筛选与徽标

**文件：**
- 修改：`src/components/PublicationItem.astro`、`src/pages/publications.astro`、`src/pages/index.astro`、`src/styles/global.css`

- [ ] **步骤 1：改造 `PublicationItem.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import BibtexButton from './BibtexButton.astro';
import { boldSelf, toBibtex } from '../lib/format';
import { topicName } from '../lib/topics';
import { withBase } from '../lib/url';

interface Props {
  pub: CollectionEntry<'publications'>;
  workTitles?: Record<string, string>;
}
const { pub, workTitles = {} } = Astro.props;
const d = pub.data;
const href = d.url ?? `https://doi.org/${d.doi}`;
const bibtex = toBibtex({
  title: d.title,
  authors: d.authors,
  venue: d.venue,
  year: d.year,
  doi: d.doi,
  type: d.type,
  volume: d.volume,
  pages: d.pages,
});
const badgeClass =
  d.indexing === 'Q1'
    ? 'badge-q1'
    : d.indexing === 'Q4'
      ? 'badge-q4'
      : d.indexing === 'EI'
        ? 'badge-ei'
        : 'badge-neutral';
const indexingLabel = d.indexing === 'EI' ? 'EI indexed' : `JCR ${d.indexing}`;
const roleLabel = d.role === 'first' ? 'First author' : (d.authorNote ?? 'Co-author');
---
<li
  class="pub-item"
  data-indexing={d.indexing}
  data-role={d.role}
  data-year={d.year}
  data-topics={d.topics.join(' ')}
>
  <a class="pub-title" href={href} target="_blank" rel="noopener">{d.title}</a>
  <div class="pub-meta"><span set:html={boldSelf(d.authors)} /></div>
  <div class="pub-meta">
    {d.indexing !== 'none' && <span class={`badge ${badgeClass}`}>{indexingLabel}</span>}
    <span class="badge badge-neutral">{roleLabel}</span>
    {d.topics.map((topic) => <span class="badge badge-topic">{topicName(topic)}</span>)}
    <span>{d.venueShort ?? d.venue} · {d.year}</span>
  </div>
  {d.relatedWork.length > 0 && (
    <div class="pub-meta">
      Related work:
      {d.relatedWork.map((slug) => (
        <a href={withBase(`work/${slug}`)}>{workTitles[slug] ?? slug}</a>
      ))}
    </div>
  )}
  <div class="pub-actions">
    <a href={`https://doi.org/${d.doi}`} target="_blank" rel="noopener" aria-label={`DOI for ${d.title}`}>DOI</a>
    <BibtexButton bibtex={bibtex} />
  </div>
</li>
```

- [ ] **步骤 2：`toBibtex` 支持卷期**

`src/lib/format.ts` 的签名与实现：

```ts
export function toBibtex(input: {
  title: string;
  authors: string[];
  venue: string;
  year: number;
  doi: string;
  type: 'journal' | 'conference';
  volume?: string;
  pages?: string;
}): string {
  const key = `${input.authors[0]?.split(' ').pop() ?? 'anon'}${input.year}`;
  const kind = input.type === 'journal' ? 'article' : 'inproceedings';
  const venueField = input.type === 'journal' ? 'journal' : 'booktitle';
  const lines = [
    `@${kind}{${key},`,
    `  author = {${input.authors.join(' and ')}},`,
    `  title = {${input.title}},`,
    `  ${venueField} = {${input.venue}},`,
    `  year = {${input.year}},`,
    ...(input.volume ? [`  volume = {${input.volume}},`] : []),
    ...(input.pages ? [`  pages = {${input.pages}},`] : []),
    `  doi = {${input.doi}}`,
    '}',
  ];
  return lines.join('\n');
}
```

补测试：`tests/format.test.ts` 增加一条断言 `volume` 与 `pages` 出现在输出中。

- [ ] **步骤 3：改造 `publications.astro` 的筛选**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PublicationItem from '../components/PublicationItem.astro';
import { getCollection } from 'astro:content';
import { sortPublications } from '../lib/publications';
import { topics } from '../lib/topics';

const pubs = sortPublications(await getCollection('publications'));
const years = [...new Set(pubs.map((pub) => pub.data.year))].sort((a, b) => b - a);
const workTitles = Object.fromEntries(
  (await getCollection('work')).map((item) => [item.id, item.data.title])
);
---
<BaseLayout title="Publications · Zicong Yang" description="Peer-reviewed publications on medical signal processing and computer vision.">
  <div class="container measure" style="padding-top:40px">
    <h1>Publications</h1>
    <p class="muted">Peer-reviewed journal and conference papers. {pubs.length} entries.</p>

    <div class="filters" role="group" aria-label="Filter publications by topic">
      <button type="button" data-group="topic" data-value="all" aria-pressed="true">All topics</button>
      {topics.map((topic) => (
        <button type="button" data-group="topic" data-value={topic.slug} aria-pressed="false">{topic.name}</button>
      ))}
    </div>

    <div class="filters" role="group" aria-label="Filter publications by author role">
      <button type="button" data-group="role" data-value="all" aria-pressed="true">All roles</button>
      <button type="button" data-group="role" data-value="first" aria-pressed="false">First author</button>
    </div>

    <div class="filters" role="group" aria-label="Filter publications by year">
      <button type="button" data-group="year" data-value="all" aria-pressed="true">All years</button>
      {years.map((year) => (
        <button type="button" data-group="year" data-value={String(year)} aria-pressed="false">{year}</button>
      ))}
    </div>

    <ul class="pub-list" id="pub-list">
      {pubs.map((pub) => <PublicationItem pub={pub} workTitles={workTitles} />)}
    </ul>
    <p id="pub-empty" class="muted" aria-live="polite" hidden>No publications match these filters.</p>
  </div>

  <script is:inline>
    (() => {
      const buttons = document.querySelectorAll('.filters button');
      const rows = document.querySelectorAll('#pub-list .pub-item');
      const empty = document.getElementById('pub-empty');
      const state = { topic: 'all', role: 'all', year: 'all' };

      const apply = () => {
        let visible = 0;
        rows.forEach((row) => {
          const topics = (row.dataset.topics ?? '').split(' ');
          const match =
            (state.topic === 'all' || topics.includes(state.topic)) &&
            (state.role === 'all' || row.dataset.role === 'first') &&
            (state.year === 'all' || row.dataset.year === state.year);
          row.hidden = !match;
          if (match) visible += 1;
        });
        if (empty) empty.hidden = visible > 0;
      };

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const group = btn.dataset.group;
          state[group] = btn.dataset.value;
          document
            .querySelectorAll(`.filters button[data-group="${group}"]`)
            .forEach((other) => other.setAttribute('aria-pressed', String(other === btn)));
          apply();
        });
      });

      const initial = new URLSearchParams(window.location.search).get('topic');
      if (initial) {
        document
          .querySelector(`.filters button[data-group="topic"][data-value="${initial}"]`)
          ?.click();
      }
    })();
  </script>
</BaseLayout>
```

- [ ] **步骤 4：首页传入 workTitles**

`src/pages/index.astro` 中计算 `workTitles` 并传给 `PublicationItem`。

- [ ] **步骤 5：追加主题徽标样式**

```css
.badge-topic { background: var(--bg-soft); color: var(--muted); border: 1px solid var(--border); }
```

- [ ] **步骤 6：构建并断言**

运行：
```bash
npm run build
grep -c 'data-group="topic"' dist/publications/index.html
grep -c 'data-topics=' dist/publications/index.html
grep -c 'Student 3rd author' dist/publications/index.html
grep -c 'id="pub-empty"' dist/publications/index.html
```
预期：`3`（All topics + 两个主题按钮）、条目数 `6`、`1`、`1`。

- [ ] **步骤 7：Commit**

```bash
git add src/components/PublicationItem.astro src/lib/format.ts src/pages/publications.astro src/pages/index.astro src/styles/global.css tests/format.test.ts
git commit -m "feat: 论文页支持主题、位次与年份筛选"
```

---

### 任务 5：Work 主题筛选、四段式详情与 Related

**文件：**
- 修改：`src/components/WorkCard.astro`、`src/pages/work/index.astro`、`src/pages/work/[slug].astro`、`src/pages/index.astro`、`src/styles/global.css`

- [ ] **步骤 1：`WorkCard` 增加主题信息**

根元素改为：

```astro
<article class="work-card" data-topics={(item.data.topics ?? []).join(' ')}>
```

并在 `summary` 下加主题徽标：

```astro
<div class="stack">
  {(item.data.topics ?? []).map((topic) => <span class="badge badge-topic">{topicName(topic)}</span>)}
</div>
```

导入 `topicName`。

- [ ] **步骤 2：`work/index.astro` 增加项目筛选**

在 Projects 区顶部加：

```astro
<div class="filters" role="group" aria-label="Filter projects by topic">
  <button type="button" data-value="all" aria-pressed="true">All topics</button>
  {topics.map((topic) => (
    <button type="button" data-value={topic.slug} aria-pressed="false">{topic.name}</button>
  ))}
</div>
```

并加脚本：

```html
<script is:inline>
  (() => {
    const buttons = document.querySelectorAll('.filters button');
    const cards = document.querySelectorAll('.work-card');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === btn)));
        cards.forEach((card) => {
          const topics = (card.dataset.topics ?? '').split(' ').filter(Boolean);
          card.hidden = value !== 'all' && !topics.includes(value);
        });
      });
    });
  })();
</script>
```

- [ ] **步骤 3：`work/[slug].astro` 改四段式**

```astro
---
import type { CollectionEntry } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const items = await getCollection('work');
  return items.map((item) => ({ params: { slug: item.id }, props: { item } }));
}

interface Props {
  item: CollectionEntry<'work'>;
}
const { item } = Astro.props;
const { Content } = await render(item);
const d = item.data;
const hasSections = Boolean(d.problem || d.approach || d.results);
const publications = await getCollection('publications');
const doi = d.relatedPublications[0];
const related = doi ? publications.find((pub) => pub.data.doi === doi) : undefined;
---
<BaseLayout title={`${d.title} · Zicong Yang`} description={d.summary}>
  <article class="container measure work-detail" style="padding-top:40px">
    <h1>{d.title}</h1>
    <p class="meta">{d.role} · {d.org} · {d.start} – {d.end}</p>

    {d.problem && <section class="work-block"><h2>Problem</h2><p>{d.problem}</p></section>}
    {d.approach && <section class="work-block"><h2>Approach</h2><p>{d.approach}</p></section>}
    {d.results && <section class="work-block"><h2>Results</h2><p>{d.results}</p></section>}

    {!hasSections && (
      <section class="work-block">
        <h2>Highlights</h2>
        <ul>{d.highlights.map((highlight) => <li>{highlight}</li>)}</ul>
      </section>
    )}

    <div class="prose"><Content /></div>

    <section class="work-block">
      <h2>Role</h2>
      <p>{d.role} at {d.org}.</p>
    </section>

    {d.stack.length > 0 && (
      <section class="work-block">
        <h2>Stack</h2>
        <div class="stack">{d.stack.map((tech) => <span>{tech}</span>)}</div>
      </section>
    )}

    {d.links.length > 0 && (
      <section class="work-block">
        <h2>Links</h2>
        <div class="links">
          {d.links.map((link) => <a href={link.url} target="_blank" rel="noopener">{link.label}</a>)}
        </div>
      </section>
    )}

    {related && (
      <section class="work-block">
        <h2>Related publication</h2>
        <p>
          <a href={`https://doi.org/${related.data.doi}`} target="_blank" rel="noopener">{related.data.title}</a>
          <span class="muted"> · {related.data.venue} · {related.data.year}</span>
        </p>
      </section>
    )}
  </article>
</BaseLayout>
```

- [ ] **步骤 4：首页与 `/work` 使用统一排序**

首页 projects 改用 `sortProjects(...)`，`work/index.astro` 改用 `sortExperience` 与 `sortProjects`。

- [ ] **步骤 5：追加样式**

```css
.work-block { margin-top: 28px; }
.work-block h2 { font-size: 0.95rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); font-family: var(--font-sans); margin-bottom: 8px; }
.work-block p { margin: 0; color: var(--fg); }
```

- [ ] **步骤 6：构建并断言**

运行：
```bash
npm run build
grep -c 'data-value="medical-signal"' dist/work/index.html
grep -c 'Problem' dist/work/sudden-cardiac-death-prediction/index.html
grep -c 'Related publication' dist/work/sudden-cardiac-death-prediction/index.html
grep -c 'Highlights' dist/work/wordle-analysis/index.html
```
预期：`1`、`1`、`1`、`0`（Wordle 已补三段，回退不出现）。

- [ ] **步骤 7：Commit**

```bash
git add src/components/WorkCard.astro src/pages/work src/pages/index.astro src/styles/global.css
git commit -m "feat: 项目页支持主题筛选与四段式详情"
```

---

### 任务 6：CV PDF 与站点常量

**文件：**
- 创建：`src/lib/site.ts`
- 修改：`src/layouts/PageLayout.astro`、`src/pages/index.astro`、`src/components/Hero.astro`、`src/components/Footer.astro`、`README.md`

- [ ] **步骤 1：写 `src/lib/site.ts`**

```ts
import { existsSync } from 'node:fs';

export const site = {
  name: 'Zicong Yang',
  tagline:
    'Software engineer and researcher working on medical signal processing and computer vision.',
  email: '402641915@qq.com',
  github: 'https://github.com/YZC0421',
  scholar: 'https://scholar.google.com/citations?user=0Ynn-awAAAAJ',
  orcid: 'https://orcid.org/0009-0001-0948-3606',
};

export function hasCvPdf(): boolean {
  return existsSync('public/cv.pdf');
}
```

- [ ] **步骤 2：`PageLayout` 支持下载**

frontmatter 增加 `import { hasCvPdf } from '../lib/site';` 与 `const cvAvailable = hasCvPdf();`，操作区改为：

```astro
<div class="about-actions">
  {cvAvailable ? (
    <a class="cv-download" href={withBase('cv.pdf')}>Download CV (PDF)</a>
  ) : (
    <button type="button" onclick="window.print()">{printLabel}</button>
  )}
</div>
```

`PageLayout` 需要 `import { withBase } from '../lib/url';`。

- [ ] **步骤 3：首页增加下载入口**

`src/pages/index.astro` 的 About 区块：

```astro
<div class="links">
  <a href={withBase('about')}>More about me →</a>
  {hasCvPdf() ? (
    <a href={withBase('cv.pdf')}>Download CV (PDF)</a>
  ) : (
    <a href={withBase('about')}>CV (print / PDF)</a>
  )}
</div>
```

- [ ] **步骤 4：Hero 与 Footer 使用站点常量**

`Hero.astro` 与 `Footer.astro` 改为从 `site` 读取姓名、邮箱与链接，删除重复字面量。

- [ ] **步骤 5：README 补 CV 说明**

在 `## Add a post` 之前加：

```markdown
## CV PDF

Place the exported PDF at `public/cv.pdf`. The About pages and the home page will show a
direct download link; without the file they fall back to the print action. Regenerate the
PDF manually whenever the About content changes.
```

- [ ] **步骤 6：验证两种状态**

运行：
```bash
npm run build
grep -c 'cv.pdf' dist/about/index.html dist/index.html
touch public/cv.pdf
npm run build
grep -c 'cv.pdf' dist/about/index.html dist/index.html
rm public/cv.pdf
npm run build
```
预期：第一次两处均为 `0`；第二次均为 `1`；第三次回到 `0`。

- [ ] **步骤 7：Commit**

```bash
git add src/lib/site.ts src/layouts/PageLayout.astro src/pages/index.astro src/components/Hero.astro src/components/Footer.astro README.md
git commit -m "feat: 支持 CV PDF 下载并收拢站点常量"
```

---

### 任务 7：博客标签页与 OG image

**文件：**
- 创建：`src/pages/blog/tag/[tag].astro`、`scripts/make-og.mjs`、`public/og.png`
- 修改：`src/pages/blog/index.astro`、`src/layouts/PostLayout.astro`、`src/layouts/BaseLayout.astro`、`package.json`

- [ ] **步骤 1：写标签页**

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import PostList from '../../../components/PostList.astro';
import { getCollection } from 'astro:content';
import { visiblePosts } from '../../../lib/posts';
import { withBase } from '../../../lib/url';

export async function getStaticPaths() {
  const posts = visiblePosts(await getCollection('blog'));
  const tags = [...new Set(posts.flatMap((post) => post.data.tags))];
  return tags.map((tag) => ({
    params: { tag },
    props: { tag, posts: posts.filter((post) => post.data.tags.includes(tag)) },
  }));
}

const { tag, posts } = Astro.props;
---
<BaseLayout title={`#${tag} · Writing`} description={`Posts tagged ${tag}.`} lang="zh-CN">
  <div class="container measure" style="padding-top:40px">
    <h1>#{tag}</h1>
    <p class="muted"><a href={withBase('blog')}>← All writing</a></p>
    <PostList posts={posts} />
  </div>
</BaseLayout>
```

- [ ] **步骤 2：标签徽标改为链接**

`src/pages/blog/index.astro` 的标签循环改为：

```astro
{post.data.tags.map((tag) => (
  <a class="lang-badge" href={withBase(`blog/tag/${tag}`)}>{tag}</a>
))}
```

`PostLayout.astro` 的 tags 同样改为链接（导入 `withBase`）。

- [ ] **步骤 3：写 `scripts/make-og.mjs`**

```js
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0b1120"/>
  <text x="80" y="290" font-family="Georgia, serif" font-size="92" fill="#e5e7eb">Zicong Yang</text>
  <text x="80" y="360" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#94a3b8">Medical Signal Processing · Industrial Visual Inspection</text>
  <rect x="80" y="420" width="120" height="4" fill="#60a5fa"/>
</svg>`;

await mkdir('public', { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og.png');
console.log('wrote public/og.png');
```

- [ ] **步骤 4：安装 sharp 并生成图片**

```bash
npm install -D sharp
node scripts/make-og.mjs
```

预期：`public/og.png` 存在，尺寸 1200×630。

- [ ] **步骤 5：`BaseLayout` 输出 OG image**

```astro
const ogImage = new URL(withBase('og.png'), Astro.site);
...
<meta property="og:image" content={ogImage} />
<meta name="twitter:card" content="summary_large_image" />
```

- [ ] **步骤 6：构建并断言**

```bash
npm run build
ls dist/blog/tag/*/index.html | wc -l
grep -c 'og:image' dist/index.html
grep -c 'blog/tag/' dist/blog/index.html
```
预期：标签页 `3`（astro / static-site / typescript）；`og:image` `1`；博客列表含标签链接。

- [ ] **步骤 7：Commit**

```bash
git add src/pages/blog src/layouts/PostLayout.astro src/layouts/BaseLayout.astro scripts/make-og.mjs public/og.png package.json package-lock.json
git commit -m "feat: 增加标签页与社交分享图"
```

---

### 任务 8：依赖锁定、CI PR 检查与验收扩展

**文件：**
- 修改：`package.json`、`.github/workflows/deploy.yml`、`scripts/verify-build.mjs`、`README.md`

- [ ] **步骤 1：依赖改为精确版本**

```json
"devDependencies": {
  "@astrojs/check": "0.9.12",
  "sharp": "0.34.5",
  "tsx": "4.23.15",
  "typescript": "6.0.3"
},
"dependencies": {
  "@astrojs/rss": "4.0.19",
  "@astrojs/sitemap": "3.7.4",
  "astro": "5.18.2",
  "zod": "3.25.76"
}
```

`sharp` 的版本以 `npm ls sharp --depth=0` 输出为准；同时加脚本 `"og": "node scripts/make-og.mjs"`。

运行：`npm install` 后 `npm run check && npm run build`，预期无变化。

- [ ] **步骤 2：CI 增加 PR 触发**

```yaml
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
```

`deploy` job 加条件：

```yaml
  deploy:
    if: github.event_name != 'pull_request'
    needs: build
```

- [ ] **步骤 3：扩展校验脚本**

在 `scripts/verify-build.mjs` 追加：

```js
import { existsSync } from 'node:fs';

const publicationsHtml = await read('dist/publications/index.html');
checks.push(['publications expose topic filters', publicationsHtml.includes('data-group="topic"')]);
checks.push(['publications expose role filter', publicationsHtml.includes('data-group="role"')]);
checks.push(['publications expose topic badges', publicationsHtml.includes('badge-topic')]);

const workHtml = await read('dist/work/index.html');
checks.push(['work exposes topic filter', workHtml.includes('data-value="medical-signal"')]);

const homeHtml = await read('dist/index.html');
checks.push(['home has research areas', homeHtml.includes('Research Areas')]);

const blogSources = await Promise.all(
  blogFiles.map((file) => readFile(`src/content/blog/${file}`, 'utf8'))
);
const tagSet = new Set();
for (const source of blogSources) {
  const match = source.match(/^tags:\s*\[(.+)\]$/m);
  if (match) {
    for (const tag of match[1].split(',')) tagSet.add(tag.trim().replace(/["']/g, ''));
  }
}
const tagPages = await countDirs('dist/blog/tag');
checks.push(['tag pages match tags', tagPages === tagSet.size]);

const cvExists = existsSync('public/cv.pdf');
checks.push([
  'cv link matches pdf presence',
  cvExists ? homeHtml.includes('/cv/cv.pdf') : !homeHtml.includes('/cv/cv.pdf'),
]);
```

- [ ] **步骤 4：全量验证**

```bash
rm -rf dist
npm test
npm run check
npm run build
npm run verify
```

预期：四步全部通过，`verify` 输出新增断言均为 `ok`。

- [ ] **步骤 5：Commit**

```bash
git add package.json package-lock.json .github/workflows/deploy.yml scripts/verify-build.mjs README.md
git commit -m "chore: 锁定依赖版本并增加 PR 校验"
```

---

## 规格覆盖对照

| 规格章节 | 对应任务 |
| --- | --- |
| 4 主题模型 | 任务 1 |
| 5.1 publications | 任务 1、4 |
| 5.2 work | 任务 1、2、5 |
| 5.3 关联校验 | 任务 1 |
| 5.4 BibTeX | 任务 4 |
| 6.1 首页 Research Areas | 任务 3 |
| 6.2 publications 筛选 | 任务 4 |
| 6.3 work 筛选 | 任务 5 |
| 6.4 项目四段式 | 任务 2、5 |
| 6.5 CV PDF | 任务 6 |
| 6.6 标签页 | 任务 7 |
| 6.7 OG image | 任务 7 |
| 6.8 互链 | 任务 1、4、5 |
| 7 工程变更 | 任务 3、6、8 |
| 8 内容迁移 | 任务 1、2 |
| 9 验收标准 | 任务 8（第 7、9、10 条另需手工验证） |
| 10 风险 | 任务 1（枚举）、任务 8（校验） |
