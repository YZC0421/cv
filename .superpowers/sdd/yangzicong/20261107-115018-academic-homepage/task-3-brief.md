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

