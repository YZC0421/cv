#!/usr/bin/env tsx
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { localToday } from '../src/lib/date.ts';
import { blogCategories, blogSchema } from '../src/lib/schema.ts';

const CONTENT_DIR = path.join('src', 'content', 'blog');
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const args = process.argv.slice(2);
const flags = new Map();
const positional = [];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const next = args[index + 1];
    if (next && !next.startsWith('--')) {
      flags.set(key, next);
      index += 1;
    } else {
      flags.set(key, true);
    }
  } else {
    positional.push(arg);
  }
}

const title = positional.join(' ').trim();
if (!title) {
  console.error('usage: npm run new -- "标题" [--lang zh|en] [--category notes] [--slug kebab-case] [--tags a,b]');
  process.exit(1);
}

const lang = String(flags.get('lang') ?? 'zh');
if (lang !== 'zh' && lang !== 'en') {
  console.error(`unsupported lang "${lang}", expected zh or en`);
  process.exit(1);
}

const category = String(flags.get('category') ?? 'notes');
if (!blogCategories.includes(category)) {
  console.error(`unknown category "${category}"\nvalid: ${blogCategories.join(', ')}`);
  process.exit(1);
}

const tags = String(flags.get('tags') ?? '')
  .split(',')
  .map((tag) => tag.trim())
  .filter(Boolean);
const badTag = tags.find((tag) => !SLUG_PATTERN.test(tag));
if (badTag) {
  console.error(`tag "${badTag}" must be kebab-case (lowercase letters, digits, hyphens)`);
  process.exit(1);
}

const data = {
  title,
  date: localToday(),
  lang,
  category,
  tags: tags.length > 0 ? tags : ['notes'],
  summary: 'TODO: 一句话摘要（≤160 字）',
  draft: true,
};

const parsed = blogSchema.safeParse(data);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`)
    .join('\n');
  console.error(`generated frontmatter is invalid:\n${issues}`);
  process.exit(1);
}
const post = parsed.data;

function deriveSlug(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const slug = String(flags.get('slug') ?? deriveSlug(title));
if (!slug) {
  console.error('cannot derive a slug from this title; pass --slug <kebab-case>');
  process.exit(1);
}
if (!SLUG_PATTERN.test(slug)) {
  console.error(`slug "${slug}" must be kebab-case (lowercase letters, digits, hyphens)`);
  process.exit(1);
}

const target = path.join(CONTENT_DIR, `${slug}.md`);
try {
  await access(target);
  console.error(`${target} already exists`);
  process.exit(1);
} catch {
  // expected: the file should not exist yet
}

const frontmatter = [
  '---',
  `title: ${JSON.stringify(post.title)}`,
  `date: ${JSON.stringify(post.date)}`,
  `lang: ${JSON.stringify(post.lang)}`,
  `category: ${JSON.stringify(post.category)}`,
  `tags: ${JSON.stringify(post.tags)}`,
  `summary: ${JSON.stringify(post.summary)}`,
  `draft: ${post.draft}`,
  '---',
  '',
].join('\n');

const body = [
  '先说明这篇文章要解决的问题。',
  '',
  '## 背景',
  '',
  '## 做法',
  '',
  '## 结论',
  '',
].join('\n');

await mkdir(CONTENT_DIR, { recursive: true });
await writeFile(target, frontmatter + body, 'utf8');

const langPrefix = lang === 'zh' ? 'zh/' : '';
console.log(`created ${target}`);
console.log(`next: npm run dev → http://localhost:4321/cv/${langPrefix}blog/${slug}/`);
console.log('replace the placeholder summary, then run npm run post:check');
