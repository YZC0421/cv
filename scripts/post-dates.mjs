import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const FIELD = (name) => new RegExp(`^${name}:\\s*"?([0-9]{4}-[0-9]{2}-[0-9]{2})"?`, 'm');

/** Maps canonical post URLs to the last date the content was known accurate. */
export async function postDates(base = '/cv', dir = 'src/content/blog') {
  const map = new Map();
  let files = [];
  try {
    files = await readdir(dir);
  } catch {
    return map;
  }

  for (const file of files.filter((name) => /\.mdx?$/.test(name))) {
    const source = await readFile(path.join(dir, file), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const date = frontmatter.match(FIELD('date'))?.[1];
    if (!date) continue;

    const lastmod =
      frontmatter.match(FIELD('reviewed'))?.[1] ??
      frontmatter.match(FIELD('updated'))?.[1] ??
      date;
    const lang = frontmatter.match(/^lang:\s*"?([a-z]+)"?/m)?.[1] ?? 'en';
    const slug = file.replace(/\.mdx?$/, '');
    const pathname = lang === 'zh' ? `${base}/zh/blog/${slug}/` : `${base}/blog/${slug}/`;
    map.set(pathname, lastmod);
  }

  return map;
}
