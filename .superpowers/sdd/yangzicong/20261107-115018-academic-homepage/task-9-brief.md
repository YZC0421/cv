### 任务 9：SEO、404、sitemap 与导航收尾

**文件：**
- 创建：`src/pages/404.astro`、`public/robots.txt`、`public/favicon.svg`
- 修改：`src/layouts/BaseLayout.astro`、`src/layouts/PostLayout.astro`、`src/components/Header.astro`、`astro.config.mjs`

- [ ] **步骤 1：在 `BaseLayout.astro` 增加 JSON-LD 与文章元信息**

在 `BaseLayout.astro` 顶部 frontmatter 中追加（与已有 `const base` 同一段），并在 `<head>` 末尾插入 script：

```ts
const personId = new URL(`${base}#person`, Astro.site).href;
const profile = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfilePage', mainEntity: { '@id': personId } },
    {
      '@type': 'Person',
      '@id': personId,
      name: 'Zicong Yang',
      jobTitle: 'Software Engineer',
      sameAs: [
        'https://scholar.google.com/citations?user=0Ynn-awAAAAJ',
        'https://orcid.org/0009-0001-0948-3606',
        'https://github.com/YZC0421',
      ],
    },
  ],
};
```

```astro
<script type="application/ld+json" set:html={JSON.stringify(profile)} />
```

- [ ] **步骤 2：写 `404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
const base = import.meta.env.BASE_URL;
---
<BaseLayout title="Not found · Zicong Yang" description="Page not found.">
  <div class="container measure" style="padding:80px 24px">
    <h1>404</h1>
    <p class="muted">This page does not exist.</p>
    <p><a href={base}>Back to home →</a></p>
  </div>
</BaseLayout>
```

- [ ] **步骤 3：写 `robots.txt` 与 `favicon.svg`**

`public/robots.txt`：

```
User-agent: *
Allow: /

Sitemap: https://yzc0421.github.io/cv/sitemap-index.xml
```

`public/favicon.svg`：

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#111827"/>
  <text x="16" y="22" font-family="Georgia, serif" font-size="16" fill="#ffffff" text-anchor="middle">Z</text>
</svg>
```

- [ ] **步骤 4：为 sitemap 排除草稿页**

修改 `astro.config.mjs` 的集成配置：

```js
integrations: [
  sitemap({
    filter: (page) => !page.includes('/404'),
  }),
],
```

- [ ] **步骤 5：构建并断言 404 与 sitemap**

运行：
```bash
npm run build
ls dist/404.html dist/sitemap-index.xml dist/robots.txt dist/favicon.svg
grep -c 'sitemap' dist/robots.txt
```
预期：四个文件存在，`robots.txt` 含 1 处 sitemap 声明。

- [ ] **步骤 6：预览检查导航高亮与移动菜单**

运行：`npm run dev`，分别打开 `/cv/publications`、`/cv/work`、`/cv/blog`、`/cv/about`。
预期：对应导航项为深色加粗；375px 宽度下显示 `Menu` 按钮，点击展开导航，页面无横向滚动。`Ctrl+C` 停止。

- [ ] **步骤 7：Commit**

```bash
git add src/pages/404.astro src/layouts/BaseLayout.astro public/robots.txt public/favicon.svg astro.config.mjs
git commit -m "feat: 补齐 SEO、404 与站点图标"
```

---

