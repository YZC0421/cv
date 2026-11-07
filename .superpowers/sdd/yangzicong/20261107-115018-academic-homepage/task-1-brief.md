### 任务 1：脚手架、设计 token 与基础布局

**文件：**
- 创建：`package.json`、`astro.config.mjs`、`tsconfig.json`、`src/styles/global.css`、`src/layouts/BaseLayout.astro`、`src/components/ThemeToggle.astro`、`src/components/Header.astro`、`src/components/Footer.astro`、`src/pages/index.astro`
- 测试：无（后续任务用构建验证）

- [ ] **步骤 1：写 `package.json`**

```json
{
  "name": "cv",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "tsx --test tests/*.test.ts",
    "verify": "node scripts/verify-build.mjs"
  }
}
```

- [ ] **步骤 2：安装依赖**

```bash
cd /Users/yangzicong/CodeBuddy/cv
npm install astro@^5 @astrojs/rss @astrojs/sitemap zod
npm install -D @astrojs/check typescript tsx
```

预期：`package.json` 出现 `dependencies` 与 `devDependencies` 字段，`node_modules/`、`package-lock.json` 生成，`npm ls astro` 显示 `astro@5.x`。

- [ ] **步骤 3：写 `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yzc0421.github.io',
  base: '/cv',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
```

- [ ] **步骤 4：写 `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strictNullChecks": true,
    "allowJs": true
  }
}
```

- [ ] **步骤 5：写 `src/styles/global.css`**

```css
:root {
  --bg: #ffffff;
  --bg-soft: #f8fafc;
  --fg: #111827;
  --muted: #64748b;
  --border: #e2e8f0;
  --accent: #1d4ed8;
  --q1-bg: #fffbeb;
  --q1-fg: #b45309;
  --q4-bg: #f3e8ff;
  --q4-fg: #7e22ce;
  --ei-bg: #ecfdf5;
  --ei-fg: #047857;
  --font-serif: "Source Serif 4", Georgia, "Songti SC", serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
  --measure: 720px;
  --wide: 1120px;
  color-scheme: light;
}

[data-theme='dark'] {
  --bg: #0b1120;
  --bg-soft: #111a2e;
  --fg: #e5e7eb;
  --muted: #94a3b8;
  --border: #1f2a3d;
  --accent: #60a5fa;
  --q1-bg: #2a1f06;
  --q1-fg: #fbbf24;
  --q4-bg: #241432;
  --q4-fg: #d8b4fe;
  --ei-bg: #052e22;
  --ei-fg: #6ee7b7;
  color-scheme: dark;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.7;
  transition: background-color 150ms ease, color 150ms ease;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

h1, h2, h3 { font-family: var(--font-serif); line-height: 1.25; margin: 0; }
h1 { font-size: 2.25rem; letter-spacing: -0.02em; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.125rem; }

.container { width: 100%; max-width: var(--wide); margin: 0 auto; padding: 0 24px; }
.measure { max-width: var(--measure); }
.muted { color: var(--muted); }
.rule { border: 0; border-top: 1px solid var(--border); margin: 0; }

.skip {
  position: absolute;
  left: -9999px;
  top: 0;
  background: var(--bg);
  padding: 8px 12px;
  z-index: 100;
}
.skip:focus { left: 8px; }

.site-header {
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  backdrop-filter: blur(8px);
  z-index: 50;
}
.site-header .inner {
  max-width: var(--wide);
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.brand { font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600; color: var(--fg); }
.nav-details { margin-left: auto; }
.nav-details > summary { list-style: none; }
.nav-details > summary::-webkit-details-marker { display: none; }
.nav { display: flex; gap: 18px; font-size: 0.9rem; }
.nav a { color: var(--muted); }
.nav a[aria-current='page'] { color: var(--fg); font-weight: 600; }
.nav-toggle { display: none; cursor: pointer; background: none; border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; color: var(--fg); font: inherit; }
.theme-toggle { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 2px 8px; color: var(--muted); cursor: pointer; font: inherit; }
.site-footer { border-top: 1px solid var(--border); margin-top: 72px; padding: 28px 0; color: var(--muted); font-size: 0.85rem; }

@media (max-width: 767px) {
  .nav-details { position: relative; }
  .nav-toggle { display: block; }
  .nav-details > .nav { display: none; }
  .nav-details[open] > .nav {
    display: flex;
    flex-direction: column;
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    min-width: 180px;
    padding: 16px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    z-index: 60;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
```

- [ ] **步骤 6：写 `BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description: string;
  lang?: string;
  type?: 'website' | 'article';
}
const { title, description, lang = 'en', type = 'website' } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
const base = import.meta.env.BASE_URL;
---
<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" href={`${base}favicon.svg`} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content={type} />
    <meta property="og:url" content={canonical} />
    <slot name="head" />
    <script is:inline>
      (() => {
        const saved = localStorage.getItem('theme');
        const dark = saved
          ? saved === 'dark'
          : window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      })();
    </script>
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <Header />
    <main id="main"><slot /></main>
    <Footer />
  </body>
</html>
```

- [ ] **步骤 7：写 Header、Footer、ThemeToggle**

`src/components/ThemeToggle.astro`：

```astro
<button id="theme-toggle" type="button" aria-label="Toggle dark mode" class="theme-toggle">◐</button>
<script is:inline>
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
  });
</script>
```

`src/components/Header.astro`：

```astro
---
import ThemeToggle from './ThemeToggle.astro';
const base = import.meta.env.BASE_URL;
const path = Astro.url.pathname;
const links = [
  { href: `${base}publications`, label: 'Publications' },
  { href: `${base}work`, label: 'Work' },
  { href: `${base}blog`, label: 'Writing' },
  { href: `${base}about`, label: 'About' },
];
const trail = path.replace(base, '/');
const isCurrent = (href: string) => {
  const target = href.replace(base, '/');
  return target === '/' ? trail === '/' : trail.startsWith(target);
};
---
<header class="site-header">
  <div class="inner">
    <a class="brand" href={base}>Zicong Yang</a>
    <details class="nav-details">
      <summary class="nav-toggle">Menu</summary>
      <nav class="nav">
        {links.map((link) => (
          <a href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>{link.label}</a>
        ))}
      </nav>
    </details>
    <ThemeToggle />
  </div>
</header>
```

`src/components/Footer.astro`：

```astro
---
const year = new Date().getFullYear();
const base = import.meta.env.BASE_URL;
---
<footer class="site-footer">
  <div class="container">
    © {year} Zicong Yang · <a href={`${base}rss.xml`}>RSS</a> ·
    <a href="https://scholar.google.com/citations?user=0Ynn-awAAAAJ">Scholar</a> ·
    <a href="https://orcid.org/0009-0001-0948-3606">ORCID</a>
  </div>
</footer>
```

- [ ] **步骤 8：写临时首页并验证构建**

`src/pages/index.astro`：

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Zicong Yang" description="Medical signal processing and computer vision.">
  <div class="container" style="padding-top:48px">
    <h1>Zicong Yang</h1>
  </div>
</BaseLayout>
```

运行：`npm run build`
预期：`dist/index.html` 生成，命令退出码 0。

- [ ] **步骤 9：本地预览确认无样式缺失**

运行：`npm run dev`，浏览器打开 `http://localhost:4321/cv/`。
预期：白底、衬线标题、导航含四项，无控制台报错。确认后 `Ctrl+C` 停止。

- [ ] **步骤 10：Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json src/
git commit -m "feat: 搭建 Astro 基座与设计 token"
```

---

