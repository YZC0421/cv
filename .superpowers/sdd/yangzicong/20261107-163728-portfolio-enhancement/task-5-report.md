# 任务 5 实现报告

## 实现了什么

- `WorkCard.astro`：根元素增加 `data-topics`，stack 区渲染主题徽标；无主题的项目不显示徽标。
- `work/index.astro`：项目区增加主题筛选（All + 两个主题），经历时间线不参与；排序改用 `sortExperience` / `sortProjects`。
- `work/[slug].astro`：
  - 按 Problem → Approach → Results 渲染存在的段落。
  - 三段全空时回退为 `Highlights` 列表。
  - 新增 `Role` 段（角色 + 组织）。
  - 有 `relatedPublications` 时渲染 `Related publication`（标题、venue、年份、DOI 链接）。
- `index.astro`：首页项目排序改用 `sortProjects`。
- `global.css`：`.work-block` 段落样式。

## 测试与验证

- `npm run check`：0 errors。
- `npm run build`：17 页成功。
- `/work` 产物含 `data-value="medical-signal"` 与主题徽标。
- 心源性猝死详情页含 `Problem`、`Approach`、`Results`、`Related publication`。
- 广州西洋（经历，无三段）详情页回退显示 `Highlights`。

## 自审发现

- `relatedPublications` 可能未被 schema default 填充，取值时用 `(d.relatedPublications ?? [])[0]` 兜底。
- 三段与 highlights 互斥：`hasSections` 为真时不渲染 highlights，避免重复。
- 经历与项目共用同一个详情模板，经历没有三段时自动走回退。

## 疑虑

- `Role` 段目前只有一句 `role at org`，信息量偏低；若需要更具体的职责描述，可从 highlights 中拆出，但会与三段内容重复。
- 项目卡片只有心源性猝死带主题徽标；另外三个应用类项目无主题，符合规格。
