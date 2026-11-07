# 个人学术主页增强 · 规格说明

- 状态：待用户审查
- 会话：`.superpowers/sdd/yangzicong/20261107-163728-portfolio-enhancement/`
- 日期：2026-11-07
- 前置：`20261107-115018-academic-homepage` 已完成并上线

## 1. 背景

站点已上线：Astro 5 静态站，6 篇论文、9 条 work、1 篇文章、双语 About、RSS/sitemap/404、构建校验与 Pages 部署。评审发现四类遗留：

1. 数据模型有冗余与缺失：`publications.bibtex` 与 `work.cover` 无消费方；缺学生位次、卷期页码、论文与项目的关联字段。
2. 缺"研究主题"维度：论文与项目只能按时间平铺，首页无法表达"我在研究什么"。
3. 项目详情是要点列表，缺少问题、方法、结果的叙事结构。
4. 工程上有重复：work 排序写两遍、站点常量散落、CI 无 PR 检查、依赖用 `^` 与"锁定 minor"不一致。

## 2. 目标

- **P1**：`topics` 数据模型、首页 Research Areas、论文与项目主题筛选、位次徽标、项目四段式、CV PDF 下载。
- **P2**：博客标签独立页、OG image、BibTeX 补全、论文与项目互链。
- **P3**：`lib/work.ts`、`lib/site.ts`、依赖精确版本、CI PR 检查、校验脚本扩展。

## 3. 非目标

评论、站内搜索、访问统计、全站逐篇翻译、CMS、独立主题页（`/research/[topic]`）、论文年份分组、筛选状态同步到 URL、文章目录支持 h4、新的视觉主题。

## 4. 主题模型

新增 `src/lib/topics.ts`，作为主题的唯一来源：

```ts
export const topicSlugs = ['medical-signal', 'industrial-vision'] as const;
export type TopicSlug = (typeof topicSlugs)[number];

export const topics: { slug: TopicSlug; name: string; blurb: string }[] = [
  {
    slug: 'medical-signal',
    name: 'Medical Signal Processing',
    blurb: 'ECG arrhythmia detection and cardiac risk modelling with multiscale deep networks.',
  },
  {
    slug: 'industrial-vision',
    name: 'Industrial Visual Inspection',
    blurb: 'Defect detection and lightweight deployment for manufacturing and agriculture.',
  },
];

export function topicName(slug: TopicSlug): string;
```

约束：

- 首页 Research Areas、筛选按钮、徽标全部从 `topics` 读取，不得在页面里硬编码主题名。
- schema 的 `topics` 字段用 `z.enum(topicSlugs)`，非法值构建失败。

## 5. 数据模型变更

### 5.1 publications

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| `topics` | `TopicSlug[]` | 是 | 至少 1 个，去重 |
| `authorNote` | string | 否 | ≤ 40 字符，如 `Student 3rd author` |
| `volume` | string | 否 | 期刊卷号 |
| `pages` | string | 否 | 页码范围，如 `1234-1245` |
| `relatedWork` | string[] | 否 | work 的 slug；构建期解析为 `/work/<slug>/` |
| `bibtex` | — | 删除 | 由字段自动生成 |

### 5.2 work

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| `topics` | `TopicSlug[]` | 否 | 无主题的项目仍可发布；首页 Research Areas 只取有主题的条目 |
| `problem` | string | 否 | Markdown 短段落，≤ 600 字符 |
| `approach` | string | 否 | 同上 |
| `results` | string | 否 | 同上 |
| `relatedPublications` | string[] | 否 | DOI 数组；构建期反查为论文链接 |
| `cover` | — | 删除 | 无素材、无消费方 |

### 5.3 关联校验

- `relatedWork` 中的 slug 必须存在于 `work` 集合，否则构建失败。
- `relatedPublications` 中的 DOI 必须存在于 `publications` 集合，否则构建失败。
- 校验在页面构建期完成（`getCollection` 后比对），不引入独立校验服务。

### 5.4 BibTeX

生成规则补 `volume` 与 `pages`；字段为空时省略对应行。引用 key 保持 `姓氏 + 年份`，同 key 冲突时追加 `a`、`b`（按集合内顺序）。

## 6. 页面与交互

### 6.1 首页

顺序：Hero → Research Areas → Selected Publications → Selected Work → Latest Writing → About。

`ResearchAreas.astro`：

- 每个主题一块：主题名、`blurb`、1–2 条代表成果（该主题下最新的一作论文 1 条 + 最新有主题的 work 条目 1 条，项目或经历均可；某一类为空时只显示另一类）。
- `View all →` 指向 `/publications/?topic=<slug>`。
- 主题无任何内容时整块不渲染。

### 6.2 `/publications`

- 筛选分三组：主题、位次、年份；组内单选，组间 AND。
- 主题按钮文案来自 `topics`，值为 slug；位次组为 `All / First author`；年份组由数据生成。
- 页面加载时读取 `?topic=`，若值合法则预置该组筛选并同步 `aria-pressed`。
- 筛选后结果为空时显示 `No publications match these filters.`（`aria-live="polite"`）。
- 条目徽标：`role === 'first'` 显示 `First author`；否则若有 `authorNote` 显示该值；否则显示 `Co-author`。
- 条目补主题徽标（小号，显示主题名）。

### 6.3 `/work`

- Projects 区增加主题筛选（`All` + 两个主题）；Experience 时间线不筛。
- 项目卡片显示主题徽标。
- 卡片与详情的排序统一走 `src/lib/work.ts`：项目按 `order` 升序、再按 `id`；经历按 `start` 倒序、再按 `id`。

### 6.4 项目详情

结构：标题与元信息（角色、组织、时间）→ Problem → Approach → Results → Role → Stack → Links → Related。

- `problem` / `approach` / `results` 存在则渲染为带小标题的段落；全部缺失时回退为 `highlights` 列表（保持现有页面不空白）。
- `Role` 段落显示 `role` 字段；`highlights` 只在四段全空时作为回退列表出现，不与四段同时渲染。
- `relatedPublications` 存在时渲染 `Related publication` 链接（标题 + venue）。

### 6.5 CV

- `src/lib/site.ts` 导出 `hasCvPdf()`，检查 `public/cv.pdf` 是否存在。
- 存在：`/about`、`/about/zh`、首页输出 `Download CV (PDF)` 直链（`withBase('cv.pdf')`），同时保留打印按钮。
- 不存在：只显示打印按钮。

### 6.6 博客标签页（P2）

- `/blog/tag/[tag]/` 每个标签一个静态页，列出该标签文章，复用 `PostList`。
- 文章列表与文章页的标签徽标改为链接到对应标签页。
- 无文章的标签不生成页面。

### 6.7 OG image（P2）

- `scripts/make-og.mjs` 用 `sharp` 将 1200×630 的 SVG（深底、姓名、两个研究方向）转为 `public/og.png`，随仓库提交。
- `BaseLayout` 输出 `og:image`（绝对 URL）与 `twitter:card=summary_large_image`。
- 新增 devDependency `sharp`，只用于生图脚本，不进入运行时。

### 6.8 互链（P2）

- 论文详情：当前没有独立详情页，`relatedWork` 在 `/publications` 条目内以 `Related work: <项目名>` 展示。
- 项目详情：`Related publication` 展示标题与 venue，链接到 DOI。

## 7. 工程变更（P3）

- `src/lib/work.ts`：`sortProjects()`、`sortExperience()`，首页与 `/work` 共用。
- `src/lib/site.ts`：`site`（姓名、定位、邮箱、社交链接、`hasCvPdf()`）。
- 依赖精确版本：`astro`、`@astrojs/rss`、`@astrojs/sitemap`、`zod`、`typescript`、`tsx`、`@astrojs/check` 去掉 `^`，以 lockfile 当前版本为准。
- `.github/workflows/deploy.yml` 增加 `pull_request` 触发；PR 上只运行 test/check/build/verify，不部署。
- `scripts/verify-build.mjs` 增加：主题徽标数量与内容匹配、`?topic=` 筛选按钮存在、CV 按钮在 PDF 存在时出现、标签页数量与标签数一致。

## 8. 内容迁移

1. 6 篇论文补 `topics`：
   - medical-signal：scientific-reports（ECG）、cisse（ECG）
   - industrial-vision：mst（缺陷检测）、cvidl-wheat（农作物病害）、cvidl-garbage（垃圾分类）、ipmlp（表面废弃物）
2. 补 `authorNote`：mst `Student 3rd author`、garbage `Student 2nd author`、ipmlp `Student 4th author`；一作三篇不填，徽标自动显示 `First author`。
3. 补 `volume` / `pages`：用 Crossref 元数据，人工核对后写入；核对未通过的不填。
4. 项目补 `topics`：心源性猝死预测归 `medical-signal`；Wordle、可口可乐调研、乡村振兴为应用类，`topics` 留空。同时从现有 `highlights` 提炼 `problem` / `approach` / `results`，无法从现有事实支撑的段落留空并进入待补清单。
5. 5 段经历补 `topics`（线缆检测、软壳蟹归 industrial-vision；其余留空）。
6. 产出 `待补清单.md` 到会话目录，列出每个项目缺哪些段落、需要什么素材。

## 9. 验收标准

1. `npm test`、`npm run check`、`npm run build`、`npm run verify` 全部通过。
2. 首页出现两块 Research Areas，各含主题名、定位句、1–2 条代表成果与 `View all` 链接。
3. `/publications/?topic=medical-signal` 打开后主题筛选已选中，列表只剩该主题条目。
4. 三组筛选可组合：主题 + 位次 + 年份同时生效；无结果时显示提示文本。
5. mst / garbage / ipmlp 条目显示对应的 `Student 3rd/2nd/4th author` 徽标；一作显示 `First author`。
6. 项目详情在三个段落存在时按 Problem → Approach → Results 渲染；三段全空的项目回退为 highlights 列表。
7. `public/cv.pdf` 存在时 About 中英页与首页出现 `Download CV (PDF)` 直链；删除该文件后重新构建，链接消失、打印按钮保留。
8. 每个标签生成 `/blog/tag/<tag>/`，页面文章数与标签匹配；标签徽标可点击进入。
9. `dist/og.png` 存在且为 1200×630；页面 head 含 `og:image` 与 `twitter:card`。
10. `relatedWork` 引用不存在的 slug 时构建失败并指出文件；`relatedPublications` 引用不存在的 DOI 同样失败。
11. `package.json` 依赖为精确版本；PR 触发的 workflow 不执行 deploy job。

## 10. 风险

| 风险 | 缓解 |
| --- | --- |
| topics 枚举与页面文案漂移 | 统一从 `lib/topics.ts` 读取，schema 用同一 slug 列表 |
| 关联引用失效 | 构建期校验，失败即中断 |
| 四段式素材不足导致页面单薄 | 缺失不渲染，回退 highlights，并产出待补清单 |
| CV PDF 与内容不同步 | README 说明手动更新流程 |
| OG 图片体积过大 | PNG 量化到 200KB 以内，必要时改 JPEG |
| PR 检查拖慢反馈 | PR 只跑 test/check/build/verify，缓存 npm |

## 11. 决策记录

- **方案 1（区块 + 筛选）而非独立主题页**：每个主题当前 3 篇论文，独立页会偏薄；筛选让存量内容产生结构，内容增长后再升级。
- **不新增 UI 框架**：筛选仍用原生 JS + `data-*`，与现有实现一致。
- **OG 用 sharp 而非 satori**：sharp 更常见、体积可控，且只需渲染一张固定模板。
- **标签页而不只是前端筛选**：让标签可被搜索引擎收录与直接分享，成本是一个 `getStaticPaths`。
- **保留 `highlights`**：四段式是增强而非替代，回退路径保证内容不完整时页面可用。
