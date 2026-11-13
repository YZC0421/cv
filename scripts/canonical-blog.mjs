import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const CONTENT_DIR = path.join('src', 'content', 'blog');
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const LANG = /^lang:\s*["']?(en|zh)["']?\s*$/m;

/**
 * Duplicate post URLs are kept for old links but must stay out of the sitemap.
 * Chinese posts are canonical under /zh/blog, English posts under /blog.
 */
export async function excludedBlogPaths(base = '/cv') {
  const prefix = base.replace(/\/$/, '');
  const excluded = new Set();
  let files = [];
  try {
    files = (await readdir(CONTENT_DIR)).filter((file) => /\.mdx?$/.test(file));
  } catch {
    return excluded;
  }

  for (const file of files) {
    const slug = file.replace(/\.mdx?$/, '');
    const source = await readFile(path.join(CONTENT_DIR, file), 'utf8');
    const lang = source.match(FRONTMATTER)?.[1].match(LANG)?.[1];
    if (!lang) continue;
    excluded.add(lang === 'zh' ? `${prefix}/blog/${slug}/` : `${prefix}/zh/blog/${slug}/`);
  }

  return excluded;
}
