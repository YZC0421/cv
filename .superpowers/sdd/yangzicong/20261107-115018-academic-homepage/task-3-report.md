# 任务 3 实现报告

## 实现了什么

- `scripts/fetch-crossref.mjs`：按 DOI 或标题查询 Crossref，输出候选 frontmatter 到
  `scripts/out/`，并生成 `review.md` 核对表；单条失败只告警，不中断。
- `src/content/publications/` 下 6 个 Markdown 文件，字段按 `publicationSchema`：
  - `scientific-reports-2024.md`：Q1，一作，`selected: true`。
  - `cisse-2024.md`：Q4，一作。
  - `mst-2025.md`：Q1，`role: third`（按 CV 的"学生三作"口径）。
  - `cvidl-2024-wheat.md`：EI，一作，`selected: true`。
  - `cvidl-2024-garbage.md`：EI，`role: second`（按 CV 的"学生二作"）。
  - `ipmlp-2024.md`：EI，`role: other`（按 CV 的"学生四作"）。
- `.gitignore` 增加 `scripts/out/`，候选数据不进入仓库。

## 核对结果（用户确认）

- 作者位次以 CV 口径为准：mst = 学生三作、garbage = 学生二作、ipmlp = 学生四作。
- `cisse-2024` 的 venue 使用 `Studies in Computational Intelligence`，`venueShort: CISSE 2024`。
- 标题保留出版方 Crossref 原始写法（mst 与 ipmlp 为句式小写）。
- URL 优先使用出版方页面（Nature、IOP、IEEE、ACM），DOI 全部保留。

## 测试与验证

- `node scripts/fetch-crossref.mjs`：6/6 命中，无警告。
- `npm run build`：成功，6 篇内容通过 Zod 校验。
- `npm run check`：17 files，0 errors，0 warnings，0 hints。

## 修改的文件

新增：`scripts/fetch-crossref.mjs`、`src/content/publications/*.md`（6 个）。
修改：`.gitignore`。

## 自审发现

- 所有 `date` 字段加引号，避免 YAML 把 `2024-09-06` 解析成 Date。
- `cisse-2024` 的 Crossref 类型是 book chapter，按实际会议属性写为 `conference`。
- `mst-2025` 的 Crossref 日期为 2025-11-07（在线发布日）。

## 疑虑

- `cisse-2024` 的 Crossref issued 只有年份，`date` 取 `2024-01-01`；若你知道准确月份可后补。
- `mst-2025` 的 `date` 为在线发布日，可能与纸刊期号不同。
