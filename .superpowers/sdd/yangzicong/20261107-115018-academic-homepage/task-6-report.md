# 任务 6 实现报告

## 实现了什么

- `src/content/work/` 新增 8 个文件（5 段经历 + 3 个项目），与此前 1 个项目共 9 条：
  - 经历：广州西洋、宁波海智明视、宁波嘉偲、广州触众、校园创业。
  - 项目：Wordle 分析、可口可乐消费者分析、乡村振兴调研。
- `src/pages/work/index.astro`：经历时间线（按 `start` 倒序，显示前 3 条要点）+ 项目卡片网格（按 `order`）。
- `src/pages/work/[slug].astro`：`getStaticPaths` + `render`，展示角色、组织、时间、全部要点、正文、技术栈、外链。
- `src/styles/global.css`：追加 `.timeline` 与 `.work-detail` 样式。

## 内容来源

全部取自现有简历 `index.html` 的既有事实（工作经历 388–553 行、项目 668–730 行），只做英文结构化重排，未新增未验证的结论。技术栈取各段正文出现的工具名。

## 测试与验证

- `npm run build`：12 个页面成功。
- `ls dist/work/*/index.html | wc -l`：`9`。
- 首页 `work-card`：`3`（任务 5 时只有 1 条，补齐后自动生效）。
- `npm run check`：27 files，0 errors，0 warnings，0 hints。

## 修改的文件

新增：`src/content/work/{guangzhou-xiyang,ningbo-haizhimingshi,ningbo-jiasi,guangzhou-chuzhong,campus-startup,wordle-analysis,coca-cola-consumer-analysis,rural-revitalization}.md`、`src/pages/work/index.astro`、`src/pages/work/[slug].astro`。
修改：`src/styles/global.css`。

## 自审发现

- 要点用 `{highlight}` 文本插值而非 `set:html`，避免把简历里的加粗标记当 HTML 注入。
- 类型使用 `CollectionEntry<'work'>`，`astro check` 通过。
- 详情页正文与 frontmatter 要点可能重复（正文是概述，要点是事实列表），当前可接受；若后续觉得冗余可只保留其一。

## 疑虑

- 经历时间线只显示前 3 条要点，完整内容在详情页；这是规格允许的紧凑处理。
- 项目详情页的正文较短，后续可补充截图与方法细节，但需要你提供素材。
