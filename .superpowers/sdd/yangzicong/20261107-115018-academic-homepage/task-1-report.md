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

## 审查修复（第二轮）

审查发现 `import.meta.env.BASE_URL` 无尾斜杠，`${base}publications` 被拼成 `/cvpublications`。修复内容：

- 新增 `src/lib/url.ts`：`withBase(path)` 负责拼接，`stripBase(pathname)` 负责去掉子路径。
- `Header.astro`、`Footer.astro`、`BaseLayout.astro` 全部改用 `withBase`；导航当前项改为按路径段比较。
- canonical 改为 `new URL(pathname.replace(/\/?$/, '/'), site)`，输出带尾斜杠的最终 URL。
- `ThemeToggle` 增加 `aria-pressed` 同步；初始化与写入 `localStorage` 均包 `try/catch`。
- `<main>` 增加 `tabindex="-1"`，保证 skip link 焦点落入正文。
- `plan.md` 增加"全局约定：内部链接"，声明后续示例一律按 `withBase` 理解。

验证：

- `npm run build`：成功。
- `grep href dist/index.html`：`/cv/`、`/cv/publications`、`/cv/work`、`/cv/blog`、`/cv/about`、`/cv/rss.xml`、`/cv/favicon.svg` 均正确。
- canonical：`https://yzc0421.github.io/cv/`。
- `npm run check`：8 files，0 errors，0 warnings，0 hints。

## 第二轮审查修复

- 桌面导航与移动菜单解耦：桌面使用独立 `<nav class="nav desktop-nav">`，`<details>` 只在 `<768px` 显示，避免关闭态 `<details>` 的 `content-visibility: hidden` 隐藏主导航。
- `withBase` 对无扩展名的路由补尾斜杠（`/cv/publications/`），对 `rss.xml`、`favicon.svg` 等文件保留扩展名，消除 301 跳转。
- `stripBase` 增加 `startsWith(BASE)` 守卫，路径不含前缀时原样返回。
- 主题按钮 `aria-label` 改为 `Dark mode`，状态交给 `aria-pressed`。

验证：

- `npm run build`：成功。
- 产物链接：`/cv/`、`/cv/publications/`、`/cv/work/`、`/cv/blog/`、`/cv/about/`、`/cv/rss.xml`、`/cv/favicon.svg`。
- `npm run check`：8 files，0 errors，0 warnings，0 hints。
- 环境未安装浏览器自动化工具，桌面导航的渲染验证改为结构性保证（不再依赖 `<details>` 打开状态），最终验收任务会再实测。
