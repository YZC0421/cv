import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ASSET_ATTR = /<(?:a|link|img|script|source|video|audio)\b[^>]*?\b(href|src)="([^"]*)"/gi;
const SRCSET = /<img\b[^>]*?\bsrcset="([^"]*)"/gi;
const SOURCE_LINK = /\]\(([^)\s]+)\)|(?:href|src)=["']([^"']+)["']/g;

export function isInternal(value, base = '/cv') {
  if (!value || value.startsWith('//')) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  if (value.startsWith('#')) return true;
  const prefix = base.replace(/\/$/, '');
  return value === prefix || value.startsWith(`${prefix}/`);
}

export function resolveTarget(pathname, base = '/cv') {
  const prefix = base.replace(/\/$/, '');
  let target = pathname.split('#')[0].split('?')[0];
  if (target === prefix) target = '/';
  else if (target.startsWith(`${prefix}/`)) target = target.slice(prefix.length);
  target = target.replace(/^\/+/, '');
  if (target === '') return 'index.html';
  if (target.endsWith('/')) return `${target}index.html`;
  if (/\.[a-z0-9]+$/i.test(target)) return target;
  return `${target}/index.html`;
}

async function walk(dir, filter) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full, filter)));
    else if (filter(full)) files.push(full);
  }
  return files;
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function sourceIndex(srcDir) {
  const map = new Map();
  if (!srcDir) return map;
  const files = await walk(srcDir, (file) => /\.(mdx?|astro|ts|mjs)$/.test(file));
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    for (const match of text.matchAll(SOURCE_LINK)) {
      const link = match[1] ?? match[2];
      if (link && !map.has(link)) map.set(link, file);
    }
  }
  return map;
}

export async function checkLinks({ distDir = 'dist', base = '/cv', srcDir = 'src' } = {}) {
  const prefix = base.replace(/\/$/, '');
  const files = await walk(distDir, (file) => file.endsWith('.html'));
  const sources = await sourceIndex(srcDir);
  const errors = [];
  const imageErrors = [];
  const htmlCache = new Map();
  const targetCache = new Map();
  let checked = 0;
  let images = 0;

  const readHtml = async (file) => {
    if (!htmlCache.has(file)) htmlCache.set(file, await readFile(file, 'utf8'));
    return htmlCache.get(file);
  };

  const hint = (link) => {
    const source = sources.get(link);
    return source ? ` (see ${source})` : '';
  };

  for (const file of files) {
    const rel = path.relative(distDir, file).split(path.sep).join('/');
    const suffix = rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel;
    const pagePath = `${prefix}/${suffix}`;
    const html = await readHtml(file);

    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      images += 1;
      const alt = match[0].match(/\salt="([^"]*)"/i)?.[1];
      if (alt === undefined || alt.trim() === '' || match[0].includes('data-missing-alt')) {
        imageErrors.push(`${file}: <img> missing alt text: ${match[0].slice(0, 120)}`);
      }
    }

    const links = [
      ...[...html.matchAll(ASSET_ATTR)].map((match) => match[2]),
      ...[...html.matchAll(SRCSET)].flatMap((match) =>
        match[1].split(',').map((part) => part.trim().split(/\s+/)[0])
      ),
    ];

    for (const link of links) {
      if (!link || link === '#') continue;
      if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('//')) continue;

      const url = new URL(link, `https://site.invalid${pagePath}`);
      if (!isInternal(url.pathname, base)) {
        errors.push(`${file}: ${link} → expected ${prefix}/... (missing base)${hint(link)}`);
        continue;
      }

      let hash = url.hash.replace(/^#/, '');
      try {
        hash = decodeURIComponent(hash);
      } catch {
        // keep the raw hash when it is not valid percent-encoding
      }
      const target = resolveTarget(url.pathname, base);
      const targetFile = path.join(distDir, target);
      checked += 1;

      let present = targetCache.get(target);
      if (present === undefined) {
        present = await exists(targetFile);
        targetCache.set(target, present);
      }
      if (!present) {
        errors.push(`${file}: ${link} → ${target} (missing)${hint(link)}`);
        continue;
      }

      if (hash && target.endsWith('.html')) {
        const targetHtml = await readHtml(targetFile);
        const escaped = hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const anchored = new RegExp(`(?:id|name)="${escaped}"`).test(targetHtml);
        if (!anchored) {
          errors.push(`${file}: ${link} → #${hash} (missing anchor)${hint(link)}`);
        }
      }
    }
  }

  return { checked, errors, imageErrors, images };
}
