### 任务 10：构建校验、CI 部署、清理与文档

**文件：**
- 创建：`scripts/verify-build.mjs`、`.github/workflows/deploy.yml`、`README.md`
- 删除：`index.html`、`CV.html`（仓库根目录，迁移完成且 `public/CV.html` 已就位）

- [ ] **步骤 1：写 `scripts/verify-build.mjs`**

```js
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const checks = [];
const must = async (path, label) => {
  try {
    await access(path, constants.R_OK);
    checks.push([label, true]);
    return true;
  } catch {
    checks.push([label, false]);
    return false;
  }
};

const routes = [
  'dist/index.html',
  'dist/publications/index.html',
  'dist/work/index.html',
  'dist/blog/index.html',
  'dist/about/index.html',
  'dist/about/zh/index.html',
  'dist/404.html',
  'dist/rss.xml',
  'dist/sitemap-index.xml',
  'dist/CV.html',
];
for (const r of routes) await must(r, r);

const home = await readFile('dist/index.html', 'utf8');
checks.push(['home shows 3 publications', (home.match(/class="pub-item"/g) ?? []).length === 3]);

const pubs = await readFile('dist/publications/index.html', 'utf8');
checks.push(['publications has entries', (pubs.match(/class="pub-item"/g) ?? []).length >= 1]);
checks.push(['publications include doi links', pubs.includes('doi.org'));

const rss = await readFile('dist/rss.xml', 'utf8');
checks.push(['rss has items', rss.includes('<item>')]);

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
```

- [ ] **步骤 2：运行校验脚本**

运行：
```bash
npm run build
npm run verify
```
预期：逐条输出 `ok`，最后 `all checks passed`，退出码 0。

- [ ] **步骤 3：写 `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run check
      - run: npm run build
      - run: npm run verify
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **步骤 4：删除旧文件**

```bash
git rm index.html CV.html
```

预期：两个文件从工作区与暂存区移除；`public/CV.html` 仍在。

- [ ] **步骤 5：写 `README.md`**

````markdown
# cv

Personal academic site of Zicong Yang: publications, work, and writing.

Built with Astro 5, statically generated, deployed to GitHub Pages.

## Local

```bash
npm install
npm run dev      # http://localhost:4321/cv/
npm run check    # type + content schema check
npm test         # unit tests for schema and ordering rules
npm run build    # build to dist/
npm run verify   # assert build output
```

## Add a publication

1. Create `src/content/publications/<slug>.md` with the frontmatter defined in
   `src/lib/schema.ts`.
2. `doi` is required. Set `selected: true` only for entries that should appear on the home
   page.
3. Run `npm run check` and `npm run build`.

## Add a post

1. Create `src/content/blog/<slug>.md`, `lang` is `en` or `zh`, `tags` at least one,
   `summary` at most 160 characters.
2. `draft: true` keeps it out of the list, RSS, and sitemap.
3. Future dates publish automatically: entries dated after the build day are excluded.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`. The site is served from
`https://yzc0421.github.io/cv/`. If a custom domain is added, update `site` and `base` in
`astro.config.mjs`, add `public/CNAME`, and update `public/robots.txt`.

## Rollback

Re-run the last successful `Deploy to GitHub Pages` workflow, or `git revert` the offending
content commit. Build configuration changes revert the same way; no manual cleanup on Pages
is required.

## Notes

- No runtime CDN dependencies.
- Content is validated by Zod at build time; invalid frontmatter fails the build.
- Paper metadata was cross-checked against Crossref and confirmed manually.
````

- [ ] **步骤 6：全量验证**

运行：
```bash
rm -rf dist
npm test
npm run check
npm run build
npm run verify
```
预期：四步全部退出码 0，`verify` 输出 `all checks passed`。

- [ ] **步骤 7：验证草稿与未来日期不进入产物**

创建临时文件 `src/content/blog/draft-check.md`：

```markdown
---
title: "Draft check"
date: "2026-01-01"
lang: "en"
tags: ["test"]
summary: "Temporary fixture."
draft: true
---
This must not be published.
```

运行：

```bash
npm run build
grep -c 'Draft check' dist/blog/index.html dist/rss.xml dist/index.html
```

预期：三处均输出 `0`。随后删除该文件：

```bash
rm src/content/blog/draft-check.md
```

- [ ] **步骤 8：验证缺 doi 时构建失败**

```bash
cp src/content/publications/scientific-reports-2024.md /tmp/pub.bak
sed -i '' '/^doi:/d' src/content/publications/scientific-reports-2024.md
npm run build; echo "exit=$?"
```

预期：输出 `exit=1`，错误信息指出 `scientific-reports-2024.md` 缺少 `doi`。恢复：

```bash
cp /tmp/pub.bak src/content/publications/scientific-reports-2024.md
rm /tmp/pub.bak
```

注意：`sed -i ''` 为 macOS 语法；此步骤只用于本地验证，CI 不执行。

- [ ] **步骤 9：验证禁用 JS 与深浅色对比度**

用浏览器打开 `npm run preview`（`http://localhost:4321/cv/`），在 DevTools 中禁用 JavaScript 后刷新。
预期：首页、`/publications`、`/blog`、示例文章正文均可完整阅读；主题为浅色；仅筛选与复制按钮不可用。

切换深色模式后，用 DevTools 取样正文与背景：浅色约 `#111827` on `#ffffff`、深色约 `#e5e7eb` on `#0b1120`，两者对比度均 ≥ 12:1，满足 4.5:1 的下限。

- [ ] **步骤 10：Commit**

```bash
git add scripts/verify-build.mjs .github/workflows/deploy.yml README.md
git add -A
git commit -m "chore: 增加构建校验、部署流水线与项目文档"
```

- [ ] **步骤 11：推送并观察部署（需用户授权）**

```bash
git push origin main
```

预期：GitHub Actions `Deploy to GitHub Pages` 成功；`https://yzc0421.github.io/cv/` 可访问；
`https://yzc0421.github.io/cv/CV.html` 跳转至 `/cv/about`。

---

## 规格覆盖对照

| 规格章节 | 对应任务 |
| --- | --- |
| 5.1 路由 | 任务 4、5、6、7、8、9 |
| 5.2 首页区块 | 任务 5 |
| 5.3 导航 | 任务 1、任务 9 |
| 6.1 publications | 任务 2、3、4 |
| 6.2 work | 任务 5、6 |
| 6.3 blog | 任务 2、7 |
| 6.4 pages | 任务 8 |
| 6.5 校验规则 | 任务 2、3 |
| 7 技术架构 | 任务 1、2、7 |
| 8 双语与 SEO | 任务 8、9 |
| 9 视觉规范 | 任务 1、4、5、6、7、8 |
| 10 可访问性 | 任务 1、4、7、9 |
| 11 部署与回滚 | 任务 10 |
| 12 错误处理 | 任务 1、2、4、7、10 |
| 13 迁移步骤 | 任务 1–10 |
| 14 验收标准 | 任务 10（第 2 条由 `verify-build.mjs` 覆盖，其余为手工检查） |
| 15 风险 | 任务 3（核对表）、任务 10（部署实测） |
