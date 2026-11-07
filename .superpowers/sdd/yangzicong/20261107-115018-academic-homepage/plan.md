# 个人学术主页改版 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 把现有单页简历重建为 Astro 静态站，包含学术主页、Work（经历与项目）、Blog 三个板块，内容数据化、零 CDN 依赖、可打印 CV。

**架构：** Astro 5 静态生成（`output: 'static'`），四个 Content Collections（publications / work / blog / pages）由 Zod 校验；页面在构建期完成排序、首页精选、RSS 与 sitemap，运行期仅三段原生 JS（主题、筛选、复制）。样式为单一 `global.css` + CSS 变量，深色模式由 `data-theme` 驱动。

**技术栈：** Astro 5、TypeScript、Zod、@astrojs/rss、@astrojs/sitemap、Shiki（内置）、GitHub Actions + Pages、Node 22（CI）/ 26（本地）。

**规格：** `.superpowers/sdd/yangzicong/20261107-115018-academic-homepage/spec.md`

---

## 文件结构

| 路径 | 职责 |
| --- | --- |
| `package.json` / `astro.config.mjs` / `tsconfig.json` | 项目配置，`site` + `base` 单一来源 |
| `src/lib/schema.ts` | 四个 Zod schema，被 content 与测试共用 |
| `src/lib/publications.ts` | 论文排序与首页精选规则（纯函数） |
| `src/lib/format.ts` | 日期、作者加粗、BibTeX 生成（纯函数） |
| `src/content.config.ts` | 集合注册，只做 loader + schema 绑定 |
| `src/content/publications/*.md` | 6 篇论文，一篇一文件 |
| `src/content/work/*.md` | 5 段经历 + 4 个项目 |
| `src/content/blog/*.md` | 文章，含示例文章 |
| `src/content/pages/about.{en,zh}.md` | 中英 About 正文 |
| `src/styles/global.css` | 全部样式：token、排版、组件、响应式、打印 |
| `src/layouts/BaseLayout.astro` | html/head、meta、主题脚本、Header/Footer |
| `src/layouts/PostLayout.astro` | 文章页布局 + TOC |
| `src/components/*.astro` | Header、Footer、Hero、PublicationItem、WorkCard、PostList、TagFilter、ThemeToggle、BibtexButton、Toc |
| `src/pages/*` | 路由页面 |
| `scripts/fetch-crossref.mjs` | 一次性论文元数据补全，不参与构建 |
| `scripts/verify-build.mjs` | 构建产物断言（10 条验收） |
| `.github/workflows/deploy.yml` | CI：check → test → build → verify → deploy |
| `public/CV.html` | 旧链接跳转 `/about` |
| `README.md` | 本地命令、内容新增流程、部署说明 |

**约定：** 所有内部链接用 `import.meta.env.BASE_URL` 或 `Astro.url` 生成，禁止写死 `/cv/`。每完成一个任务提交一次；文档与代码同属一个 commit（本计划文件已在 spec 提交内，后续不再单独改）。

---

### 任务 1：脚手架、设计 token 与基础布局

**文件：**
- 创建：`package.json`、`astro.config.mjs`、`tsconfig.json`、`src/styles/global.css`、`src/layouts/BaseLayout.astro`、`src/components/ThemeToggle.astro`、`src/components/Header.astro`、`src/components/Footer.astro`、`src/pages/index.astro`
- 测试：无（后续任务用构建验证）

- [ ] **步骤 1：写 `package.json`**

```json
{
  "name": "cv",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "tsx --test tests/*.test.ts",
    "verify": "node scripts/verify-build.mjs"
  }
}
```

- [ ] **步骤 2：安装依赖**

```bash
cd /Users/yangzicong/CodeBuddy/cv
npm install astro@^5 @astrojs/rss @astrojs/sitemap zod
npm install -D @astrojs/check typescript tsx
```

预期：`package.json` 出现 `dependencies` 与 `devDependencies` 字段，`node_modules/`、`package-lock.json` 生成，`npm ls astro` 显示 `astro@5.x`。

- [ ] **步骤 3：写 `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yzc0421.github.io',
  base: '/cv',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
```

- [ ] **步骤 4：写 `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strictNullChecks": true,
    "allowJs": true
  }
}
```

- [ ] **步骤 5：写 `src/styles/global.css`**

```css
:root {
  --bg: #ffffff;
  --bg-soft: #f8fafc;
  --fg: #111827;
  --muted: #64748b;
  --border: #e2e8f0;
  --accent: #1d4ed8;
  --q1-bg: #fffbeb;
  --q1-fg: #b45309;
  --q4-bg: #f3e8ff;
  --q4-fg: #7e22ce;
  --ei-bg: #ecfdf5;
  --ei-fg: #047857;
  --font-serif: "Source Serif 4", Georgia, "Songti SC", serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
  --measure: 720px;
  --wide: 1120px;
  color-scheme: light;
}

[data-theme='dark'] {
  --bg: #0b1120;
  --bg-soft: #111a2e;
  --fg: #e5e7eb;
  --muted: #94a3b8;
  --border: #1f2a3d;
  --accent: #60a5fa;
  --q1-bg: #2a1f06;
  --q1-fg: #fbbf24;
  --q4-bg: #241432;
  --q4-fg: #d8b4fe;
  --ei-bg: #052e22;
  --ei-fg: #6ee7b7;
  color-scheme: dark;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.7;
  transition: background-color 150ms ease, color 150ms ease;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

h1, h2, h3 { font-family: var(--font-serif); line-height: 1.25; margin: 0; }
h1 { font-size: 2.25rem; letter-spacing: -0.02em; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.125rem; }

.container { width: 100%; max-width: var(--wide); margin: 0 auto; padding: 0 24px; }
.measure { max-width: var(--measure); }
.muted { color: var(--muted); }
.rule { border: 0; border-top: 1px solid var(--border); margin: 0; }

.skip {
  position: absolute;
  left: -9999px;
  top: 0;
  background: var(--bg);
  padding: 8px 12px;
  z-index: 100;
}
.skip:focus { left: 8px; }

.site-header {
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  backdrop-filter: blur(8px);
  z-index: 50;
}
.site-header .inner {
  max-width: var(--wide);
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.brand { font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600; color: var(--fg); }
.nav-details { margin-left: auto; }
.nav-details > summary { list-style: none; }
.nav-details > summary::-webkit-details-marker { display: none; }
.nav { display: flex; gap: 18px; font-size: 0.9rem; }
.nav a { color: var(--muted); }
.nav a[aria-current='page'] { color: var(--fg); font-weight: 600; }
.nav-toggle { display: none; cursor: pointer; background: none; border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; color: var(--fg); font: inherit; }
.theme-toggle { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 2px 8px; color: var(--muted); cursor: pointer; font: inherit; }
.site-footer { border-top: 1px solid var(--border); margin-top: 72px; padding: 28px 0; color: var(--muted); font-size: 0.85rem; }

@media (max-width: 767px) {
  .nav-details { position: relative; }
  .nav-toggle { display: block; }
  .nav-details > .nav { display: none; }
  .nav-details[open] > .nav {
    display: flex;
    flex-direction: column;
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    min-width: 180px;
    padding: 16px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    z-index: 60;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
```

- [ ] **步骤 6：写 `BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description: string;
  lang?: string;
  type?: 'website' | 'article';
}
const { title, description, lang = 'en', type = 'website' } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
const base = import.meta.env.BASE_URL;
---
<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" href={`${base}favicon.svg`} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content={type} />
    <meta property="og:url" content={canonical} />
    <slot name="head" />
    <script is:inline>
      (() => {
        const saved = localStorage.getItem('theme');
        const dark = saved
          ? saved === 'dark'
          : window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      })();
    </script>
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <Header />
    <main id="main"><slot /></main>
    <Footer />
  </body>
</html>
```

- [ ] **步骤 7：写 Header、Footer、ThemeToggle**

`src/components/ThemeToggle.astro`：

```astro
<button id="theme-toggle" type="button" aria-label="Toggle dark mode" class="theme-toggle">◐</button>
<script is:inline>
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
  });
</script>
```

`src/components/Header.astro`：

```astro
---
import ThemeToggle from './ThemeToggle.astro';
const base = import.meta.env.BASE_URL;
const path = Astro.url.pathname;
const links = [
  { href: `${base}publications`, label: 'Publications' },
  { href: `${base}work`, label: 'Work' },
  { href: `${base}blog`, label: 'Writing' },
  { href: `${base}about`, label: 'About' },
];
const trail = path.replace(base, '/');
const isCurrent = (href: string) => {
  const target = href.replace(base, '/');
  return target === '/' ? trail === '/' : trail.startsWith(target);
};
---
<header class="site-header">
  <div class="inner">
    <a class="brand" href={base}>Zicong Yang</a>
    <details class="nav-details">
      <summary class="nav-toggle">Menu</summary>
      <nav class="nav">
        {links.map((link) => (
          <a href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>{link.label}</a>
        ))}
      </nav>
    </details>
    <ThemeToggle />
  </div>
</header>
```

`src/components/Footer.astro`：

```astro
---
const year = new Date().getFullYear();
const base = import.meta.env.BASE_URL;
---
<footer class="site-footer">
  <div class="container">
    © {year} Zicong Yang · <a href={`${base}rss.xml`}>RSS</a> ·
    <a href="https://scholar.google.com/citations?user=0Ynn-awAAAAJ">Scholar</a> ·
    <a href="https://orcid.org/0009-0001-0948-3606">ORCID</a>
  </div>
</footer>
```

- [ ] **步骤 8：写临时首页并验证构建**

`src/pages/index.astro`：

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Zicong Yang" description="Medical signal processing and computer vision.">
  <div class="container" style="padding-top:48px">
    <h1>Zicong Yang</h1>
  </div>
</BaseLayout>
```

运行：`npm run build`
预期：`dist/index.html` 生成，命令退出码 0。

- [ ] **步骤 9：本地预览确认无样式缺失**

运行：`npm run dev`，浏览器打开 `http://localhost:4321/cv/`。
预期：白底、衬线标题、导航含四项，无控制台报错。确认后 `Ctrl+C` 停止。

- [ ] **步骤 10：Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json src/
git commit -m "feat: 搭建 Astro 基座与设计 token"
```

---

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

### 任务 3：论文元数据补全与 6 条内容

**文件：**
- 创建：`scripts/fetch-crossref.mjs`、`src/content/publications/*.md`（6 个）
- 依赖上一步的 schema

- [ ] **步骤 1：写 `scripts/fetch-crossref.mjs`**

```js
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'scripts/out';
const targets = [
  { key: 'scientific-reports-2024', doi: '10.1038/s41598-024-71700-z' },
  { key: 'cisse-2024', doi: '10.1007/978-3-031-57037-7_7' },
  { key: 'mst-2025', doi: '10.1088/1361-6501/ae10d3' },
  { key: 'cvidl-2024-wheat', title: 'Wheat Disease Recognition Based on a Fusion Model with Improved Spatial and Channel Reconstruction Convolution Combined with Contextual Transformer' },
  { key: 'cvidl-2024-garbage', title: 'Enhanced and improved garbage identification and classification of YOLOV5 based on data' },
  { key: 'ipmlp-2024', doi: '10.1145/3700906.3700946' },
];

const fetchJson = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': 'cv-site-build/1.0 (mailto:402641915@qq.com)' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

const lookup = async (target) => {
  if (target.doi) {
    const json = await fetchJson(`https://api.crossref.org/works/${encodeURIComponent(target.doi)}`);
    return json.message;
  }
  const q = encodeURIComponent(target.title);
  const json = await fetchJson(`https://api.crossref.org/works?query.bibliographic=${q}&rows=1`);
  return json.message.items?.[0];
};

const toEntry = (item) => {
  const authors = (item.author ?? []).map((a) => [a.given, a.family].filter(Boolean).join(' '));
  const issued = item.issued?.['date-parts']?.[0] ?? [];
  const year = issued[0];
  const month = String(issued[1] ?? 1).padStart(2, '0');
  const day = String(issued[2] ?? 1).padStart(2, '0');
  const type = item.type === 'proceedings-article' ? 'conference' : 'journal';
  return {
    title: (item.title ?? [''])[0].replace(/\s+/g, ' ').trim(),
    authors,
    venue: (item['container-title'] ?? [''])[0],
    year,
    doi: item.DOI,
    url: item.URL,
    type,
    date: `${year}-${month}-${day}`,
  };
};

await mkdir(OUT, { recursive: true });
const review = ['# 论文元数据核对表', ''];

for (const target of targets) {
  try {
    const item = await lookup(target);
    if (!item) throw new Error('no crossref match');
    const entry = toEntry(item);
    const fm = [
      '---',
      `title: ${JSON.stringify(entry.title)}`,
      'authors:',
      ...entry.authors.map((a) => `  - ${JSON.stringify(a)}`),
      `venue: ${JSON.stringify(entry.venue)}`,
      `year: ${entry.year}`,
      `type: ${entry.type}`,
      'indexing: none',
      'role: other',
      `doi: ${JSON.stringify(entry.doi)}`,
      `url: ${JSON.stringify(entry.url)}`,
      'selected: false',
      `date: ${entry.date}`,
      '---',
      '',
    ].join('\n');
    await writeFile(`${OUT}/${target.key}.md`, fm, 'utf8');
    review.push(`## ${target.key}`, '', `- 标题：${entry.title}`, `- 作者：${entry.authors.join(', ')}`, `- 出处：${entry.venue} (${entry.year})`, `- DOI：${entry.doi}`, '');
  } catch (error) {
    review.push(`## ${target.key}`, '', `- 失败：${error.message}`, '');
    console.warn(`[warn] ${target.key}: ${error.message}`);
  }
}

await writeFile(`${OUT}/review.md`, review.join('\n'), 'utf8');
console.log(`written to ${OUT}/`);
```

- [ ] **步骤 2：运行脚本拉取元数据**

运行：`node scripts/fetch-crossref.mjs`
预期：`scripts/out/` 下出现 6 个 md（失败项除外）与 `review.md`；控制台无未捕获异常。

- [ ] **步骤 3：人工核对（阻塞检查点）**

把 `scripts/out/review.md` 内容展示给用户，逐条确认：作者顺序、年份、期刊/会议全称。未确认的条目不写入 `src/content/publications/`。若某条 Crossref 失败，要求用户提供 DOI 或完整作者列表后手工补。

- [ ] **步骤 4：写入 6 条内容并补齐人工字段**

对每个 `scripts/out/*.md`：复制到 `src/content/publications/{key}.md`，按下面规则修正 frontmatter。

```yaml
---
title: "A coordinated adaptive multiscale enhanced spatio-temporal fusion network for multi-lead electrocardiogram arrhythmia detection"
# authors 数组从 scripts/out/scientific-reports-2024.md 原样复制，逐字与核对表一致；
# 不在此硬编码，避免作者顺序或拼写错误。Zicong Yang 必须出现在列表中。
authors:
  - "Zicong Yang"
venue: "Scientific Reports"
venueShort: "Sci Rep"
year: 2024
type: journal
indexing: Q1
role: first
doi: "10.1038/s41598-024-71700-z"
url: "https://www.nature.com/articles/s41598-024-71700-z"
selected: true
date: "2024-09-01"
---

Multi-lead ECG arrhythmia detection with a coordinated adaptive multiscale fusion network.
```

其余 5 篇按核对表同样处理，已知对应关系：

| 文件 | 标题关键词 | venue | indexing | role |
| --- | --- | --- | --- | --- |
| `scientific-reports-2024.md` | coordinated adaptive multiscale … ECG | Scientific Reports | Q1 | first |
| `cisse-2024.md` | fusion model of ResNet and GRU … PTB-XL | Computer and Information Science and Engineering | Q4 | first |
| `mst-2025.md` | Enhancing Defect Detection with Diffusion Model | Measurement Science and Technology | Q1 | third |
| `cvidl-2024-wheat.md` | Wheat Disease Recognition … Contextual Transformer | CVIDL 2024 | EI | first |
| `cvidl-2024-garbage.md` | garbage identification and classification of YOLOV5 | CVIDL 2024 | EI | second |
| `ipmlp-2024.md` | Surface waste identification … improved YOLOV8 | IPMLP 2024 | EI | other |

`selected: true` 只给 `scientific-reports-2024` 与 `cvidl-2024-wheat`（一作且具代表性），其余 `false`。

- [ ] **步骤 5：验证 schema 通过**

运行：`npm run build`
预期：构建成功；若报 schema 错误，按提示修正对应文件（缺字段、年份非法、日期格式）。

- [ ] **步骤 6：Commit**

```bash
git add scripts/fetch-crossref.mjs src/content/publications/
git commit -m "feat: 录入六篇论文结构化数据"
```

---

### 任务 4：Publications 页与 BibTeX

**文件：**
- 创建：`src/components/PublicationItem.astro`、`src/components/BibtexButton.astro`、`src/pages/publications.astro`
- 修改：`src/styles/global.css`（追加论文条目样式）

- [ ] **步骤 1：追加论文样式到 `global.css`**

```css
.pub-list { list-style: none; margin: 0; padding: 0; }
.pub-item { padding: 18px 0; border-bottom: 1px solid var(--border); }
.pub-title { font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600; line-height: 1.4; }
.pub-meta { margin-top: 6px; font-size: 0.85rem; color: var(--muted); }
.pub-actions { margin-top: 8px; display: flex; gap: 14px; font-size: 0.8rem; }
.pub-actions button { background: none; border: 0; padding: 0; color: var(--accent); font: inherit; cursor: pointer; }
.badge { display: inline-block; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.04em; padding: 1px 6px; border-radius: 4px; margin-right: 6px; text-transform: uppercase; }
.badge-q1 { background: var(--q1-bg); color: var(--q1-fg); }
.badge-q4 { background: var(--q4-bg); color: var(--q4-fg); }
.badge-ei { background: var(--ei-bg); color: var(--ei-fg); }
.badge-neutral { background: var(--bg-soft); color: var(--muted); border: 1px solid var(--border); }
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0 8px; }
.filters button { font: inherit; font-size: 0.8rem; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--border); background: var(--bg); color: var(--muted); cursor: pointer; }
.filters button[aria-pressed='true'] { border-color: var(--accent); color: var(--accent); }
.bibtex { margin-top: 10px; }
.bibtex pre { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 6px; padding: 12px; overflow-x: auto; font-size: 0.78rem; }
```

- [ ] **步骤 2：写 `BibtexButton.astro`**

```astro
---
interface Props { bibtex: string; }
const { bibtex } = Astro.props;
---
<span class="bibtex-block">
  <button type="button" class="copy-btn" data-bibtex={bibtex}>Copy BibTeX</button>
  <details class="bibtex">
    <summary class="muted" style="font-size:0.8rem;cursor:pointer">Show BibTeX</summary>
    <pre><code>{bibtex}</code></pre>
  </details>
</span>
<script is:inline>
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.bibtex ?? '';
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = 'Copy BibTeX'), 1500);
      } catch {
        btn.textContent = 'Select the BibTeX below';
      }
    });
  });
</script>
```

- [ ] **步骤 3：写 `PublicationItem.astro`**

```astro
---
import BibtexButton from './BibtexButton.astro';
import { boldSelf, toBibtex } from '../lib/format';

interface Props { pub: any; }
const { pub } = Astro.props;
const d = pub.data;
const href = d.url ?? `https://doi.org/${d.doi}`;
const bibtex = d.bibtex ?? toBibtex({ title: d.title, authors: d.authors, venue: d.venue, year: d.year, doi: d.doi, type: d.type });
const badgeClass = d.indexing === 'Q1' ? 'badge-q1' : d.indexing === 'Q4' ? 'badge-q4' : d.indexing === 'EI' ? 'badge-ei' : 'badge-neutral';
const roleLabel = d.role === 'first' ? 'First author' : undefined;
---
<li class="pub-item" data-indexing={d.indexing} data-role={d.role} data-year={d.year}>
  <a class="pub-title" href={href} target="_blank" rel="noopener">{d.title}</a>
  <div class="pub-meta">
    <span set:html={boldSelf(d.authors)} />
  </div>
  <div class="pub-meta">
    {d.indexing !== 'none' && <span class={`badge ${badgeClass}`}>{d.indexing === 'EI' ? 'EI indexed' : `JCR ${d.indexing}`}</span>}
    <span class="badge badge-neutral">{roleLabel ?? 'Co-author'}</span>
    <span>{d.venueShort ?? d.venue} · {d.year}</span>
  </div>
  <div class="pub-actions">
    <a href={href} target="_blank" rel="noopener">DOI</a>
    <BibtexButton bibtex={bibtex} />
  </div>
</li>
```

- [ ] **步骤 4：写 `publications.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PublicationItem from '../components/PublicationItem.astro';
import { getCollection } from 'astro:content';
import { sortPublications } from '../lib/publications';

const pubs = sortPublications(await getCollection('publications'));
const years = [...new Set(pubs.map((p) => p.data.year))].sort((a, b) => b - a);
---
<BaseLayout title="Publications · Zicong Yang" description="Peer-reviewed publications on medical signal processing and computer vision.">
  <div class="container measure" style="padding-top:40px">
    <h1>Publications</h1>
    <p class="muted">Peer-reviewed journal and conference papers. {pubs.length} entries.</p>

    <div class="filters" role="group" aria-label="Filter publications">
      <button type="button" data-filter="all" aria-pressed="true">All</button>
      <button type="button" data-filter="first" aria-pressed="false">First author</button>
      <button type="button" data-filter="Q1" aria-pressed="false">JCR Q1</button>
      <button type="button" data-filter="EI" aria-pressed="false">EI</button>
      {years.map((y) => <button type="button" data-filter={String(y)} aria-pressed="false">{y}</button>)}
    </div>

    <ul class="pub-list" id="pub-list">
      {pubs.map((pub) => <PublicationItem pub={pub} />)}
    </ul>
  </div>

  <script is:inline>
    const buttons = document.querySelectorAll('.filters button');
    const items = document.querySelectorAll('#pub-list .pub-item');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        const f = btn.dataset.filter;
        items.forEach((item) => {
          const match =
            f === 'all' ||
            item.dataset.role === f ||
            item.dataset.indexing === f ||
            item.dataset.year === f;
          item.hidden = !match;
        });
      });
    });
  </script>
</BaseLayout>
```

- [ ] **步骤 5：构建并断言 6 条标题出现在产物**

运行：
```bash
npm run build
grep -c 'class="pub-item"' dist/publications/index.html
```
预期：输出 `6`（若核对确认的条目数不同，以实际数量为准且与 `src/content/publications/` 文件数一致）。

- [ ] **步骤 6：预览检查筛选与复制**

运行：`npm run dev`，打开 `http://localhost:4321/cv/publications/`。
预期：点击 `First author` 后仅剩一作条目；点击 `Copy BibTeX` 按钮文案变为 `Copied`；展开 `Show BibTeX` 可见完整条目。`Ctrl+C` 停止。

- [ ] **步骤 7：Commit**

```bash
git add src/pages/publications.astro src/components/PublicationItem.astro src/components/BibtexButton.astro src/styles/global.css
git commit -m "feat: 论文列表页支持筛选与 BibTeX 复制"
```

---

### 任务 5：首页

**文件：**
- 创建：`src/components/Hero.astro`、`src/components/WorkCard.astro`、`src/components/PostList.astro`
- 修改：`src/pages/index.astro`、`src/styles/global.css`

- [ ] **步骤 1：追加首页样式**

```css
.hero { padding: 64px 0 40px; }
.hero p { max-width: 46ch; margin: 16px 0 0; color: var(--muted); }
.social { display: flex; gap: 16px; margin-top: 20px; font-size: 0.85rem; }
.section { margin-top: 56px; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.section-head h2 { border-bottom: 1px solid var(--border); padding-bottom: 8px; flex: 1; font-size: 0.95rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); font-family: var(--font-sans); }
.section-head a { font-size: 0.85rem; white-space: nowrap; }
.work-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 768px) { .work-grid { grid-template-columns: 1fr 1fr; } }
.work-card { border: 1px solid var(--border); border-radius: 8px; padding: 16px; background: var(--bg); }
.work-card h3 { font-size: 1rem; }
.work-card p { margin: 8px 0 12px; font-size: 0.88rem; color: var(--muted); }
.stack { display: flex; flex-wrap: wrap; gap: 6px; }
.stack span { font-size: 0.72rem; padding: 1px 7px; border-radius: 999px; background: var(--bg-soft); border: 1px solid var(--border); color: var(--muted); }
.post-list { list-style: none; margin: 0; padding: 0; }
.post-list li { display: flex; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
.post-list time { color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.lang-badge { font-size: 0.68rem; border: 1px solid var(--border); border-radius: 4px; padding: 0 4px; color: var(--muted); }
```

- [ ] **步骤 2：写 `Hero.astro`**

```astro
---
const base = import.meta.env.BASE_URL;
---
<section class="hero container measure">
  <h1>Zicong Yang</h1>
  <p>
    Software engineer and researcher working on medical signal processing and computer
    vision — ECG arrhythmia detection, industrial defect inspection, and applied deep learning.
  </p>
  <div class="social">
    <a href="https://scholar.google.com/citations?user=0Ynn-awAAAAJ" target="_blank" rel="noopener">Google Scholar</a>
    <a href="https://orcid.org/0009-0001-0948-3606" target="_blank" rel="noopener">ORCID</a>
    <a href="https://github.com/YZC0421" target="_blank" rel="noopener">GitHub</a>
    <a href="mailto:402641915@qq.com">Email</a>
  </div>
</section>
```

- [ ] **步骤 3：写 `WorkCard.astro` 与 `PostList.astro`**

`WorkCard.astro`：

```astro
---
interface Props { item: any; }
const { item } = Astro.props;
const base = import.meta.env.BASE_URL;
---
<article class="work-card">
  <h3><a href={`${base}work/${item.id}`}>{item.data.title}</a></h3>
  <p>{item.data.summary}</p>
  <div class="stack">{item.data.stack.map((s: string) => <span>{s}</span>)}</div>
</article>
```

`PostList.astro`：

```astro
---
interface Props { posts: any[]; }
const { posts } = Astro.props;
const base = import.meta.env.BASE_URL;
---
<ul class="post-list">
  {posts.map((post) => (
    <li>
      <time datetime={post.data.date}>{post.data.date}</time>
      <a href={`${base}blog/${post.id}`}>{post.data.title}</a>
      <span class="lang-badge">{post.data.lang === 'zh' ? '中文' : 'EN'}</span>
    </li>
  ))}
</ul>
```

- [ ] **步骤 4：写首页**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import PublicationItem from '../components/PublicationItem.astro';
import WorkCard from '../components/WorkCard.astro';
import PostList from '../components/PostList.astro';
import { getCollection } from 'astro:content';
import { selectHomepage } from '../lib/publications';

const base = import.meta.env.BASE_URL;
const today = new Date().toISOString().slice(0, 10);

const pubs = selectHomepage(await getCollection('publications'));
const work = (await getCollection('work'))
  .filter((w) => w.data.kind === 'project')
  .sort((a, b) => a.data.order - b.data.order)
  .slice(0, 3);
const posts = (await getCollection('blog'))
  .filter((p) => !p.data.draft && p.data.date <= today)
  .sort((a, b) => b.data.date.localeCompare(a.data.date))
  .slice(0, 2);
---
<BaseLayout title="Zicong Yang · Medical Signal Processing & Computer Vision" description="Personal site of Zicong Yang: publications, engineering work, and technical writing.">
  <Hero />

  <section class="section container measure">
    <div class="section-head">
      <h2>Selected Publications</h2>
      <a href={`${base}publications`}>All publications →</a>
    </div>
    <ul class="pub-list">{pubs.map((pub) => <PublicationItem pub={pub} />)}</ul>
  </section>

  <section class="section container measure">
    <div class="section-head">
      <h2>Selected Work</h2>
      <a href={`${base}work`}>All work →</a>
    </div>
    <div class="work-grid">{work.map((item) => <WorkCard item={item} />)}</div>
  </section>

  {posts.length > 0 && (
    <section class="section container measure">
      <div class="section-head">
        <h2>Latest Writing</h2>
        <a href={`${base}blog`}>All writing →</a>
      </div>
      <PostList posts={posts} />
    </section>
  )}

  <section class="section container measure">
    <div class="section-head"><h2>About</h2></div>
    <p class="muted">
      B.E. in Software Engineering, Zhuhai College of Science and Technology (2021–2025).
      First-author publications in Scientific Reports and CVIDL; research on ECG analysis and
      industrial visual inspection.
    </p>
    <div class="links">
      <a href={`${base}about`}>More about me →</a>
      <a href={`${base}about`}>Download CV (PDF)</a>
    </div>
  </section>
</BaseLayout>
```

- [ ] **步骤 5：此时首页依赖 work 集合，先建最小 work 数据**

创建 `src/content/work/sudden-cardiac-death-prediction.md`：

```yaml
---
title: "Sudden Cardiac Death Prediction Model"
org: "Guangdong Provincial Student Innovation Program"
kind: project
role: "Project Lead"
start: "2023-03"
end: "2024-06"
summary: "End-to-end ECG research project that produced two first-author papers."
stack: ["PyTorch", "CNN/RNN", "Attention", "PTB-XL"]
highlights:
  - "Led proposal, design, implementation, publication, and final acceptance."
  - "Designed STFAC-ECGNet with coordinated channel-spatial attention."
  - "Published two first-author papers (JCR Q1 and Q4)."
order: 1
---

Led the project end-to-end and designed a multiscale spatio-temporal fusion network for
multi-lead ECG classification.
```

- [ ] **步骤 6：构建并断言精选规则**

运行：
```bash
npm run build
grep -o 'class="pub-item"' dist/index.html | wc -l
```
预期：`3`。若不足 3，说明论文数据少于 3 条，需回到任务 3 补齐。

- [ ] **步骤 7：预览检查首页顺序与空态**

运行：`npm run dev`，打开 `http://localhost:4321/cv/`。
预期：Hero → Selected Publications（3 条）→ Selected Work（1 条）→ About，无 Latest Writing 区块（此时无文章），页面无横向滚动。`Ctrl+C` 停止。

- [ ] **步骤 8：Commit**

```bash
git add src/pages/index.astro src/components/Hero.astro src/components/WorkCard.astro src/components/PostList.astro src/content/work/ src/styles/global.css
git commit -m "feat: 实现首页精选论文、项目与文章区块"
```

---

### 任务 6：Work 列表与详情页

**文件：**
- 创建：`src/pages/work/index.astro`、`src/pages/work/[slug].astro`、其余 8 个 `src/content/work/*.md`
- 修改：`src/styles/global.css`

- [ ] **步骤 1：追加 Work 样式**

```css
.timeline { list-style: none; margin: 0; padding: 0; }
.timeline li { border-left: 2px solid var(--border); padding: 0 0 20px 16px; }
.timeline h3 { font-size: 1rem; }
.timeline .org { color: var(--accent); font-weight: 600; font-size: 0.9rem; }
.timeline .when { font-size: 0.78rem; color: var(--muted); font-variant-numeric: tabular-nums; }
.timeline ul { margin: 8px 0 0; padding-left: 18px; color: var(--muted); font-size: 0.88rem; }
.work-detail h1 { margin-bottom: 8px; }
.work-detail .meta { color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; }
.work-detail ul { padding-left: 20px; }
.work-detail li { margin-bottom: 8px; }
.links { display: flex; gap: 16px; margin-top: 20px; font-size: 0.88rem; }
```

- [ ] **步骤 2：补齐 8 个 work 内容文件**

按 `index.html` 中的既有事实写入，不新增结论。每个文件 frontmatter 使用任务 5 的字段。文件名与关键字段：

| 文件 | kind | title | org | role | start–end | summary |
| --- | --- | --- | --- | --- | --- | --- |
| `guangzhou-xiyang.md` | experience | Software Engineer | Guangzhou Xiyang Information Technology Co., Ltd. | Software Engineer | 2025-01–2025-09 | Cable surface defect detection and intelligent reporting system. |
| `ningbo-haizhimingshi.md` | experience | Algorithm Intern | Ningbo Haizhimingshi Technology Co., Ltd. | Algorithm Intern | 2024-09–2024-12 | Soft-shell crab detection with YOLOv5s, 45 FPS inference. |
| `ningbo-jiasi.md` | experience | Algorithm Intern | Ningbo Jiasi Technology Co., Ltd. | Algorithm Intern | 2024-03–2024-09 | Water-quality forecasting with IoT sensor fusion. |
| `guangzhou-chuzhong.md` | experience | Software Development Intern | Guangzhou Chuzhong Technology Co. | Software Development Intern | 2023-07–2023-11 | SpringBoot + JWT publishing system with review workflow. |
| `campus-startup.md` | experience | Independent Operator | Campus Startup Project | Operator | 2024-07–2025-09 | Xiaohongshu operations and direct sales for a campus startup. |
| `wordle-analysis.md` | project | NYT Wordle Game Analysis | MCM/ICM | Lead | 2023-02–2023-05 | Difficulty modeling and BiGRU trend prediction, MCM Meritorious Winner. |
| `coca-cola-consumer-analysis.md` | project | Consumer Demand Analysis (Coca-Cola) | CP Group Cup | Lead | 2023-01–2025-05 | 120,756 JD reviews analyzed with BERT sentiment analysis. |
| `rural-revitalization.md` | project | “Agriculture + Tourism” Rural Revitalization | National Youth League Research Program | Second Lead | 2023-07–2025-11 | 379 questionnaires plus machine-learning yield prediction. |

`highlights` 从 `index.html:415-440`、`456-469`、`485-497`、`514-527`、`543-552`、`678-681`、`694-697`、`710-713`、`726-729` 逐条摘取（英文原文），每文件 3–6 条；`stack` 取各段 `Tech Stack` 或正文中出现的技术名。项目 `order` 依次为 1–4，经历为 0。

- [ ] **步骤 3：写 `work/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import WorkCard from '../../components/WorkCard.astro';
import { getCollection } from 'astro:content';

const all = await getCollection('work');
const experience = all.filter((w) => w.data.kind === 'experience')
  .sort((a, b) => b.data.start.localeCompare(a.data.start));
const projects = all.filter((w) => w.data.kind === 'project')
  .sort((a, b) => a.data.order - b.data.order);
---
<BaseLayout title="Work · Zicong Yang" description="Engineering experience and research projects.">
  <div class="container measure" style="padding-top:40px">
    <h1>Work</h1>

    <section class="section">
      <div class="section-head"><h2>Experience</h2></div>
      <ul class="timeline">
        {experience.map((job) => (
          <li>
            <h3><a href={`${import.meta.env.BASE_URL}work/${job.id}`}>{job.data.title}</a></h3>
            <div class="org">{job.data.org}</div>
            <div class="when">{job.data.start} – {job.data.end}</div>
            <ul>{job.data.highlights.slice(0, 3).map((h) => <li set:html={h} />)}</ul>
          </li>
        ))}
      </ul>
    </section>

    <section class="section">
      <div class="section-head"><h2>Projects</h2></div>
      <div class="work-grid">{projects.map((item) => <WorkCard item={item} />)}</div>
    </section>
  </div>
</BaseLayout>
```

- [ ] **步骤 4：写 `work/[slug].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const items = await getCollection('work');
  return items.map((item) => ({ params: { slug: item.id }, props: { item } }));
}

const { item } = Astro.props;
const { Content } = await render(item);
---
<BaseLayout title={`${item.data.title} · Zicong Yang`} description={item.data.summary}>
  <article class="container measure work-detail" style="padding-top:40px">
    <h1>{item.data.title}</h1>
    <div class="meta">
      {item.data.role} · {item.data.org} · {item.data.start} – {item.data.end}
    </div>
    <p>{item.data.summary}</p>
    <ul>{item.data.highlights.map((h) => <li set:html={h} />)}</ul>
    <Content />
    {item.data.stack.length > 0 && (
      <div class="stack" style="margin-top:24px">
        {item.data.stack.map((s) => <span>{s}</span>)}
      </div>
    )}
    {item.data.links.length > 0 && (
      <div class="links">
        {item.data.links.map((l) => <a href={l.url} target="_blank" rel="noopener">{l.label}</a>)}
      </div>
    )}
  </article>
</BaseLayout>
```

- [ ] **步骤 5：构建并断言详情页数量**

运行：
```bash
npm run build
ls dist/work/*/index.html | wc -l
grep -c 'class="work-card"' dist/index.html
```
预期：`9`（5 段经历 + 4 个项目）；首页项目卡片 `3`。

- [ ] **步骤 6：预览检查时间线与详情**

运行：`npm run dev`，打开 `/cv/work/`。
预期：Experience 时间线按开始时间倒序；Projects 为卡片网格；点击任一项目进入详情页，标题、角色、要点、正文正常。`Ctrl+C` 停止。

- [ ] **步骤 7：Commit**

```bash
git add src/pages/work src/content/work src/styles/global.css
git commit -m "feat: 实现工作经历与项目页面"
```

---

### 任务 7：Blog、文章页、RSS 与示例文章

**文件：**
- 创建：`src/pages/blog/index.astro`、`src/pages/blog/[slug].astro`、`src/layouts/PostLayout.astro`、`src/components/Toc.astro`、`src/components/TagFilter.astro`、`src/pages/rss.xml.ts`、`src/content/blog/from-single-page-to-astro.md`
- 修改：`src/styles/global.css`

- [ ] **步骤 1：追加文章样式**

```css
.post-list li { align-items: baseline; }
.post-header { padding: 32px 0 8px; }
.post-header h1 { font-size: 2rem; }
.post-meta { color: var(--muted); font-size: 0.85rem; margin-top: 8px; display: flex; gap: 10px; flex-wrap: wrap; }
.prose { font-size: 1rem; }
.prose h2 { margin: 40px 0 12px; font-size: 1.35rem; }
.prose h3 { margin: 28px 0 10px; font-size: 1.1rem; }
.prose p, .prose li { color: var(--fg); }
.prose code { font-size: 0.86em; background: var(--bg-soft); border: 1px solid var(--border); border-radius: 4px; padding: 1px 4px; }
.prose pre { border: 1px solid var(--border); border-radius: 8px; padding: 16px; overflow-x: auto; }
.prose pre code { background: none; border: 0; padding: 0; }
.prose blockquote { margin: 20px 0; padding-left: 16px; border-left: 3px solid var(--border); color: var(--muted); }
.toc { font-size: 0.82rem; border-left: 1px solid var(--border); padding-left: 14px; }
.toc ul { list-style: none; margin: 0; padding: 0; }
.toc li { margin: 6px 0; }
.toc a { color: var(--muted); }
.post-grid { display: grid; gap: 32px; }
@media (min-width: 1024px) { .post-grid { grid-template-columns: 680px 200px; justify-content: center; } }
.toc-mobile { margin: 20px 0; }
@media (min-width: 1024px) { .toc-mobile { display: none; } }
.next-prev { display: flex; justify-content: space-between; gap: 16px; margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 0.88rem; }
```

- [ ] **步骤 2：写示例文章 `from-single-page-to-astro.md`**

```markdown
---
title: "从一份 55KB 的单页简历到 Astro 站点"
date: "2026-11-07"
lang: "zh"
tags: ["astro", "typescript", "static-site"]
summary: "记录把单文件双语简历迁移为内容驱动的静态站的过程与取舍。"
draft: false
---

这份站点此前是一个 786 行的 `index.html`，加上一份内容完全相同的 `CV.html`。中英双语
靠两组 `span` 加运行时 JS 切换，样式来自 Tailwind CDN 与 FontAwesome CDN。

## 问题不在样式

真正的成本在内容维护：每加一篇论文，要同时改英文段与中文段；每换一次措辞，要找两处。
搜索引擎只能看到一份混排文本，分享链接也无法指定语言。

## 迁移到 Astro

论文、项目、文章被拆成独立的 Markdown 文件，frontmatter 由 Zod 校验。构建期完成排序、
首页精选、RSS 与 sitemap，运行期只保留三段原生 JS：主题切换、列表筛选、BibTeX 复制。

## 得到什么

- 新增一篇论文只需新增一个文件。
- 构建产物零 CDN 依赖，断网也能正常显示。
- 中英内容各自拥有稳定 URL，`hreflang` 与 canonical 正确。
- 打印样式单独处理，`/about` 可直接输出 PDF。

## 没做什么

没有加评论、站内搜索和访问统计。论文只有六条、文章不足十篇时，这些能力带来的维护
成本高于收益。
```

- [ ] **步骤 3：写 `Toc.astro` 与 `PostLayout.astro`**

`Toc.astro`：

```astro
---
interface Props { headings: { depth: number; slug: string; text: string }[]; }
const { headings } = Astro.props;
const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
---
{items.length > 0 && (
  <nav class="toc" aria-label="Table of contents">
    <ul>
      {items.map((h) => (
        <li style={h.depth === 3 ? 'padding-left:12px' : undefined}>
          <a href={`#${h.slug}`}>{h.text}</a>
        </li>
      ))}
    </ul>
  </nav>
)}
```

`PostLayout.astro`：

```astro
---
import BaseLayout from './BaseLayout.astro';
import Toc from '../components/Toc.astro';

interface Props {
  title: string;
  description: string;
  date: string;
  lang: 'en' | 'zh';
  tags: string[];
  headings: { depth: number; slug: string; text: string }[];
}
const { title, description, date, lang, tags, headings } = Astro.props;
---
<BaseLayout title={`${title} · Zicong Yang`} description={description} lang={lang === 'zh' ? 'zh-CN' : 'en'} type="article">
  <Fragment slot="head">
    <meta property="article:published_time" content={date} />
    {tags.map((t) => <meta property="article:tag" content={t} />)}
  </Fragment>
  <div class="post-grid container" style="padding-top:24px">
    <article>
      <header class="post-header">
        <h1>{title}</h1>
        <div class="post-meta">
          <time datetime={date}>{date}</time>
          <span class="lang-badge">{lang === 'zh' ? '中文' : 'EN'}</span>
          {tags.map((t) => <span class="lang-badge">{t}</span>)}
        </div>
      </header>
      <div class="toc-mobile"><Toc headings={headings} /></div>
      <div class="prose"><slot /></div>
      <slot name="footer" />
    </article>
    <aside><Toc headings={headings} /></aside>
  </div>
</BaseLayout>
```

- [ ] **步骤 4：写 `blog/index.astro` 与 `TagFilter.astro`**

`TagFilter.astro`：

```astro
---
interface Props { tags: string[]; }
const { tags } = Astro.props;
---
<div class="filters" role="group" aria-label="Filter posts by tag">
  <button type="button" data-tag="all" aria-pressed="true">All</button>
  {tags.map((tag) => <button type="button" data-tag={tag} aria-pressed="false">{tag}</button>)}
</div>
```

`blog/index.astro`：

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import TagFilter from '../../components/TagFilter.astro';
import { getCollection } from 'astro:content';

const today = new Date().toISOString().slice(0, 10);
const posts = (await getCollection('blog'))
  .filter((p) => !p.data.draft && p.data.date <= today)
  .sort((a, b) => b.data.date.localeCompare(a.data.date));
const tags = [...new Set(posts.flatMap((p) => p.data.tags))].sort();
const base = import.meta.env.BASE_URL;
---
<BaseLayout title="Writing · Zicong Yang" description="Notes on software engineering, computer vision, and research.">
  <div class="container measure" style="padding-top:40px">
    <h1>Writing</h1>
    <p class="muted">Technical notes, mostly in Chinese. {posts.length} posts. <a href={`${base}rss.xml`}>RSS</a></p>
    <TagFilter tags={tags} />
    <ul class="post-list" id="post-list">
      {posts.map((post) => (
        <li data-tags={post.data.tags.join(' ')}>
          <time datetime={post.data.date}>{post.data.date}</time>
          <a href={`${base}blog/${post.id}`}>{post.data.title}</a>
          <span class="lang-badge">{post.data.lang === 'zh' ? '中文' : 'EN'}</span>
        </li>
      ))}
    </ul>
  </div>
  <script is:inline>
    const buttons = document.querySelectorAll('.filters button');
    const rows = document.querySelectorAll('#post-list li');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        const tag = btn.dataset.tag;
        rows.forEach((row) => {
          row.hidden = tag !== 'all' && !(row.dataset.tags ?? '').split(' ').includes(tag);
        });
      });
    });
  </script>
</BaseLayout>
```

- [ ] **步骤 5：写 `blog/[slug].astro`**

```astro
---
import PostLayout from '../../layouts/PostLayout.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const today = new Date().toISOString().slice(0, 10);
  const posts = await getCollection('blog', ({ data }) => !data.draft && data.date <= today);
  const sorted = posts.sort((a, b) => b.data.date.localeCompare(a.data.date));
  return sorted.map((post, index) => ({
    params: { slug: post.id },
    props: { post, prev: sorted[index + 1], next: sorted[index - 1] },
  }));
}

const { post, prev, next } = Astro.props;
const { Content, headings } = await render(post);
const base = import.meta.env.BASE_URL;
---
<PostLayout
  title={post.data.title}
  description={post.data.summary}
  date={post.data.date}
  lang={post.data.lang}
  tags={post.data.tags}
  headings={headings}
>
  <Content />
  <div class="next-prev" slot="footer">
    <span>{prev ? <a href={`${base}blog/${prev.id}`}>← {prev.data.title}</a> : null}</span>
    <span>{next ? <a href={`${base}blog/${next.id}`}>{next.data.title} →</a> : null}</span>
  </div>
</PostLayout>
```

- [ ] **步骤 6：写 `rss.xml.ts`**

```ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const today = new Date().toISOString().slice(0, 10);
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.draft && p.data.date <= today)
    .sort((a, b) => b.data.date.localeCompare(a.data.date));

  return rss({
    title: 'Zicong Yang · Writing',
    description: 'Notes on software engineering, computer vision, and research.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.summary,
      link: `${import.meta.env.BASE_URL}blog/${post.id}/`,
    })),
  });
}
```

- [ ] **步骤 7：构建并断言文章与 RSS**

运行：
```bash
npm run build
ls dist/blog/*/index.html | wc -l
grep -c '<item>' dist/rss.xml
grep -c 'from-single-page-to-astro' dist/index.html
```
预期：文章页 `1`、RSS `<item>` `1`、首页出现示例文章链接 `1`。

- [ ] **步骤 8：预览检查 TOC 与代码高亮**

运行：`npm run dev`，打开 `/cv/blog/from-single-page-to-astro/`。
预期：桌面宽度下右侧目录 sticky；`<pre>` 内代码有 Shiki 配色；移动宽度目录折叠在正文上方；上下篇区域为空时不报错。`Ctrl+C` 停止。

- [ ] **步骤 9：Commit**

```bash
git add src/pages/blog src/pages/rss.xml.ts src/layouts/PostLayout.astro src/components/Toc.astro src/components/TagFilter.astro src/content/blog src/styles/global.css
git commit -m "feat: 实现博客列表、文章页与 RSS"
```

---

### 任务 8：About 双语、打印与旧链接

**文件：**
- 创建：`src/content/pages/about.en.md`、`src/content/pages/about.zh.md`、`src/pages/about.astro`、`src/pages/about/zh.astro`、`public/CV.html`
- 修改：`src/styles/global.css`

- [ ] **步骤 1：写 `about.en.md`**

```markdown
---
title: "About"
updated: "2026-11-07"
---

## Education

**B.E. in Software Engineering**, Zhuhai College of Science and Technology (formerly Jilin
University Zhuhai College), 2021.09 – 2025.07. GPA 3.64/4.0, top 1% of the major.

## Research

My work focuses on medical signal processing and industrial visual inspection. I designed
STFAC-ECGNet, a multiscale spatio-temporal fusion network for multi-lead ECG arrhythmia
detection, published in *Scientific Reports* (JCR Q1, first author). I also work on
diffusion-model-based defect detection and lightweight detection networks for cable surface
inspection.

## Skills

Python, C++, Java, PyTorch, OpenCV, Ultralytics YOLO, ONNX/TensorRT, PyQt5, SQLAlchemy,
RAG, Git, Linux.

## Awards

National Scholarship; Top 10 Student; First-Class Scholarship (three consecutive years);
MCM Meritorious Winner (top 7%); National Third Prize, CP Group Cup Market Analysis
Competition; National Excellent Research Report.

## Intellectual Property

Two patents (agricultural product component detection device; transport oxygenated crab box
structure) and five software copyrights in cross-border e-commerce and agricultural trade
systems.

## Contact

[402641915@qq.com](mailto:402641915@qq.com) ·
[Google Scholar](https://scholar.google.com/citations?user=0Ynn-awAAAAJ) ·
[ORCID](https://orcid.org/0009-0001-0948-3606) ·
[GitHub](https://github.com/YZC0421)
```

- [ ] **步骤 2：写 `about.zh.md`**

```markdown
---
title: "关于"
updated: "2026-11-07"
---

## 教育经历

**软件工程 本科**，珠海科技学院（原吉林大学珠海学院），2021.09 – 2025.07。
GPA 3.64/4.0，专业前 1%。

## 研究方向

主要关注医学信号处理与工业视觉检测。设计 STFAC-ECGNet 多尺度时空融合网络，用于多导联
心电心律失常检测，成果发表于 *Scientific Reports*（JCR Q1，第一作者）。另参与基于扩散
模型的缺陷检测与线缆表面轻量化检测网络研究。

## 技能

Python、C++、Java、PyTorch、OpenCV、Ultralytics YOLO、ONNX/TensorRT、PyQt5、
SQLAlchemy、RAG、Git、Linux。

## 荣誉

国家奖学金、十佳大学生、连续三年一等奖学金、美国大学生数学建模竞赛 M 奖（国际前 7%）、
正大杯市场调研大赛全国三等奖、中国共青团国家级优秀调研报告。

## 知识产权

发明专利两项（农业产品成分检测装置、运输充氧蟹盒结构），软件著作权五项，覆盖跨境电商
与农产品国际贸易系统。

## 联系方式

[402641915@qq.com](mailto:402641915@qq.com) ·
[Google Scholar](https://scholar.google.com/citations?user=0Ynn-awAAAAJ) ·
[ORCID](https://orcid.org/0009-0001-0948-3606) ·
[GitHub](https://github.com/YZC0421)
```

- [ ] **步骤 3：追加打印样式**

```css
.about-actions { display: flex; gap: 16px; margin: 20px 0 32px; font-size: 0.88rem; }
@media print {
  .site-header, .site-footer, .skip, .about-actions { display: none !important; }
  body { background: #fff; color: #000; font-size: 11pt; }
  .container { max-width: none; padding: 0; }
  a { color: #000; text-decoration: none; }
  h2 { break-after: avoid; }
  .print-block, li { break-inside: avoid; }
  @page { size: A4; margin: 16mm; }
}
```

- [ ] **步骤 4：写 `/about` 与 `/about/zh`**

`src/pages/about.astro`：

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getEntry, render } from 'astro:content';

const entry = await getEntry('pages', 'about.en');
if (!entry) throw new Error('about.en.md is missing');
const { Content } = await render(entry);
const base = import.meta.env.BASE_URL;
---
<BaseLayout title="About · Zicong Yang" description="Education, research, skills, and contact.">
  <Fragment slot="head">
    <link rel="alternate" hreflang="zh-CN" href={new URL(`${base}about/zh/`, Astro.site)} />
  </Fragment>
  <div class="container measure" style="padding-top:40px">
    <div class="about-actions">
      <button type="button" onclick="window.print()">Download CV (PDF)</button>
      <a href={`${base}about/zh`} hreflang="zh-CN">中文</a>
    </div>
    <div class="prose"><Content /></div>
  </div>
</BaseLayout>
```

`src/pages/about/zh.astro`：

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getEntry, render } from 'astro:content';

const entry = await getEntry('pages', 'about.zh');
if (!entry) throw new Error('about.zh.md is missing');
const { Content } = await render(entry);
const base = import.meta.env.BASE_URL;
---
<BaseLayout title="关于 · 杨梓聪" description="教育经历、研究方向、技能与联系方式。" lang="zh-CN">
  <Fragment slot="head">
    <link rel="alternate" hreflang="en" href={new URL(`${base}about/`, Astro.site)} />
  </Fragment>
  <div class="container measure" style="padding-top:40px">
    <div class="about-actions">
      <button type="button" onclick="window.print()">下载 CV (PDF)</button>
      <a href={`${base}about`} hreflang="en">English</a>
    </div>
    <div class="prose"><Content /></div>
  </div>
</BaseLayout>
```

- [ ] **步骤 5：写 `public/CV.html` 重定向**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=./about" />
    <link rel="canonical" href="./about" />
    <title>CV · Zicong Yang</title>
  </head>
  <body>
    <p>This page has moved to <a href="./about">/about</a>.</p>
  </body>
</html>
```

- [ ] **步骤 6：构建并验证双语与重定向产物**

运行：
```bash
npm run build
ls dist/about/index.html dist/about/zh/index.html dist/CV.html
grep -c '下载 CV' dist/about/zh/index.html
```
预期：三个文件均存在，中文页出现 `下载 CV`。

- [ ] **步骤 7：预览检查打印**

运行：`npm run dev`，打开 `/cv/about`。
预期：页面上方有 `Download CV (PDF)` 与 `中文`；点击 `中文` 进入 `/cv/about/zh`；浏览器打印预览为 A4、无导航与页脚、条目未断裂。`Ctrl+C` 停止。

- [ ] **步骤 8：Commit**

```bash
git add src/content/pages src/pages/about.astro src/pages/about public/CV.html src/styles/global.css
git commit -m "feat: 增加中英 About 页与打印样式"
```

---

### 任务 9：SEO、404、sitemap 与导航收尾

**文件：**
- 创建：`src/pages/404.astro`、`public/robots.txt`、`public/favicon.svg`
- 修改：`src/layouts/BaseLayout.astro`、`src/layouts/PostLayout.astro`、`src/components/Header.astro`、`astro.config.mjs`

- [ ] **步骤 1：在 `BaseLayout.astro` 增加 JSON-LD 与文章元信息**

在 `BaseLayout.astro` 顶部 frontmatter 中追加（与已有 `const base` 同一段），并在 `<head>` 末尾插入 script：

```ts
const personId = new URL(`${base}#person`, Astro.site).href;
const profile = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfilePage', mainEntity: { '@id': personId } },
    {
      '@type': 'Person',
      '@id': personId,
      name: 'Zicong Yang',
      jobTitle: 'Software Engineer',
      sameAs: [
        'https://scholar.google.com/citations?user=0Ynn-awAAAAJ',
        'https://orcid.org/0009-0001-0948-3606',
        'https://github.com/YZC0421',
      ],
    },
  ],
};
```

```astro
<script type="application/ld+json" set:html={JSON.stringify(profile)} />
```

- [ ] **步骤 2：写 `404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
const base = import.meta.env.BASE_URL;
---
<BaseLayout title="Not found · Zicong Yang" description="Page not found.">
  <div class="container measure" style="padding:80px 24px">
    <h1>404</h1>
    <p class="muted">This page does not exist.</p>
    <p><a href={base}>Back to home →</a></p>
  </div>
</BaseLayout>
```

- [ ] **步骤 3：写 `robots.txt` 与 `favicon.svg`**

`public/robots.txt`：

```
User-agent: *
Allow: /

Sitemap: https://yzc0421.github.io/cv/sitemap-index.xml
```

`public/favicon.svg`：

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#111827"/>
  <text x="16" y="22" font-family="Georgia, serif" font-size="16" fill="#ffffff" text-anchor="middle">Z</text>
</svg>
```

- [ ] **步骤 4：为 sitemap 排除草稿页**

修改 `astro.config.mjs` 的集成配置：

```js
integrations: [
  sitemap({
    filter: (page) => !page.includes('/404'),
  }),
],
```

- [ ] **步骤 5：构建并断言 404 与 sitemap**

运行：
```bash
npm run build
ls dist/404.html dist/sitemap-index.xml dist/robots.txt dist/favicon.svg
grep -c 'sitemap' dist/robots.txt
```
预期：四个文件存在，`robots.txt` 含 1 处 sitemap 声明。

- [ ] **步骤 6：预览检查导航高亮与移动菜单**

运行：`npm run dev`，分别打开 `/cv/publications`、`/cv/work`、`/cv/blog`、`/cv/about`。
预期：对应导航项为深色加粗；375px 宽度下显示 `Menu` 按钮，点击展开导航，页面无横向滚动。`Ctrl+C` 停止。

- [ ] **步骤 7：Commit**

```bash
git add src/pages/404.astro src/layouts/BaseLayout.astro public/robots.txt public/favicon.svg astro.config.mjs
git commit -m "feat: 补齐 SEO、404 与站点图标"
```

---

### 任务 10：构建校验、CI 部署、清理与文档

**文件：**
- 创建：`scripts/verify-build.mjs`、`.github/workflows/deploy.yml`、`README.md`
- 删除：`index.html`、`CV.html`（仓库根目录，迁移完成且 `public/CV.html` 已就位）

- [ ] **步骤 1：写 `scripts/verify-build.mjs`**

```js
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const checks = [];
const must = async (path, label) => {
  try {
    await access(path, constants.R_OK);
    checks.push([label, true]);
    return true;
  } catch {
    checks.push([label, false]);
    return false;
  }
};

const routes = [
  'dist/index.html',
  'dist/publications/index.html',
  'dist/work/index.html',
  'dist/blog/index.html',
  'dist/about/index.html',
  'dist/about/zh/index.html',
  'dist/404.html',
  'dist/rss.xml',
  'dist/sitemap-index.xml',
  'dist/CV.html',
];
for (const r of routes) await must(r, r);

const home = await readFile('dist/index.html', 'utf8');
checks.push(['home shows 3 publications', (home.match(/class="pub-item"/g) ?? []).length === 3]);

const pubs = await readFile('dist/publications/index.html', 'utf8');
checks.push(['publications has entries', (pubs.match(/class="pub-item"/g) ?? []).length >= 1]);
checks.push(['publications include doi links', pubs.includes('doi.org'));

const rss = await readFile('dist/rss.xml', 'utf8');
checks.push(['rss has items', rss.includes('<item>')]);

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
```

- [ ] **步骤 2：运行校验脚本**

运行：
```bash
npm run build
npm run verify
```
预期：逐条输出 `ok`，最后 `all checks passed`，退出码 0。

- [ ] **步骤 3：写 `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run check
      - run: npm run build
      - run: npm run verify
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **步骤 4：删除旧文件**

```bash
git rm index.html CV.html
```

预期：两个文件从工作区与暂存区移除；`public/CV.html` 仍在。

- [ ] **步骤 5：写 `README.md`**

````markdown
# cv

Personal academic site of Zicong Yang: publications, work, and writing.

Built with Astro 5, statically generated, deployed to GitHub Pages.

## Local

```bash
npm install
npm run dev      # http://localhost:4321/cv/
npm run check    # type + content schema check
npm test         # unit tests for schema and ordering rules
npm run build    # build to dist/
npm run verify   # assert build output
```

## Add a publication

1. Create `src/content/publications/<slug>.md` with the frontmatter defined in
   `src/lib/schema.ts`.
2. `doi` is required. Set `selected: true` only for entries that should appear on the home
   page.
3. Run `npm run check` and `npm run build`.

## Add a post

1. Create `src/content/blog/<slug>.md`, `lang` is `en` or `zh`, `tags` at least one,
   `summary` at most 160 characters.
2. `draft: true` keeps it out of the list, RSS, and sitemap.
3. Future dates publish automatically: entries dated after the build day are excluded.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`. The site is served from
`https://yzc0421.github.io/cv/`. If a custom domain is added, update `site` and `base` in
`astro.config.mjs`, add `public/CNAME`, and update `public/robots.txt`.

## Rollback

Re-run the last successful `Deploy to GitHub Pages` workflow, or `git revert` the offending
content commit. Build configuration changes revert the same way; no manual cleanup on Pages
is required.

## Notes

- No runtime CDN dependencies.
- Content is validated by Zod at build time; invalid frontmatter fails the build.
- Paper metadata was cross-checked against Crossref and confirmed manually.
````

- [ ] **步骤 6：全量验证**

运行：
```bash
rm -rf dist
npm test
npm run check
npm run build
npm run verify
```
预期：四步全部退出码 0，`verify` 输出 `all checks passed`。

- [ ] **步骤 7：验证草稿与未来日期不进入产物**

创建临时文件 `src/content/blog/draft-check.md`：

```markdown
---
title: "Draft check"
date: "2026-01-01"
lang: "en"
tags: ["test"]
summary: "Temporary fixture."
draft: true
---
This must not be published.
```

运行：

```bash
npm run build
grep -c 'Draft check' dist/blog/index.html dist/rss.xml dist/index.html
```

预期：三处均输出 `0`。随后删除该文件：

```bash
rm src/content/blog/draft-check.md
```

- [ ] **步骤 8：验证缺 doi 时构建失败**

```bash
cp src/content/publications/scientific-reports-2024.md /tmp/pub.bak
sed -i '' '/^doi:/d' src/content/publications/scientific-reports-2024.md
npm run build; echo "exit=$?"
```

预期：输出 `exit=1`，错误信息指出 `scientific-reports-2024.md` 缺少 `doi`。恢复：

```bash
cp /tmp/pub.bak src/content/publications/scientific-reports-2024.md
rm /tmp/pub.bak
```

注意：`sed -i ''` 为 macOS 语法；此步骤只用于本地验证，CI 不执行。

- [ ] **步骤 9：验证禁用 JS 与深浅色对比度**

用浏览器打开 `npm run preview`（`http://localhost:4321/cv/`），在 DevTools 中禁用 JavaScript 后刷新。
预期：首页、`/publications`、`/blog`、示例文章正文均可完整阅读；主题为浅色；仅筛选与复制按钮不可用。

切换深色模式后，用 DevTools 取样正文与背景：浅色约 `#111827` on `#ffffff`、深色约 `#e5e7eb` on `#0b1120`，两者对比度均 ≥ 12:1，满足 4.5:1 的下限。

- [ ] **步骤 10：Commit**

```bash
git add scripts/verify-build.mjs .github/workflows/deploy.yml README.md
git add -A
git commit -m "chore: 增加构建校验、部署流水线与项目文档"
```

- [ ] **步骤 11：推送并观察部署（需用户授权）**

```bash
git push origin main
```

预期：GitHub Actions `Deploy to GitHub Pages` 成功；`https://yzc0421.github.io/cv/` 可访问；
`https://yzc0421.github.io/cv/CV.html` 跳转至 `/cv/about`。

---

## 规格覆盖对照

| 规格章节 | 对应任务 |
| --- | --- |
| 5.1 路由 | 任务 4、5、6、7、8、9 |
| 5.2 首页区块 | 任务 5 |
| 5.3 导航 | 任务 1、任务 9 |
| 6.1 publications | 任务 2、3、4 |
| 6.2 work | 任务 5、6 |
| 6.3 blog | 任务 2、7 |
| 6.4 pages | 任务 8 |
| 6.5 校验规则 | 任务 2、3 |
| 7 技术架构 | 任务 1、2、7 |
| 8 双语与 SEO | 任务 8、9 |
| 9 视觉规范 | 任务 1、4、5、6、7、8 |
| 10 可访问性 | 任务 1、4、7、9 |
| 11 部署与回滚 | 任务 10 |
| 12 错误处理 | 任务 1、2、4、7、10 |
| 13 迁移步骤 | 任务 1–10 |
| 14 验收标准 | 任务 10（第 2 条由 `verify-build.mjs` 覆盖，其余为手工检查） |
| 15 风险 | 任务 3（核对表）、任务 10（部署实测） |
