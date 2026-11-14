#!/usr/bin/env tsx
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { blogSchema } from '../src/lib/schema.ts';

const BLOG_DIR = path.join('src', 'content', 'blog');
const PUB_DIR = path.join('src', 'content', 'publications');
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

async function readFrontmatter(dir, file) {
  const source = await readFile(path.join(dir, file), 'utf8');
  const match = source.match(FRONTMATTER);
  if (!match) return undefined;
  try {
    return parse(match[1]);
  } catch {
    return undefined;
  }
}

const publicationFiles = (await readdir(PUB_DIR)).filter((file) => file.endsWith('.md'));
const publications = await Promise.all(
  publicationFiles.map(async (file) => ({
    id: file.replace(/\.md$/, ''),
    data: (await readFrontmatter(PUB_DIR, file)) ?? {},
  }))
);

const files = (await readdir(BLOG_DIR)).filter((file) => /\.mdx?$/.test(file)).sort();
const errors = [];
const posts = [];
let checked = 0;

for (const file of files) {
  const slug = file.replace(/\.mdx?$/, '');
  const label = `${BLOG_DIR}/${file}`;

  if (!SLUG_PATTERN.test(slug)) {
    errors.push(`${label}: file name must be kebab-case`);
  }

  const source = await readFile(path.join(BLOG_DIR, file), 'utf8');
  if (/!\[[\s]*\]\(/.test(source)) {
    errors.push(`${label}: image is missing alt text`);
  }
  const match = source.match(FRONTMATTER);
  if (!match) {
    errors.push(`${label}: missing YAML frontmatter`);
    continue;
  }

  try {
    const data = blogSchema.parse(parse(match[1]));
    checked += 1;
    if (/^TODO\b/.test(data.summary)) {
      errors.push(`${label}: replace the placeholder summary`);
    }
    posts.push({ slug, label, data });
  } catch (error) {
    const detail = error?.issues
      ? error.issues.map((issue) => `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`).join('; ')
      : String(error);
    errors.push(`${label}: ${detail}`);
  }
}

const bySlug = new Map(posts.map((post) => [post.slug, post]));

for (const post of posts) {
  const { paper, translationOf, lang } = post.data;

  if (paper) {
    const found = publications.some(
      (publication) =>
        publication.id === paper ||
        publication.data.doi === paper ||
        (publication.data.doi && `https://doi.org/${publication.data.doi}` === paper) ||
        publication.data.url === paper
    );
    if (!found) {
      errors.push(`${post.label}: paper "${paper}" does not match any publication`);
    }
  }

  if (translationOf) {
    const target = bySlug.get(translationOf);
    if (!target) {
      errors.push(`${post.label}: translationOf "${translationOf}" does not exist`);
    } else if (target.data.lang === lang) {
      errors.push(
        `${post.label}: translationOf "${translationOf}" is also "${lang}"; translations must be in the other language`
      );
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`checked ${checked} post(s)`);
