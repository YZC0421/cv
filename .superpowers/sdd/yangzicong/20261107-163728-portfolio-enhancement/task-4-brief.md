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

