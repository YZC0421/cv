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

