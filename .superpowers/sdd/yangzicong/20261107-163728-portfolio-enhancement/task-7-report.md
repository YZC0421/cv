# 任务 7 实现报告

## 实现了什么

- `src/pages/blog/tag/[tag].astro`：每个标签一个静态页，复用 `PostList`，无可见文章的标签不生成。
- `blog/index.astro` 与 `PostLayout.astro`：标签徽标改为链接，指向对应标签页。
- `scripts/make-og.mjs`：用 sharp 将 1200×630 的 SVG 渲染为 `public/og.png`。
- `BaseLayout.astro`：输出 `og:image`（绝对 URL）与 `twitter:card=summary_large_image`。
- `package.json`：新增 `npm run og` 与 devDependency `sharp`（仅生图使用）。

## 测试与验证

- `npm run check`：0 errors。
- `npm run build`：20 页（原 17 页 + 3 个标签页）。
- `public/og.png`：25KB，`sharp` 读取尺寸为 1200×630。
- 产物：`og:image` 与 `twitter:card` 各 1 处；博客列表含 3 个标签链接。

## 自审发现

- 标签页的 `getStaticPaths` 使用 `visiblePosts`，草稿与未来文章不会产生标签页。
- 标签页 `lang="zh-CN"`，与博客列表一致。
- OG 图生成是独立脚本，不进入构建流程；`public/og.png` 随仓库提交，CI 不需要 sharp。

## 疑虑

- OG 图的 SVG 使用系统字体（Georgia/Helvetica），在没有这些字体的机器上重新生成会换字形；当前图片已提交，CI 不重跑。
- 标签页目前没有分页；当前只有 3 个标签、1 篇文章，不需要。

## 审查修复

- `verify-build.mjs` 的 `countDirs` 支持排除，文章详情统计排除 `tag` 目录，避免标签目录顶替文章页。
- 标签页补 `Props` 接口（`tag` 与 `posts`），恢复类型检查。
- 抽出 `postTags()`，博客列表与标签页共用并统一排序。
- `og:image` 补 `width/height/alt`，并加 `twitter:image`。

验证：`npm test` 42/42；`npm run check` 0 errors；`npm run build` 20 页；`npm run verify` 全部通过；3 个标签页。
