# 任务 7 实现报告

## 实现了什么

- `src/layouts/PostLayout.astro`：文章页布局，`type="article"`、`article:published_time`、`article:tag`、语言徽标、标签徽标、桌面右侧 sticky 目录、移动端目录折叠。
- `src/components/Toc.astro`：从 `render()` 的 `headings` 生成 h2/h3 目录，无标题时不渲染。
- `src/components/TagFilter.astro`：标签筛选按钮，标签为空时不渲染控件。
- `src/pages/blog/index.astro`：按日期倒序、标签筛选、RSS 入口；`draft` 与未来日期过滤。
- `src/pages/blog/[slug].astro`：`getStaticPaths` 过滤草稿与未来日期，生成上下篇。
- `src/pages/rss.xml.ts`：RSS，链接经 `withBase`，日期用 `localToday()`。
- `src/content/blog/from-single-page-to-astro.md`：示例文章，记录本次迁移的真实过程。
- `src/styles/global.css`：文章头部、正文、目录、双栏布局、上下篇样式。

## 测试与验证

- `npm run build`：14 个页面成功。
- 文章页：`1`；RSS `<item>`：`1`；首页出现文章链接：`1`。
- `npm run check`：33 files，0 errors，0 warnings，0 hints。

## 修改的文件

新增：`src/layouts/PostLayout.astro`、`src/components/{Toc,TagFilter}.astro`、`src/pages/blog/{index.astro,[slug].astro}`、`src/pages/rss.xml.ts`、`src/content/blog/from-single-page-to-astro.md`。
修改：`src/styles/global.css`。

## 自审发现

- 列表、详情、RSS 三处统一使用 `localToday()` 与相同的过滤条件，避免"列表可见但详情 404"。
- 文章 `lang: zh` 时 `<html lang="zh-CN">`，列表与文章页显示"中文"徽标。
- 代码高亮由 Astro 内置 Shiki 提供，文章中的行内代码与代码块均无需额外配置。
- 标签筛选与论文筛选共用 `.filters` 样式，保持视觉一致。

## 疑虑

- 目录只收录 h2/h3，h4 不入目录；当前文章层级足够。
- 文章页上下篇顺序为"较旧在左、较新在右"，与常见博客相反；如需要可调整。

## 规格补齐

规格要求文章页包含脚注与阅读时长，计划任务 7 的步骤未覆盖，已补齐：

- **脚注**：Astro 内置 Markdown 处理器已支持 GFM 脚注，示例文章加入 `[^1]` 后产物出现 `data-footnotes`、`data-footnote-ref` 与回跳链接，无需额外插件。
- **阅读时长**：`src/lib/format.ts` 新增 `readingMinutes()`，按中文字符 400/分钟、英文词 200/分钟估算；`PostLayout` 显示 `N min read`。新增 2 个单元测试。

验证：`npm test` 20/20；`npm run build` 成功；产物显示 `2 min read` 与脚注标记；`npm run check` 0 errors。

## 审查修复

审查判定"需要修复"，两项关键与若干重要项已处理：

- **桌面目录吸顶**：`.toc-aside` 在 ≥1024px 时 `position: sticky; top: 80px; align-self: start`，移动端隐藏；移动端目录改为 `<details>` 折叠。
- **标签筛选失效**：新增全局 `[hidden] { display: none !important; }`，覆盖 `.post-list li { display: flex }` 对 `hidden` 属性的压制。
- **深色代码高亮**：补充 `.astro-code` 与 `[data-theme='dark']` 下的 `--shiki-light/dark` 变量规则。
- **过滤规则去重**：新增 `src/lib/posts.ts` 的 `visiblePosts()`，首页、列表、详情、RSS 四处统一调用；新增 2 个单元测试。
- **空上下篇**：`(prev || next)` 条件渲染，单篇文章时不再出现空白分隔线。
- **中文阅读时长**：`lang: zh` 显示"约 N 分钟"。
- **示例文章修正**：BASE_URL 段落改为实际构建观察；打印样式改为"下一步"口吻，避免把未实现功能写成既成事实。
- **RSS**：补 `<language>zh-CN</language>`。

验证：`npm test` 22/22；`npm run build` 成功；产物含 `toc-aside`、`sticky`、`shiki-dark`；单篇文章页无空 `next-prev`；`npm run check` 0 errors。
