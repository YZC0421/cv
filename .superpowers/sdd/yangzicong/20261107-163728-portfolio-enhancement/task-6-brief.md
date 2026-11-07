### 任务 6：CV PDF 与站点常量

**文件：**
- 创建：`src/lib/site.ts`
- 修改：`src/layouts/PageLayout.astro`、`src/pages/index.astro`、`src/components/Hero.astro`、`src/components/Footer.astro`、`README.md`

- [ ] **步骤 1：写 `src/lib/site.ts`**

```ts
import { existsSync } from 'node:fs';

export const site = {
  name: 'Zicong Yang',
  tagline:
    'Software engineer and researcher working on medical signal processing and computer vision.',
  email: '402641915@qq.com',
  github: 'https://github.com/YZC0421',
  scholar: 'https://scholar.google.com/citations?user=0Ynn-awAAAAJ',
  orcid: 'https://orcid.org/0009-0001-0948-3606',
};

export function hasCvPdf(): boolean {
  return existsSync('public/cv.pdf');
}
```

- [ ] **步骤 2：`PageLayout` 支持下载**

frontmatter 增加 `import { hasCvPdf } from '../lib/site';` 与 `const cvAvailable = hasCvPdf();`，操作区改为：

```astro
<div class="about-actions">
  {cvAvailable ? (
    <a class="cv-download" href={withBase('cv.pdf')}>Download CV (PDF)</a>
  ) : (
    <button type="button" onclick="window.print()">{printLabel}</button>
  )}
</div>
```

`PageLayout` 需要 `import { withBase } from '../lib/url';`。

- [ ] **步骤 3：首页增加下载入口**

`src/pages/index.astro` 的 About 区块：

```astro
<div class="links">
  <a href={withBase('about')}>More about me →</a>
  {hasCvPdf() ? (
    <a href={withBase('cv.pdf')}>Download CV (PDF)</a>
  ) : (
    <a href={withBase('about')}>CV (print / PDF)</a>
  )}
</div>
```

- [ ] **步骤 4：Hero 与 Footer 使用站点常量**

`Hero.astro` 与 `Footer.astro` 改为从 `site` 读取姓名、邮箱与链接，删除重复字面量。

- [ ] **步骤 5：README 补 CV 说明**

在 `## Add a post` 之前加：

```markdown
## CV PDF

Place the exported PDF at `public/cv.pdf`. The About pages and the home page will show a
direct download link; without the file they fall back to the print action. Regenerate the
PDF manually whenever the About content changes.
```

- [ ] **步骤 6：验证两种状态**

运行：
```bash
npm run build
grep -c 'cv.pdf' dist/about/index.html dist/index.html
touch public/cv.pdf
npm run build
grep -c 'cv.pdf' dist/about/index.html dist/index.html
rm public/cv.pdf
npm run build
```
预期：第一次两处均为 `0`；第二次均为 `1`；第三次回到 `0`。

- [ ] **步骤 7：Commit**

```bash
git add src/lib/site.ts src/layouts/PageLayout.astro src/pages/index.astro src/components/Hero.astro src/components/Footer.astro README.md
git commit -m "feat: 支持 CV PDF 下载并收拢站点常量"
```

---

