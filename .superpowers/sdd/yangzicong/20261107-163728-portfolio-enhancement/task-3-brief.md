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

