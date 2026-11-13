#!/usr/bin/env tsx
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { blogSchema } from '../src/lib/schema.ts';

const CONTENT_DIR = path.join('src', 'content', 'blog');
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

const files = (await readdir(CONTENT_DIR)).filter((file) => /\.mdx?$/.test(file)).sort();
const errors = [];
let checked = 0;

for (const file of files) {
  const slug = file.replace(/\.mdx?$/, '');
  const label = `${CONTENT_DIR}/${file}`;

  if (!SLUG_PATTERN.test(slug)) {
    errors.push(`${label}: file name must be kebab-case`);
  }

  const source = await readFile(`${CONTENT_DIR}/${file}`, 'utf8');
  const match = source.match(FRONTMATTER);
  if (!match) {
    errors.push(`${label}: missing YAML frontmatter`);
    continue;
  }

  try {
    const data = blogSchema.parse(parse(match[1]));
    checked += 1;
    if (data.updated && data.updated < data.date) {
      errors.push(`${label}: updated (${data.updated}) is earlier than date (${data.date})`);
    }
    if (/^TODO\b/.test(data.summary)) {
      errors.push(`${label}: replace the placeholder summary`);
    }
  } catch (error) {
    const detail = error?.issues
      ? error.issues.map((issue) => `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`).join('; ')
      : String(error);
    errors.push(`${label}: ${detail}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`checked ${checked} post(s)`);
