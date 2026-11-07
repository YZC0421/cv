# 任务 6 实现报告

## 实现了什么

- `src/lib/site.ts`：站点常量（姓名、定位句、邮箱、GitHub、Scholar、ORCID）与 `hasCvPdf()`（检查 `public/cv.pdf`）。
- `PageLayout.astro`：构建期判断，存在 PDF 时渲染 `Download CV (PDF)` 直链，否则渲染打印按钮。
- `index.astro`：首页 About 区块同样按存在性切换 `Download CV (PDF)` 与打印入口。
- `Hero.astro` / `Footer.astro`：姓名、定位句、社交链接改为从 `site` 读取，删除重复字面量。
- `README.md`：新增 CV PDF 维护说明。

## 测试与验证

- `npm run check`：0 errors。
- `npm run build`：17 页。
- 三种状态实测：
  - 无 `public/cv.pdf`：`dist/about/index.html` 与 `dist/index.html` 中 `cv.pdf` 命中 0。
  - 临时 `touch public/cv.pdf` 后重建：两处命中各 1。
  - 删除后重建：回到 0，打印按钮保留。

## 自审发现

- `hasCvPdf()` 使用 `existsSync('public/cv.pdf')`，依赖构建时工作目录为仓库根；`npm run build`、CI 均在根目录执行。
- 下载链接经 `withBase('cv.pdf')` 生成 `/cv/cv.pdf`，不会被补尾斜杠（扩展名判断）。
- 中文 About 页也使用同一布局，因此下载按钮文案为英文，与英文页一致；打印按钮的中文文案保留在回退分支。

## 疑虑

- PDF 与内容会不同步，README 已说明需手动重新导出。
- `site.tagline` 含破折号与长句，与首页 Hero 原文本一致。

## 审查修复

- 下载链接与打印按钮并存（不再互斥），英文页打印文案改为 `Print / Save as PDF`，中文页为 `打印 / 存为 PDF`；下载文案按语言传入（`downloadLabel`）。
- `.cv-download` 与打印按钮共享 `.about-actions` 的描边样式。
- `hasCvPdf()` 改为按模块位置解析 `public/cv.pdf`（`fileURLToPath(new URL('../../public/cv.pdf', import.meta.url))`），不依赖构建工作目录。
- `Header` 品牌名与 `BaseLayout` 的 JSON-LD `name`/`sameAs` 改读 `site`。
- 首页在 frontmatter 求值一次 `cvAvailable`。

验证：`npm run check` 0 errors；三态：无 PDF 时 `cv.pdf` 命中 0；放入空文件后 `/about` 与首页各 1 次且打印按钮仍在；删除后回到 0。
