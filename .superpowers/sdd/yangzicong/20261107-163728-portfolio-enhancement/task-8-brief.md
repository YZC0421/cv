### 任务 8：依赖锁定、CI PR 检查与验收扩展

**文件：**
- 修改：`package.json`、`.github/workflows/deploy.yml`、`scripts/verify-build.mjs`、`README.md`

- [ ] **步骤 1：依赖改为精确版本**

```json
"devDependencies": {
  "@astrojs/check": "0.9.12",
  "sharp": "0.34.5",
  "tsx": "4.23.15",
  "typescript": "6.0.3"
},
"dependencies": {
  "@astrojs/rss": "4.0.19",
  "@astrojs/sitemap": "3.7.4",
  "astro": "5.18.2",
  "zod": "3.25.76"
}
```

`sharp` 的版本以 `npm ls sharp --depth=0` 输出为准；同时加脚本 `"og": "node scripts/make-og.mjs"`。

运行：`npm install` 后 `npm run check && npm run build`，预期无变化。

- [ ] **步骤 2：CI 增加 PR 触发**

```yaml
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
```

`deploy` job 加条件：

```yaml
  deploy:
    if: github.event_name != 'pull_request'
    needs: build
```

- [ ] **步骤 3：扩展校验脚本**

在 `scripts/verify-build.mjs` 追加：

```js
import { existsSync } from 'node:fs';

const publicationsHtml = await read('dist/publications/index.html');
checks.push(['publications expose topic filters', publicationsHtml.includes('data-group="topic"')]);
checks.push(['publications expose role filter', publicationsHtml.includes('data-group="role"')]);
checks.push(['publications expose topic badges', publicationsHtml.includes('badge-topic')]);

const workHtml = await read('dist/work/index.html');
checks.push(['work exposes topic filter', workHtml.includes('data-value="medical-signal"')]);

const homeHtml = await read('dist/index.html');
checks.push(['home has research areas', homeHtml.includes('Research Areas')]);

const blogSources = await Promise.all(
  blogFiles.map((file) => readFile(`src/content/blog/${file}`, 'utf8'))
);
const tagSet = new Set();
for (const source of blogSources) {
  const match = source.match(/^tags:\s*\[(.+)\]$/m);
  if (match) {
    for (const tag of match[1].split(',')) tagSet.add(tag.trim().replace(/["']/g, ''));
  }
}
const tagPages = await countDirs('dist/blog/tag');
checks.push(['tag pages match tags', tagPages === tagSet.size]);

const cvExists = existsSync('public/cv.pdf');
checks.push([
  'cv link matches pdf presence',
  cvExists ? homeHtml.includes('/cv/cv.pdf') : !homeHtml.includes('/cv/cv.pdf'),
]);
```

- [ ] **步骤 4：全量验证**

```bash
rm -rf dist
npm test
npm run check
npm run build
npm run verify
```

预期：四步全部通过，`verify` 输出新增断言均为 `ok`。

- [ ] **步骤 5：Commit**

```bash
git add package.json package-lock.json .github/workflows/deploy.yml scripts/verify-build.mjs README.md
git commit -m "chore: 锁定依赖版本并增加 PR 校验"
```

---

## 规格覆盖对照

| 规格章节 | 对应任务 |
| --- | --- |
| 4 主题模型 | 任务 1 |
| 5.1 publications | 任务 1、4 |
| 5.2 work | 任务 1、2、5 |
| 5.3 关联校验 | 任务 1 |
| 5.4 BibTeX | 任务 4 |
| 6.1 首页 Research Areas | 任务 3 |
| 6.2 publications 筛选 | 任务 4 |
| 6.3 work 筛选 | 任务 5 |
| 6.4 项目四段式 | 任务 2、5 |
| 6.5 CV PDF | 任务 6 |
| 6.6 标签页 | 任务 7 |
| 6.7 OG image | 任务 7 |
| 6.8 互链 | 任务 1、4、5 |
| 7 工程变更 | 任务 3、6、8 |
| 8 内容迁移 | 任务 1、2 |
| 9 验收标准 | 任务 8（第 7、9、10 条另需手工验证） |
| 10 风险 | 任务 1（枚举）、任务 8（校验） |
