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
