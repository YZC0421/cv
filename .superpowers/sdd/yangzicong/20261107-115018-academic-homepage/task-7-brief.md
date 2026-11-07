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

