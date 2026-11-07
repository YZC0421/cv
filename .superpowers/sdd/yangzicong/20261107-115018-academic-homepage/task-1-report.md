# 任务 1 实现报告

## 实现了什么

- 初始化 `package.json`，脚本包含 `dev/build/preview/check/test/verify`。
- 安装 `astro@5.18.2`、`@astrojs/rss`、`@astrojs/sitemap`、`zod` 与开发依赖 `@astrojs/check`、`typescript`、`tsx`。
- 新增 `astro.config.mjs`：`site: https://yzc0421.github.io`、`base: /cv`、`output: static`、sitemap 集成、Shiki 双主题。
- 新增 `tsconfig.json`，继承 Astro strict 配置。
- 新增 `src/styles/global.css`：颜色/排版/布局 token、深浅色变量、导航、响应式断点、`prefers-reduced-motion`。
- 新增 `BaseLayout.astro`：canonical、OG、`head` 具名插槽、防闪烁主题脚本、skip link。
- 新增 `Header.astro`（四条导航 + 当前页高亮 + `<details>` 移动菜单）、`Footer.astro`、`ThemeToggle.astro`。
- 新增临时 `index.astro` 用于构建验证。
- 新增 `.gitignore`（`node_modules/`、`dist/`、`.astro/`、`.DS_Store`）——计划文件清单未列，但不加会把依赖提交进仓库。

## 测试与验证

- `npm run build`：成功，生成 `dist/index.html`、`dist/sitemap-index.xml`、`dist/sitemap-0.xml`。
- `grep` 产物：导航包含 `Publications`、`Work`、`Writing`、`About`；`dataset.theme` 出现 3 次（主题初始化与切换脚本）。
- `npm run dev` + `curl http://localhost:4321/cv/`：HTTP 200，产物包含 `class="nav"`；随后关闭本地服务。
- 无单元测试（本任务不要求）。

## 修改的文件

新增：`.gitignore`、`package.json`、`package-lock.json`、`astro.config.mjs`、`tsconfig.json`、`src/styles/global.css`、`src/layouts/BaseLayout.astro`、`src/components/{Header,Footer,ThemeToggle}.astro`、`src/pages/index.astro`。

## 自审发现

- 无阻断问题。
- 记录：npm 11 的 `install-scripts` 策略跳过了 `esbuild` 的 postinstall，但 `npm run build` 与 `npm run dev` 均成功，说明当前二进制可正常使用；CI 使用 `npm ci` 时需要观察同样的告警。

## 疑虑

- Astro 5.18.2 已提示 7.4.7 可用。规格明确锁定 Astro 5，本次不升级。
- 计划未包含 `.gitignore`，已按工程必要补上，属于范围内的必要文件。
