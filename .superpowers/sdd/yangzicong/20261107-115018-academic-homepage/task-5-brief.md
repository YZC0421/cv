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

