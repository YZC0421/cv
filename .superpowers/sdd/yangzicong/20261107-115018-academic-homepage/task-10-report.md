# 任务 10 实现报告

## 实现了什么

- `scripts/verify-build.mjs`：检查 15 个关键产物路径、首页 3 篇论文与 3 张项目卡、Publications 6 条与 DOI、RSS 条目与频道链接、About 的 H1 与 hreflang、404 的 noindex。
- `.github/workflows/deploy.yml`：Node 22 + `npm ci` → `npm test` → `npm run check` → `npm run build` → `npm run verify` → Pages artifact → deploy。
- `README.md`：本地命令、新增论文/文章/项目流程、部署与回滚、内部链接约定。
- 删除仓库根目录的旧 `index.html` 与 `CV.html`；`public/CV.html` 重定向保留。

## 测试与验证

- `npm test`：22/22。
- `npm run check`：39 files，0 errors。
- `npm run build`：17 页。
- `npm run verify`：26 项检查全部 `ok`，输出 `all checks passed`。
- **草稿排除**：临时加入 `draft: true` 文章后构建，`dist/blog/index.html`、`dist/rss.xml`、`dist/index.html` 中该标题出现次数均为 `0`；删除临时文件后重新构建成功。
- **缺 DOI 失败**：临时删除 `scientific-reports-2024.md` 的 `doi` 行后构建，退出码 `1`，报 `publications → scientific-reports-2024 data does not match collection schema`、`doi: Required`；恢复文件后构建成功。

## 修改的文件

新增：`scripts/verify-build.mjs`、`.github/workflows/deploy.yml`、`README.md`。
删除：`index.html`、`CV.html`（根目录旧页面）。

## 自审发现

- `verify-build.mjs` 初版有两处数组括号缺失（`checks.push([...])` 少 `]`），被 `astro check` 与运行时报错捕获，已修复后全绿。
- 校验脚本使用相对 `dist/` 路径，需在仓库根执行——`package.json` 的 `verify` 已在根目录调用，CI 同样如此。

## 疑虑

- GitHub Actions 的首次真实部署尚未执行（需要 push 到 main），本地只能验证 workflow 语法与构建步骤。
- GitHub Pages 需要在仓库 Settings 中把 Source 设为「GitHub Actions」，否则 workflow 无法发布。

## 审查修复

- **断言改为内容数量驱动**：Publications 条数与 `src/content/publications/*.md` 数量比较，详情页数量与 `src/content/work/*.md` 比较；不再写死具体 slug，合法内容变更不会误报。
- **hreflang 断言精确化**：改为匹配 `rel="alternate" hreflang="zh-CN"`，避免 Header 的语言切换链接造成假通过；同时断言 `en` 与 `x-default`。
- **DOI 断言收紧**：每个条目至少一个 `doi.org/` 链接。
- **sitemap 断言**：排除 404 与 `draft-check`。
- **README 修正**：`selected` 的说明改为"置顶，首页始终 3 条并自动补齐"；补 `npm run preview` 与内容新增后的 `npm run verify`；自定义域名步骤补上同步校验脚本。
- 校验脚本对内容文件读取失败也记录为检查项，避免提前抛错丢失清单。

验证：`npm run check` 0 errors；`npm run build` 17 页；`npm run verify` 26 项全部通过。
