# 博客系统需求提案 · 第二轮

> 基于 2026-11-14 的仓库状态。第一轮的 5 项能力已上线（写作流水线、语言边界、论文绑定、公式/图表/代码、链接门禁），这一轮不再重复管道，关注**分发、生产、维护**三件事。

## 0. 结论先行

1. **订阅源现在是坏的。** `src/pages/rss.xml.ts` 的 `content: post.body` 输出的是 Markdown 原文，读者在 Reeder/Feedly 里看到的是裸 ``` 围栏和 `$$` 公式，不是文章。
2. **分享卡还是全站一张。** `og:image` 固定指向 `public/og.png`，脚本只渲染拉丁文字；文章被分享到微信/X 时，卡片和内容无关。
3. **内容仍然只有 1 篇。** 论文绑定已经能用，但没有一篇 `paper-reading` 用上它。工具修好了，产出没有发生，说明下一步该给"写论文笔记"这件事做减法，而不是继续加通用功能。
4. **有一处隐形增长需要设闸。** `dist` 8.1M、58 个 JS 文件，其中 Mermaid 相关 chunk 3.2M。当前无人访问就不加载，但没有任何断言阻止它继续膨胀。

所以第二轮的优先级是：**让已发布的内容在站外可读（RSS/OG），让下一批内容更容易被生产（论文笔记流水线），让旧内容不骗人（保鲜），让图表能进正文（图片管线）。**

## 1. 现状盘点（只列与本轮相关的）

| 维度 | 事实 | 位置 |
| --- | --- | --- |
| 内容 | 1 篇中文文章；9 篇论文、7 个项目均无笔记 | `src/content/` |
| RSS | `content` 使用 `post.body`（Markdown 原文）；无 JSON Feed | `src/pages/rss.xml.ts`、`src/pages/zh/rss.xml.ts` |
| 分享图 | 全站一张 1200×630；字体为 Georgia/Helvetica 系统栈 | `src/layouts/BaseLayout.astro`、`scripts/make-og.mjs` |
| 更新日期 | `updated` 在 schema 中，文章页、RSS、sitemap 均未使用 | `src/lib/schema.ts` |
| 图片 | `public/images` 不存在；无文章使用 `cover`；正文无图片 | `src/pages/blog/[slug].astro` |
| 图表 | Mermaid 渲染为裸 `<div><svg>`，无标题、无替代文本 | `src/layouts/PostLayout.astro` |
| 结构化数据 | `BlogPosting` 只有 headline/description/datePublished/keywords/author | `src/layouts/PostLayout.astro` |
| 搜索 | 无 `data-pagefind-meta`/filter；中英结果不区分 | `src/pages/search.astro` |
| 体积 | `dist` 8.1M，58 个 JS；Mermaid 相关 3.2M | 构建产物 |
| 外链 | 内容中 16 条外部 URL，会随文章增长 | `src/content/` |

## 2. 机会定义

- **产品**：个人技术博客，是简历与论文的解释层。
- **这一轮的目标**：让内容**出得去**（订阅与分享）、**写得动**（论文笔记）、**不过期**（保鲜）、**装得下图**（图表管线）。
- **读者**：订阅者（RSS）、社媒看到分享卡的人、从论文 DOI 找过来的同行。
- **可观测信号**：
  - 至少 2 篇 `paper-reading` 使用 `paper` 字段；
  - RSS 阅读器里代码块与公式正常显示（人工检查 1 次）；
  - 每篇文章的 `og:image` 唯一且返回 200；
  - 12 个月前的文章自动带"可能过时"提示，且能被 `reviewed` 关闭。

### 机会树

```text
结果：内容能被订阅、被分享、被持续生产
├── A 出不去       → P1 RSS 全文 · P2 分享卡 · E2 结构化数据
├── B 写不动       → P3 论文笔记流水线
├── C 会过期       → P4 内容保鲜
├── D 装不下图     → D1 图片与图注
└── E 会悄悄变坏   → E4 体积预算 · E5 外链巡检
```

## 3. 三视角想法池（15 条）

### 产品经理视角

- **P1 RSS 是给人读的**
  用同一套 Markdown 管线把正文渲染成 HTML 放进 feed，并补 `/feed.json`。解决"订阅者看到裸 Markdown"。
- **P2 每篇文章自己的分享卡**
  构建期为每篇生成 1200×630，含标题、分类、日期与站点名。解决"分享出去永远是同一张图"。
- **P3 论文笔记流水线**
  `npm run new -- --paper <DOI>` 直接生成带骨架、关联、标签的笔记；`--translate-of` 生成译文骨架。解决"知道该写但不知道从哪下手"。
- **P4 内容保鲜**
  渲染 `updated` 与 `changelog`，超过 12 个月自动提示"可能过时"，`reviewed` 可续期。解决技术文半年后失效。
- **P5 讨论与勘误入口**
  文末固定一块指向 GitHub Discussions，按标题预填。零后端，替代评论系统。

### 设计师视角

- **D1 图片与图注**
  正文图片走 `Figure` 组件：必须有 alt 与说明文字，暗色下加边框，窄屏不溢出。解决论文笔记里"图放不进去"。
- **D2 阅读位置**
  顶部进度条、目录高亮当前节、标题锚点一键复制。解决长文读到一半失去位置感。
- **D3 中文混排**
  CJK 与拉丁/数字之间留白、标点挤压、行高按字体调。解决中英混排段落的粗糙观感。
- **D4 空状态**
  英文博客 0 篇时给出"订阅中文 RSS / 按主题浏览"，而不是一句 "0 posts"。
- **D5 引用本文**
  文末"复制引用（BibTeX）"与"复制链接"。对研究者，"引用"比点赞有意义。

### 工程师视角

- **E1 分享图生成管线**
  构建后生成 `dist/og/<slug>.png`，`verify` 断言每张图存在且为 1200×630。
- **E2 结构化数据补全**
  `BlogPosting` 增加 `dateModified`、`image`、`inLanguage`、`wordCount`、`articleSection`、面包屑。
- **E3 搜索元数据**
  `data-pagefind-meta` 写入日期/分类/语言，搜索页按语言过滤并本地化空状态。
- **E4 体积预算**
  断言 `dist` 总量、JS chunk 数与单页加载量；超过阈值构建失败。Mermaid 3.2M 是第一个要盯住的对象。
- **E5 外链存活巡检**
  每周定时 job 检查外部链接，失败开 issue，不阻断构建。

## 4. 优先级 Top 5

评分：战略契合 / 读者影响 / 成本（越高越省）/ 差异化，各 1–5 分。

| # | 需求 | 视角 | 战略 | 影响 | 成本 | 差异化 | 合计 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 论文笔记流水线（P3） | 产品+工程 | 5 | 5 | 4 | 4 | 18 |
| 2 | RSS 全文可读 + JSON Feed（P1） | 产品+工程 | 4 | 4 | 5 | 2 | 15 |
| 3 | 分享卡 + 结构化数据（P2+E1+E2） | 产品+设计 | 4 | 4 | 3 | 3 | 14 |
| 4 | 内容保鲜（P4） | 产品 | 4 | 3 | 5 | 3 | 15 |
| 5 | 图片与图注（D1） | 设计 | 4 | 4 | 3 | 2 | 13 |

> 第 1 项依赖一个前提：确实会写论文笔记。若不打算写，请用"系列与归档"替换它，而不是硬做模板。

---

### 1. 论文笔记流水线：从 DOI 到可预览的骨架

**一句话**：一条命令把某篇论文变成结构完整的笔记草稿，作者只负责填内容。

**为什么现在做**
第一轮已经能把笔记挂到论文上，但一篇都没有。写论文笔记的真实阻力不是"不会写"，而是"每次都要重新决定标题、标签、结构、关联、中英版本"。这些都可以由机器填。

**范围**
- `npm run new -- --paper 10.1109/cvidl62147.2024.10604082`：
  - 解析 DOI 或 publication id，取标题、venue、年份、topics；
  - 生成 `category: paper-reading`，`tags` 取论文 topics 对应的标签；
  - 标题预填为 `《论文标题》阅读笔记`，`summary` 留 TODO；
  - 正文插入固定骨架：`问题 / 方法 / 实验 / 局限 / 可复现性 / 引用`，每节一条提示语；
  - `paper:` 自动写入 DOI。
- `--translate-of <slug>`：生成另一语言的同结构草稿，写入 `translationOf`，标题与摘要留空待译。
- `post:check` 增加校验：`paper` 必须可解析、`translationOf` 必须指向另一语言的文章、`series`（若使用）必须存在。

**不做**
自动摘要、AI 生成正文、抓取论文全文。笔记的价值在于作者的判断。

**验收标准**
- 从命令到 `npm run dev` 看到带骨架的草稿，命令数 ≤ 2。
- 骨架六节在页面上按顺序渲染，目录可跳转。
- 写错 DOI 时命令退出码非 0，并列出候选（按标题模糊匹配）。
- 生成的中文笔记 `post:check` 一次通过，无需手工改 frontmatter。

**关键假设**
瓶颈是结构成本而不是时间。验证方式：上线后两周内是否产出 ≥ 1 篇真实笔记；若仍为 0，说明问题在选题或时间，应停掉此方向。

**工作量**：M（1–2 天）
**涉及**：`scripts/new-post.mjs`、`scripts/check-posts.mjs`、`src/lib/publications.ts`、`src/lib/schema.ts`

---

### 2. RSS 全文可读 + JSON Feed

**一句话**：让订阅者读到和网页一样的文章，而不是 Markdown 源码。

**为什么现在做**
这是当前唯一"发出去就是错"的东西：`content: post.body` 会把 ``` 围栏、`$$` 公式、`[链接](url)` 原样塞进阅读器。订阅者是最忠诚的读者，他们看到的却是最差的一版。

**范围**
- 两个 RSS 端点用 `AstroContainer` 渲染 `Content` 组件得到 HTML，复用现有 Markdown 管线（公式、代码高亮、图表占位）。
- 把正文中的 `/cv/...` 相对地址改写为绝对地址，否则阅读器里图片与链接全断。
- 增加 `/feed.json` 与 `/zh/feed.json`（JSON Feed 1.1，`content_html` 与 `summary` 并存）。
- `<language>`、`link`、`guid` 保持现有规范路径。
- Mermaid 在 feed 中降级为"原文 + 链接"，不塞 SVG。

**不做**
全文 feed 的阅读统计、按分类拆多个 feed（内容量不够）。

**验收标准**
- `dist/zh/rss.xml` 的 `<content:encoded>` 含 `<pre><code>` 与 `class="katex"`，不含 ``` 围栏。
- 所有 `src`/`href` 以 `https://yzc0421.github.io/cv/` 开头。
- W3C Feed Validator 与 JSON Feed Validator 无错误。
- `npm run verify` 新增断言：feed 中不出现裸代码围栏。

**关键假设**
有人在用 RSS 阅读。验证：在文章页展示一次"RSS"入口后，观察是否有订阅回流（无统计时以读者反馈为准）。

**工作量**：S（0.5–1 天）
**涉及**：`src/pages/rss.xml.ts`、`src/pages/zh/rss.xml.ts`、新增 `src/pages/feed.json.ts`、`scripts/verify-build.mjs`

---

### 3. 分享卡 + 结构化数据：让每次转发都带着文章

**一句话**：每篇文章生成自己的 1200×630 分享图，并把 `BlogPosting` 缺的字段补齐。

**为什么现在做**
博客的主要分发不是搜索，是别人把链接贴到群里。现在贴出去是一张写死的 "Zicong Yang" 名片，读者无法从卡片判断内容。同时 `BlogPosting` 缺 `dateModified`/`image`/`inLanguage`，中英页面在索引里无法区分。

**范围**
- 构建后运行 `node scripts/make-og.mjs --posts`，为每篇文章输出 `dist/og/<slug>.png`，内容为：标题（自动折行）、分类、日期、站点名。
- 中文标题依赖系统字体栈：`Noto Sans CJK SC, PingFang SC, Microsoft YaHei`；CI 里若缺字体，workflow 安装 `fonts-noto-cjk`，不往仓库塞几 MB 字体。
- 页面 `og:image` 指向自己的图；无自定义图的页面继续用全站图。
- `BlogPosting` 补 `dateModified`（取 `updated`，缺省等于 `datePublished`）、`image`、`inLanguage`、`wordCount`、`articleSection`、`isPartOf`。
- `verify` 断言：每篇文章的 OG 图存在、尺寸 1200×630、文件名与 slug 对应。

**不做**
运行时截图服务、动态参数化图片接口（静态站不需要）。

**验收标准**
- 任一文章页 `og:image` 返回 200 且为 1200×630；不同文章图片不同。
- 标题超过 60 字时折行且不溢出画布。
- Google Rich Results Test 对文章页无报错。
- 构建时间增量 < 5 秒。

**关键假设**
中文字体在 CI 可用，且分享卡确实影响点击。验证：先在本地生成 3 张图人工检查；上线后对比带图与不带图链接的点击（无统计时以主观反馈为准）。

**工作量**：M（1–2 天，字体是主要风险）
**涉及**：`scripts/make-og.mjs`、`src/layouts/BaseLayout.astro`、`src/layouts/PostLayout.astro`、`.github/workflows/deploy.yml`、`scripts/verify-build.mjs`

---

### 4. 内容保鲜：让旧文自己说明白

**一句话**：文章页展示最后更新时间与变更记录，超过一年自动提示"可能过时"，作者复查后可以续期。

**为什么现在做**
技术文的半衰期很短。站点已经有 `updated` 字段却从不渲染，等于承认了这个问题但没有处理。等文章变多再补，旧文已经在误导人。

**范围**
- 文章页在日期旁显示"最后更新于 YYYY-MM-DD"（仅当 `updated` 存在且晚于 `date`）。
- `changelog: [{date, note}]` 渲染为可折叠列表，默认收起。
- `reviewed: YYYY-MM-DD` 表示已复查；当 `reviewed ?? updated ?? date` 超过 12 个月，页面顶部出现提示条，链接到"内容可能过时"的说明。
- sitemap `lastmod` 取 `reviewed ?? updated ?? date`；`BlogPosting.dateModified` 同步。
- `post:check` 校验：`updated ≥ date`、`changelog` 日期递增、`reviewed` 不早于 `updated`。

**不做**
自动检测 API 变更、自动重写内容。

**验收标准**
- 设置 `updated` 后页面出现"最后更新"，sitemap 的 `lastmod` 随之变化。
- 把某篇文的 `date` 改成 13 个月前且不设 `reviewed`，页面出现提示条；设置 `reviewed` 为今天后提示消失。
- `updated < date` 时 `post:check` 失败。

**关键假设**
作者愿意回访旧文。若从不回访，提示条只会长期挂着变成噪音——那就只保留 `updated` 展示，删掉提示条。

**工作量**：S/M（1 天）
**涉及**：`src/lib/schema.ts`、`src/layouts/PostLayout.astro`、`src/pages/blog/[slug].astro`、`src/pages/zh/blog/[slug].astro`、`scripts/check-posts.mjs`、`astro.config.mjs`（sitemap lastmod）

---

### 5. 图片与图注：论文笔记的插图能力

**一句话**：给正文图片一个带说明与替代文本的组件，缺 alt 直接构建失败。

**为什么现在做**
论文笔记离不开图：方法框图、实验结果、失败案例。现在 `public/images` 不存在、没有一篇用过 `cover`、Mermaid 只有一张裸 SVG。等写到第三篇才发现图片没有样式、没有图注、暗色下没有边框，返工成本更高。

**范围**
- `src/components/Figure.astro`：接收 `src`、`alt`（必填）、`caption`、`width`；输出 `<figure><img><figcaption>`。
- 正文 Markdown 图片通过 rehype 插件统一包成 figure：`![alt](src "caption")`，`alt` 为空即构建失败。
- 图片放 `src/assets/images/`，用 Astro `<Image>` 生成 srcset 与尺寸，避免 CLS；`public/images/` 仅用于外部引用图。
- 暗色模式下图片加 1px 边框；窄屏最大宽度 100%。
- Mermaid 图补 `role="img"` 与 `aria-label`（取代码块前一行的 `**图 1**` 或 `title=`），并渲染图注。
- `verify` 断言：所有 `<img>` 有非空 `alt`；Mermaid 图有 `aria-label`。

**不做**
灯箱/缩放、图床、CDN。静态站不需要。

**验收标准**
- 一篇含 3 张图（含 1 张 Mermaid）的文章：图有说明、暗色有边框、移动端不溢出、`alt` 缺失时构建失败。
- 图片输出带 `srcset` 与显式宽高（查看构建产物）。
- 首屏无因图片导致的布局偏移（人工观察）。

**关键假设**
论文笔记会配图。若最终以文字为主，此项降级为"仅 Mermaid 图注 + alt 校验"，成本减半。

**工作量**：M（1–2 天）
**涉及**：新增 `src/components/Figure.astro`、`astro.config.mjs`（rehype 插件）、`src/styles/global.css`、`scripts/verify-build.mjs`

---

## 5. 备选池

| 排名 | 想法 | 视角 | 为什么暂不做 |
| --- | --- | --- | --- |
| 6 | D2 阅读位置（进度条/目录高亮/锚点） | 设计 | 目前唯一一篇是短文，收益要等长文出现。可与下次视觉调整一起做。 |
| 7 | E4 体积预算 | 工程 | 成本极低（半天），但当前 8.1M 不影响任何真实用户；作为"下次加依赖时"的前置条件更合适。 |
| 8 | E5 外链存活巡检 | 工程 | 16 条外链还少，等文章到 10 篇再开定时 job。 |
| 9 | 系列与归档 | 产品 | 至少 3 篇同主题文章才有意义。 |
| 10 | 项目 ↔ 文章互证 | 产品 | 与论文绑定同源，等有文章可链时再做。 |
| 11 | E3 Pagefind 元数据与分语言搜索 | 工程 | 1 篇文章时搜索没有区分价值；重复页已移出索引，当前结果不脏。 |
| 12 | D3 中文混排 | 设计 | 改进真实但微妙，适合与字体/样式调整合并做。 |
| 13 | D4 空状态 | 设计 | 英文 0 篇是暂时状态，内容变多后自然消失。 |
| 14 | D5 引用本文 | 设计 | 需要文章先被外部引用，属于"有人看"之后的事。 |
| 15 | P5 讨论入口 | 产品 | 没有读者时，空的讨论入口比没有更尴尬。 |

## 6. 明确不做

| 不做 | 理由 |
| --- | --- |
| 评论系统 | 静态站需第三方；现有 GitHub Discussions 方案足够，不必现在接入。 |
| 访问统计 | 无后端，第三方脚本违反零 CDN 原则；决策靠内容与反馈，不靠 PV。 |
| Newsletter | 更新节奏未稳定前，订阅列表是负债。 |
| 自动翻译 | 机翻破坏"专业可信"；`translationOf` 只接受人写的译文。 |
| 站内 AI 问答 | 为了让读者"问文章"，需要索引、嵌入与成本，收益不明。 |
| 客户端框架 | 与现有构建策略冲突，动画与交互用原生即可。 |

## 7. 路线图

```text
第 1 周   #2 RSS 全文 + JSON Feed      （半天，先止损）
          #4 内容保鲜                  （与 #2 并行，改 schema）
第 2 周   #1 论文笔记流水线            （产出第一篇 paper-reading）
第 3 周   #5 图片与图注                （配合第一篇笔记的图）
第 4 周   #3 分享卡 + 结构化数据        （字体风险，留足时间）
之后      备选池 6–8：阅读位置 / 体积预算 / 外链巡检
```

依赖：#5 在 #1 产出第一篇带图的笔记前完成即可；#3 与 #4 都改 `PostLayout`，建议先 #4 后 #3，避免同文件反复冲突。

## 8. 已确认的决策

1. **论文笔记会写**，同时会写项目笔记与技术笔记。→ #1 保留第一位，脚手架已扩展出 `--paper`、`--project`、`--translate-of` 三种入口。
2. **分享卡中文字体**：CI 安装 `fonts-noto-cjk`，仓库不引入字体文件。→ #3 按此实现，留给第 4 周。
3. **过时阈值**：跳过。当前先按 12 个月实现，等有真实文章老化后再调。
4. **图片存放**：`src/assets/images/`，走 Astro 图片优化。→ #5 按此实现。

## 9. 实施状态（2026-11-14）

- 已完成：#2 RSS 全文 + JSON Feed；#4 内容保鲜（`updated`/`reviewed`/`changelog`/过时提示/`lastmod`/`dateModified`）；#1 笔记脚手架；#3 每篇分享卡 + 结构化数据；#5 图片与图注。
- 新增命令：`npm run new -- --paper <DOI>`、`--project <slug>`、`--translate-of <slug>`。
- 实现差异：
  - 缺 alt 时不会让 `astro build` 直接失败（rehype 抛错会被 Astro 吞掉并丢正文），改为渲染占位 alt，并让 `post:check` 与 `verify` 失败；CI 在 build 前跑 `post:check`。
  - 分享卡中文字体依赖系统字体栈，CI 安装 `fonts-noto-cjk`，仓库不引入字体文件。
  - 图片统一放 `src/assets/images/`，Markdown 图片自动输出响应式 WebP（`srcset` + 宽高）。
