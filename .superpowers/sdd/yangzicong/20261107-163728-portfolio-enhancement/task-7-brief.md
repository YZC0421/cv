### 任务 7：博客标签页与 OG image

**文件：**
- 创建：`src/pages/blog/tag/[tag].astro`、`scripts/make-og.mjs`、`public/og.png`
- 修改：`src/pages/blog/index.astro`、`src/layouts/PostLayout.astro`、`src/layouts/BaseLayout.astro`、`package.json`

- [ ] **步骤 1：写标签页**

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import PostList from '../../../components/PostList.astro';
import { getCollection } from 'astro:content';
import { visiblePosts } from '../../../lib/posts';
import { withBase } from '../../../lib/url';

export async function getStaticPaths() {
  const posts = visiblePosts(await getCollection('blog'));
  const tags = [...new Set(posts.flatMap((post) => post.data.tags))];
  return tags.map((tag) => ({
    params: { tag },
    props: { tag, posts: posts.filter((post) => post.data.tags.includes(tag)) },
  }));
}

const { tag, posts } = Astro.props;
---
<BaseLayout title={`#${tag} · Writing`} description={`Posts tagged ${tag}.`} lang="zh-CN">
  <div class="container measure" style="padding-top:40px">
    <h1>#{tag}</h1>
    <p class="muted"><a href={withBase('blog')}>← All writing</a></p>
    <PostList posts={posts} />
  </div>
</BaseLayout>
```

- [ ] **步骤 2：标签徽标改为链接**

`src/pages/blog/index.astro` 的标签循环改为：

```astro
{post.data.tags.map((tag) => (
  <a class="lang-badge" href={withBase(`blog/tag/${tag}`)}>{tag}</a>
))}
```

`PostLayout.astro` 的 tags 同样改为链接（导入 `withBase`）。

- [ ] **步骤 3：写 `scripts/make-og.mjs`**

```js
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0b1120"/>
  <text x="80" y="290" font-family="Georgia, serif" font-size="92" fill="#e5e7eb">Zicong Yang</text>
  <text x="80" y="360" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#94a3b8">Medical Signal Processing · Industrial Visual Inspection</text>
  <rect x="80" y="420" width="120" height="4" fill="#60a5fa"/>
</svg>`;

await mkdir('public', { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og.png');
console.log('wrote public/og.png');
```

- [ ] **步骤 4：安装 sharp 并生成图片**

```bash
npm install -D sharp
node scripts/make-og.mjs
```

预期：`public/og.png` 存在，尺寸 1200×630。

- [ ] **步骤 5：`BaseLayout` 输出 OG image**

```astro
const ogImage = new URL(withBase('og.png'), Astro.site);
...
<meta property="og:image" content={ogImage} />
<meta name="twitter:card" content="summary_large_image" />
```

- [ ] **步骤 6：构建并断言**

```bash
npm run build
ls dist/blog/tag/*/index.html | wc -l
grep -c 'og:image' dist/index.html
grep -c 'blog/tag/' dist/blog/index.html
```
预期：标签页 `3`（astro / static-site / typescript）；`og:image` `1`；博客列表含标签链接。

- [ ] **步骤 7：Commit**

```bash
git add src/pages/blog src/layouts/PostLayout.astro src/layouts/BaseLayout.astro scripts/make-og.mjs public/og.png package.json package-lock.json
git commit -m "feat: 增加标签页与社交分享图"
```

---

