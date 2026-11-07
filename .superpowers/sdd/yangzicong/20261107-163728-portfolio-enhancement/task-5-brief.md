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

