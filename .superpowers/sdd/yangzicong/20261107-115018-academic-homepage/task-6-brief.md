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

