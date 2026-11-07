# 个人学术主页改版 · 规格说明

- 状态：待用户审查
- 会话：`.superpowers/sdd/yangzicong/20261107-115018-academic-homepage/`
- 作者：杨梓聪
- 日期：2026-11-07

## 1. 背景

当前站点是 GitHub Pages 上的单页简历：`index.html` 与 `CV.html` 内容逐字节相同，共 786 行、约 55KB。样式依赖 Tailwind CDN 与 FontAwesome CDN，中英双语靠 `.en-text` / `.cn-text` 双写加运行时 JS 切换。仓库仅有 4 次提交。

随着论文、项目、文章数量增长，现有结构暴露出四个问题：

1. 同一份内容存在两份文件、两种语言共四处副本，改一次内容要改多处。
2. 双语切换不改变 URL，搜索引擎只能索引一份混排文本，分享链接也无法指定语言。
3. 依赖运行时 CDN，断网或被墙时排版失效；Tailwind CDN 在生产环境有官方告警。
4. 论文与项目只是简历中的段落，无法承载详情、筛选、引用导出，也没有文章系统。

## 2. 目标

1. 建立三类内容板块：学术主页（Publications）、Work（经历与项目）、Blog（技术文章）。
2. 内容与表现分离：论文、项目、文章、About 全部为结构化内容文件，页面由静态构建生成。
3. 论文作为第一资产：首页首屏之后立即呈现精选论文，独立页面支持筛选与 BibTeX 导出。
4. 彻底移除运行时 CDN 依赖，构建产物可在断网环境正常显示。
5. 中英内容以独立静态页面或语言标记呈现，切换不依赖运行时 DOM 操作。
6. 保留并强化可打印的 CV 输出。

## 3. 非目标

评论系统、站内搜索、访问统计、全站逐篇翻译、CMS 后台、双向链接、用户账户、暗色之外的皮肤、E2E 测试框架。

## 4. 受众与成功标准

**受众**

- 国际同行与潜在导师：关心研究方向、论文质量、作者位次。
- 招聘方：关心工程能力、技术栈、可验证的项目结果。
- 技术读者：通过文章判断深度。

**成功标准**

- 陌生访客在首屏 5 秒内知道"这个人研究什么、最强成果是什么"。
- 任何一篇论文可在 2 次点击内拿到 DOI 与 BibTeX。
- 新增一篇论文或文章只需新增一个 Markdown 文件，不修改页面代码。
- 构建产物无第三方运行时依赖，`dist/` 可直接静态托管。

## 5. 信息架构

### 5.1 路由

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/` | Home | Hero、精选论文、精选 Work、最新文章、About 摘要 |
| `/publications` | Publications | 全量论文、筛选、BibTeX |
| `/work` | Work | 经历时间线 + 项目卡片 |
| `/work/[slug]` | Work Detail | 单个项目详情 |
| `/blog` | Writing | 文章列表、标签、RSS 入口 |
| `/blog/[slug]` | Post | 文章正文、目录、上下篇 |
| `/about` | About (EN) | 英文简历页、CV 打印入口 |
| `/about/zh` | About (ZH) | 中文简历页 |
| `/404` | Not Found | 站内导航回退 |
| `/rss.xml` | RSS | 文章订阅 |
| `/sitemap-index.xml` | Sitemap | 由集成生成 |

旧路径 `/CV.html` 保留一个 HTML 文件，内含 `<meta http-equiv="refresh" content="0; url=/about">` 与指向 `/about` 的链接，保证历史链接不 404。

### 5.2 首页区块顺序

1. **Hero**：姓名、一句话定位（Medical Signal Processing · Computer Vision）、Google Scholar / ORCID / GitHub / Email 图标链接。
2. **Selected Publications**：3 条，右上角 `All publications →`。
3. **Selected Work**：3 张卡片，右上角 `All work →`。
4. **Latest Writing**：最近 2 篇，`draft` 与未来日期不计入；集合为空时整个区块不渲染。
5. **About 摘要 + Download CV**：两段简介，按钮指向 `/about` 的打印视图。

### 5.3 导航

`Zicong Yang` 字标（链接 `/`）+ Publications / Work / Writing / About + 深色切换。移动端（<768px）折叠为菜单按钮，使用原生 `<details>` 实现，不引 JS 框架。

## 6. 内容模型

内容统一放在 `src/content/`，由 Astro Content Collections + Zod 校验。

### 6.1 publications

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| `title` | string | 是 | 原文标题，不做改写 |
| `authors` | string[] | 是 | 完整作者顺序；站点渲染时把 `Zicong Yang` 加粗 |
| `venue` | string | 是 | 期刊或会议全称 |
| `venueShort` | string | 否 | 列表紧凑显示用 |
| `year` | number | 是 | 四位年份，取自出版方元数据 |
| `type` | `journal \| conference` | 是 | — |
| `indexing` | `Q1 \| Q2 \| Q3 \| Q4 \| EI \| none` | 是 | 对应现有徽标语义 |
| `role` | `first \| second \| third \| other` | 是 | 第四作者及以后统一为 `other`；用于"一作"筛选与排序 |
| `doi` | string | 是 | 不含 `https://doi.org/` 前缀 |
| `url` | string | 否 | 出版方页面 |
| `bibtex` | string | 否 | 缺省时构建期由字段生成 |
| `selected` | boolean | 否 | 默认 `false` |
| `date` | string | 是 | `YYYY-MM-DD`，用于同年级排序 |

**首页精选规则**：先取 `selected === true`；不足 3 条时按 `role === 'first'` 且 `date` 倒序补齐；仍不足则按 `date` 倒序取剩余条目。结果恒为 3 条（总数不足 3 时取全部）。规则在构建期计算，页面不维护手写列表。

**列表排序**：`date` 倒序；同日期时 `role` 优先级 `first > second > third > other`。

### 6.2 work

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| `title` | string | 是 | 职位名或项目名 |
| `org` | string | 是 | 公司/实验室/竞赛主体 |
| `kind` | `experience \| project` | 是 | 决定渲染到时间线还是卡片区 |
| `role` | string | 是 | 如 `Software Engineer`、`Project Lead` |
| `start` / `end` | string | 是 | `YYYY-MM`；`end` 允许 `present` |
| `summary` | string | 是 | 一句话，列表用 |
| `stack` | string[] | 否 | 技术栈 pills |
| `links` | `{label, url}[]` | 否 | Demo / 论文 / 代码 |
| `cover` | string | 否 | `src/assets/work/` 下图片；缺失时渲染纯文字卡 |
| `highlights` | string[] | 是 | 3–6 条事实性要点，来自现有内容，不新增未验证结论 |
| `order` | number | 否 | 时间线同月排序 |

### 6.3 blog

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| `title` | string | 是 | — |
| `date` | string | 是 | `YYYY-MM-DD`；晚于构建日的条目不进列表、RSS、sitemap，可用于定时发布 |
| `lang` | `en \| zh` | 是 | 列表显示语言徽标 |
| `tags` | string[] | 是 | 至少 1 个 |
| `summary` | string | 是 | 列表摘要，≤ 160 字符 |
| `draft` | boolean | 否 | 默认 `false`；`true` 不进列表、RSS、sitemap |

### 6.4 pages

`about.en.md`、`about.zh.md` 两个文件，frontmatter 含 `title`、`updated`，正文为 Markdown，分别渲染至 `/about` 与 `/about/zh`。

### 6.5 校验规则

Zod schema 在 `src/content.config.ts` 定义：

- 论文缺 `doi`、`authors` 为空、`year` 不在 2000–2100、`date` 非法格式 → 构建失败并指出文件路径。
- work 的 `start > end`（`present` 除外）→ 构建失败。
- blog `summary` 超过 160 字符 → 构建失败。
- 未知 frontmatter 字段由 schema 忽略，不中断构建。

## 7. 技术架构

### 7.1 栈

- Astro 5 + TypeScript，`output: 'static'`，锁定 minor 版本。
- 不引入 React/Vue/Svelte 集成。
- 交互仅三处：主题切换、BibTeX 复制、列表前端筛选，均为原生 JS（≤ 3KB，内联模块）。
- Markdown 代码高亮使用 Astro 内置 Shiki，主题 `github-light` / `github-dark` 随配色切换。
- `@astrojs/rss` 生成订阅源，`@astrojs/sitemap` 生成站点地图。

### 7.2 目录结构

```
.
├── .github/workflows/deploy.yml
├── public/
│   ├── .nojekyll
│   └── CV.html                # 旧链接重定向
├── scripts/
│   └── fetch-crossref.mjs     # 一次性元数据补全，不参与构建
├── src/
│   ├── assets/work/           # 项目封面，可选
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── PublicationItem.astro
│   │   ├── WorkCard.astro
│   │   ├── PostList.astro
│   │   ├── TagFilter.astro
│   │   ├── ThemeToggle.astro
│   │   ├── BibtexButton.astro
│   │   └── Toc.astro
│   ├── content/
│   │   ├── publications/*.md
│   │   ├── work/*.md
│   │   ├── blog/*.md
│   │   └── pages/about.{en,zh}.md
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── PageLayout.astro
│   │   └── PostLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── publications.astro
│   │   ├── work/index.astro
│   │   ├── work/[slug].astro
│   │   ├── blog/index.astro
│   │   ├── blog/[slug].astro
│   │   ├── about.astro
│   │   ├── about/zh.astro
│   │   ├── rss.xml.ts
│   │   └── 404.astro
│   ├── styles/global.css
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

### 7.3 样式

- 单一 `global.css` + CSS 变量，不使用 Tailwind。
- 变量分三组：颜色（`--bg`、`--fg`、`--muted`、`--border`、`--accent`）、排版（`--font-serif`、`--font-sans`、字号阶梯）、布局（`--measure: 720px`、间距）。
- 深色模式：`:root` 定义浅色，`[data-theme='dark']` 覆盖；`ThemeToggle` 读 `localStorage.theme`，缺省时用 `prefers-color-scheme`。首屏内联一小段脚本设置 `data-theme`，避免闪烁。
- 无外部字体请求：正文 `-apple-system, "Segoe UI", "Noto Sans SC", sans-serif`；标题 `"Source Serif 4", "Georgia", "Songti SC", serif`（未安装时回退本地衬线）。

### 7.4 组件职责

| 组件 | 职责 | 依赖 |
| --- | --- | --- |
| `BaseLayout` | html/head、meta、主题脚本、Header/Footer | — |
| `Header` | 导航、当前页高亮、移动菜单 | `ThemeToggle` |
| `Hero` | 姓名、定位、社交链接 | 内容常量 |
| `PublicationItem` | 单条论文渲染、徽标、DOI、BibTeX 按钮 | `BibtexButton` |
| `WorkCard` | 项目卡片、stack、链接 | — |
| `PostList` | 文章列表、日期、语言徽标、标签 | `TagFilter` |
| `TagFilter` | 前端 DOM 过滤，`aria-pressed` 状态 | — |
| `Toc` | 从 Markdown headings 生成，桌面 sticky | — |

### 7.5 数据流

Markdown frontmatter → `content.config.ts` Zod 校验 → `getCollection()` → 页面/组件渲染 → 静态 HTML。构建期完成筛选、排序、精选、RSS、sitemap；运行期不发任何数据请求。

论文元数据补全使用一次性脚本 `scripts/fetch-crossref.mjs`：按 DOI 调 Crossref API，输出候选 frontmatter 到 `scripts/out/`，由人工核对后写入 `src/content/publications/`。该脚本不进入构建流程。

## 8. 双语与 SEO

- 站点骨架英文，`<html lang="en">`。
- `/about` 与 `/about/zh` 各自完整，互加 `<link rel="alternate" hreflang>`；导航在 `/about` 上提供 `中文` 链接，反之提供 `English`。
- 文章按自身 `lang` 渲染 `<html lang>`，列表与文章页显示 `EN` / `中文` 徽标；不生成翻译副本。
- 每页输出 `title`、`description`、`canonical`、`og:title`、`og:description`、`og:type`、`og:url`；文章页补 `article:published_time`、`article:tag`。
- 首页与 `/about` 输出 JSON-LD `ProfilePage` + `Person`（`name`、`jobTitle`、`sameAs`：Scholar、ORCID、GitHub）。
- `robots.txt` 允许全站，`sitemap-index.xml` 自动生成。

## 9. 视觉规范

- 版心 `--measure: 720px`，文章页 680px；左右留白随视口伸缩，最大容器 1120px。
- 层级靠字号与留白：H1 2.25rem、H2 1.5rem、H3 1.125rem、正文 1rem / 1.7；不使用卡片阴影堆叠，分隔用 1px `--border`。
- 强调色 `#1d4ed8`；论文徽标沿用现有语义：Q1 琥珀（`#b45309` on `#fffbeb`）、Q4 紫（`#7e22ce` on `#f3e8ff`）、EI 绿（`#047857` on `#ecfdf5`），深色模式降低背景亮度、提高文字亮度。
- 论文条目结构：标题链接 → 作者（本人加粗）→ venue · 徽标 · 年份 → `DOI` / `BibTeX` 两个文字按钮。
- Work 卡片：桌面 2 列、移动 1 列，含标题、一句话、stack pills；无封面时不渲染图片区。
- 文章页：正文 680px，TOC 在 ≥1024px 时右侧 sticky，移动端折叠到正文上方。
- 响应式断点：`<768px` 单列、导航折叠；`768–1024px` 双列 Work；`≥1024px` 完整布局。
- 打印：`@media print` 隐藏导航、页脚、主题切换；`/about` 与 `/about/zh` 设置 A4 页边距 16mm、`break-inside: avoid` 防止条目跨页断裂。
- 动效仅用于链接 hover 与主题切换的 150ms 颜色过渡；`prefers-reduced-motion: reduce` 时全部关闭。

## 10. 可访问性

- 正文与背景对比度 ≥ 4.5:1，大字 ≥ 3:1；浅色与深色两套配色均需实测。
- 全站键盘可达，焦点环 `2px solid var(--accent)` 且不被 `outline: none` 移除。
- 页面顶部提供 skip link（跳至 `#main`）。
- 图标按钮带 `aria-label`；筛选按钮用 `aria-pressed`；移动菜单用 `<details>` 原生语义。
- 图片必须有 `alt`，装饰图 `alt=""`。
- 标题层级不跳级，每页唯一 H1。

## 11. 部署与回滚

- 仓库保持 `YZC0421/cv`，GitHub Pages 由 Actions 发布：`npm ci` → `npm run check`（`astro check`）→ `npm run build` → 上传 `dist/`。
- Actions 使用 Node 22 LTS，`actions/configure-pages`、`upload-pages-artifact`、`deploy-pages` 三个官方 action。
- 若配置自定义域名，`astro.config.mjs` 的 `site` 与 `base` 同步修改，并在 `public/CNAME` 写入域名；未配置时使用 `https://yzc0421.github.io/cv/`，所有内部链接通过 `Astro.url`/`base` 生成，禁止硬编码根路径。
- 回滚：部署失败时在 Actions 中重跑上一成功 workflow；内容错误用 `git revert` 单个内容 commit，不改构建配置。

## 12. 错误处理与降级

| 场景 | 行为 |
| --- | --- |
| frontmatter 校验失败 | 构建失败，输出文件路径与字段名，不生成半成品 |
| `draft: true` 或未来日期 | 不进列表、RSS、sitemap，但保留文件 |
| work 缺 `cover` | 渲染纯文字卡，不留空白图框 |
| 论文缺 `bibtex` | 由 title/authors/venue/year/doi 生成 |
| 剪贴板不可用 | 按钮切换为"选中文本"提示，`window.getSelection` 选中 BibTeX 代码块 |
| 无标签可选 | `TagFilter` 不渲染，避免空控件 |
| JS 被禁用 | 内容、导航、论文列表、文章全部可读；主题回退浅色；筛选与复制不可用但不影响阅读 |

## 13. 迁移与实施步骤

1. **脚手架**：`npm create astro`（minimal, TypeScript），配置 `site`/`base`，建立 `global.css` 与设计 token，跑通空首页。
2. **内容集合**：定义 schema，录入 6 篇论文与 4 个项目的初始草稿；用 Crossref 脚本拉取候选元数据，产出核对表交用户确认后才定稿。
3. **页面骨架**：`BaseLayout`、`Header`、`Footer`、`Hero`、首页三区块。
4. **Publications**：列表、筛选、徽标、BibTeX 复制、首页精选规则。
5. **Work**：时间线 + 卡片 + 4 个详情页。
6. **Blog**：列表、标签、文章布局、TOC、RSS、示例文章《从单页 HTML 到 Astro》。
7. **About**：中英两页、打印样式、CV 输出、旧 `/CV.html` 重定向。
8. **收尾**：SEO/JSON-LD/OG、404、sitemap、robots、CI、部署验证、删除旧 `index.html` 与重复的 `CV.html`。
9. **文档**：README 写清内容新增流程（新增论文/文章各一步）、本地命令、部署说明。

## 14. 验收标准

1. `npm run check` 与 `npm run build` 均成功，无 TypeScript 与 schema 错误。
2. 构建后以下路径返回 200 且内容非空：`/`、`/publications`、`/work`、4 个 `/work/*`、`/blog`、示例文章、`/about`、`/about/zh`、`/rss.xml`、`/sitemap-index.xml`、`/404`。
3. 375px 视口下无横向滚动；768px、1024px 断点布局符合第 9 节。
4. 浅色与深色模式下正文对比度 ≥ 4.5:1（用浏览器 DevTools 取样验证）。
5. `/about` 打印预览为 A4、无导航与页脚、条目未跨页断裂。
6. 命令行 `curl` 抓取 `/`，HTML 中出现 3 条精选论文标题，且顺序符合第 6.1 节规则。
7. 关闭 JavaScript 后首页、`/publications`、`/blog`、文章页正文可完整阅读。
8. GitHub Actions 部署成功，线上首页可访问，`/CV.html` 跳转至 `/about`。
9. 新增一篇 `draft: true` 文章后构建，该文章不出现在 `/blog`、`/rss.xml`、`sitemap`。
10. 删除（或改名）任一论文的 `doi` 字段后构建，进程以非零码退出并指出该文件。

## 15. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 论文元数据错误（作者顺序、年份、卷期） | Crossref 候选 + 用户核对表，确认后才提交；核对未通过条目不进首页精选 |
| 项目详情被扩写成未发生的事实 | 只重排现有 CV 文本；新增描述由用户提供，缺信息不渲染 |
| GitHub Pages 子路径导致资源 404 | 统一用 `base` 变量生成链接，部署后实测线上 CSS 与图片 |
| 英文文案质量 | About 英文正文由用户审阅后再合并 |
| Astro 升级破坏构建 | 锁定 minor 版本，CI 使用 `npm ci` |
| 内容量少导致页面显空 | 首页"最新文章"空态不渲染；Publications 6 条已足够 |

## 16. 决策记录

- **Astro 而非手写构建**：博客与论文都需要 Markdown、代码高亮、RSS、sitemap，自建这些能力的长期成本高于引入一个静态生成器；Astro 默认零 JS，产物仍是纯静态。
- **不引 Tailwind/React**：页面交互极少，手写 CSS 体积更小、可控；React 只会增加运行时与构建复杂度。
- **Experience 与 Projects 合并为 `/work`**：项目数量 4 个、经历 5 段，分两个一级页面会让导航臃肿，且项目与经历在叙事上连续。
- **英文骨架 + About 双语**：论文与项目面向国际同行；强制全站双语会让每篇文章都背上翻译成本，最终导致断更。
- **E2E 不做**：站点为静态内容站，构建校验脚本 + 人工检查清单覆盖主要风险；引入 Playwright 的维护成本高于收益。
- **不做站内搜索**：论文 6 条、文章初期不足 10 篇，浏览器原生 `Ctrl+F` 足够。
