# 任务 3 实现报告

## 实现了什么

- `src/lib/work.ts`：`sortProjects`（order 升序 + id）、`sortExperience`（start 倒序 + id）、`sortWork`（start 倒序 + id）。
- `src/components/ResearchAreas.astro`：从 `topics` 与两个集合派生主题区块，每个主题取最新一作论文 1 条 + 最新有主题的 work 条目 1 条，`View all →` 指向 `/publications/?topic=<slug>`，无内容时不渲染。
- `src/pages/index.astro`：在 Hero 之后插入 `<ResearchAreas />`。
- `src/styles/global.css`：`.area-grid` 两栏布局与区块样式。

## 测试与验证

- `npm run check`：0 errors。
- `npm run build`：17 页成功。
- 产物：`class="area"` 出现 2 次；`topic=medical-signal` 与 `topic=industrial-vision` 各出现一次。

## 自审发现

- 代表成果的选取完全由数据驱动，没有在组件内硬编码任何论文标题或项目名。
- 主题名与定位句只从 `lib/topics.ts` 读取。
- `industrial-vision` 的代表 work 是广州西洋的线缆检测经历（`sortWork` 按开始时间倒序，2025-01 最新），符合"项目或经历均可"的规格。

## 疑虑

- 代表成果里论文只取一作；如果某主题没有一作论文，会只显示 work 条目。当前两个主题都有一作论文。

## 审查修复

- 两个 `View all →` 链接补 `aria-label`，区分主题。
- `sortExperience` 改为复用 `sortWork`，消除逐字重复；`/work` 的接线留在任务 5。
- `sortPublications` 在同日期同角色时补 `id` 兜底，代表论文的选择变为确定性。

验证：`npm test` 42/42；`npm run check` 0 errors；`npm run build` 17 页。
