# 任务 9 实现报告

## 实现了什么

- `src/layouts/BaseLayout.astro`：输出 JSON-LD `@graph`，包含 `ProfilePage` 与 `Person`（`@id` 指向站点根锚点，`sameAs` 为 Scholar / ORCID / GitHub）。
- `src/pages/404.astro`：404 页面，含返回首页链接。
- `public/robots.txt`：开放抓取并声明 `sitemap-index.xml`。
- `public/favicon.svg`：站点图标（此前 `BaseLayout` 引用的 `/cv/favicon.svg` 一直 404）。
- `astro.config.mjs`：sitemap `filter` 排除 `/404`。

## 测试与验证

- `npm run build`：17 个页面成功。
- 产物存在：`dist/404.html`、`dist/robots.txt`、`dist/favicon.svg`、`dist/sitemap-index.xml`。
- `dist/sitemap-0.xml` 中 `404` 出现次数为 `0`。
- 首页含 `ProfilePage` 结构化数据。
- `robots.txt` 含 sitemap 声明。
- `npm run check`：0 errors，0 warnings，0 hints。

## 修改的文件

新增：`src/pages/404.astro`、`public/robots.txt`、`public/favicon.svg`。
修改：`src/layouts/BaseLayout.astro`、`astro.config.mjs`。

## 自审发现

- JSON-LD 在布局层输出，所有页面共享同一 `Person` 实体，避免重复定义与 id 漂移。
- `Person` 不含邮箱与电话，只列公开学术主页与 GitHub。
- `robots.txt` 的 sitemap 地址与 `site` + `base` 一致。

## 疑虑

- 结构化数据未用 Google Rich Results 工具实测；语法由 `JSON.stringify` 保证，字段符合 schema.org `ProfilePage`/`Person`。
