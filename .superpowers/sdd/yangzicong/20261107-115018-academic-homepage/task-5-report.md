# 任务 5 实现报告

## 实现了什么

- `src/components/Hero.astro`：姓名、研究定位、Scholar / ORCID / GitHub / Email。
- `src/components/WorkCard.astro`：项目卡片，标题链接、摘要、技术栈 pills。
- `src/components/PostList.astro`：文章列表，日期、标题、语言徽标。
- `src/content/work/sudden-cardiac-death-prediction.md`：首页所需的最小项目数据。
- `src/pages/index.astro`：五个区块，精选论文 3 条、精选项目最多 3 条、最新文章最多 2 条、About 摘要与 CV 入口。
- `src/styles/global.css`：追加 hero、section、work-grid、work-card、stack、post-list、lang-badge、links 样式。

## 关键实现

- 精选论文调用 `selectHomepage`（selected → 一作 → 日期倒序），页面不维护手写列表。
- 文章按 `draft` 与未来日期过滤；集合为空时 `Latest Writing` 整块不渲染（`posts.length > 0`）。
- 项目按 `order` 升序取前 3；当前只有 1 条，待任务 6 补齐后自动变为 3 条。
- 所有站内链接经 `withBase`。

## 测试与验证

- `npm run build`：成功。
- 产物断言：`pub-item` = 3；`work-card` = 1；`Latest Writing` = 0（无文章，空态生效）。
- `npm run check`：24 files，0 errors，0 warnings，0 hints。

## 修改的文件

新增：`src/components/{Hero,WorkCard,PostList}.astro`、`src/content/work/sudden-cardiac-death-prediction.md`。
修改：`src/pages/index.astro`、`src/styles/global.css`。

## 自审发现

- 首页 `Download CV (PDF)` 现阶段与 `More about me →` 指向同一 `/about`，实际打印动作在 About 页触发；后续任务 8 会给 About 页打印按钮，届时可评估首页是否直接链接到打印视图。
- `selectHomepage` 返回 3 条（scientific-reports、cvidl-wheat、cisse），符合"一作优先"。

## 疑虑

- 首页项目只有 1 条，视觉上偏空；任务 6 补齐 4 个项目后恢复正常。
- `Latest Writing` 空态无法在本任务内验证有文章时的样式，任务 7 会覆盖。
