import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { excludedBlogPaths } from './scripts/canonical-blog.mjs';
import { postDates } from './scripts/post-dates.mjs';
import { rehypeFigure } from './scripts/rehype-figure.mjs';
import { codeMetaTransformer } from './scripts/shiki-code-meta.mjs';

const excluded = await excludedBlogPaths('/cv');
const lastmods = await postDates('/cv');

export default defineConfig({
  site: 'https://yzc0421.github.io',
  base: '/cv',
  output: 'static',
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        if (page.includes('/404')) return false;
        const pathname = new URL(page).pathname.replace(/\/?$/, '/');
        return !excluded.has(pathname);
      },
      serialize(item) {
        const pathname = new URL(item.url).pathname.replace(/\/?$/, '/');
        const lastmod = lastmods.get(pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeFigure, rehypeKatex],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      transformers: [codeMetaTransformer()],
    },
  },
});
