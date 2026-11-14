#!/usr/bin/env tsx
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { localToday } from '../src/lib/date.ts';
import { noteBody, paperNoteSeed, projectNoteSeed } from '../src/lib/note-templates.ts';
import { blogCategories, blogSchema } from '../src/lib/schema.ts';

const BLOG_DIR = path.join('src', 'content', 'blog');
const PUB_DIR = path.join('src', 'content', 'publications');
const PROJECT_DIR = path.join('src', 'content', 'projects');
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

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

const providedTitle = positional.join(' ').trim();
const paperRef = flags.get('paper');
const projectRef = flags.get('project');
const translateRef = flags.get('translate-of');

if (!providedTitle && !paperRef && !projectRef && !translateRef) {
  console.error(
    [
      'usage:',
      '  npm run new -- "标题" [--lang zh|en] [--category notes] [--slug kebab-case] [--tags a,b]',
      '  npm run new -- --paper <DOI|publication-id> [--lang zh|en] [--slug ...]',
      '  npm run new -- --project <project-slug> [--lang zh|en] [--slug ...]',
      '  npm run new -- --translate-of <post-slug> [--slug ...]',
    ].join('\n')
  );
  process.exit(1);
}

async function readCollection(dir) {
  let files = [];
  try {
    files = (await readdir(dir)).filter((file) => /\.mdx?$/.test(file)).sort();
  } catch {
    return [];
  }
  return Promise.all(
    files.map(async (file) => {
      const source = await readFile(path.join(dir, file), 'utf8');
      const match = source.match(FRONTMATTER);
      return {
        id: file.replace(/\.mdx?$/, ''),
        file: path.join(dir, file),
        data: match ? parse(match[1]) : {},
        body: match ? source.slice(match[0].length) : source,
      };
    })
  );
}

function findPaper(papers, ref) {
  return papers.find(
    (paper) =>
      paper.id === ref ||
      paper.data.doi === ref ||
      (paper.data.doi && `https://doi.org/${paper.data.doi}` === ref) ||
      paper.data.url === ref
  );
}

const publications = paperRef ? await readCollection(PUB_DIR) : [];
const projects = projectRef ? await readCollection(PROJECT_DIR) : [];
const posts = translateRef ? await readCollection(BLOG_DIR) : [];

const paper = paperRef ? findPaper(publications, String(paperRef)) : undefined;
if (paperRef && !paper) {
  console.error(`publication "${paperRef}" not found. candidates:`);
  for (const item of publications.slice(0, 8)) {
    console.error(`  ${item.id}  ${item.data.title ?? ''}  ${item.data.doi ?? ''}`);
  }
  process.exit(1);
}

const project = projectRef ? projects.find((item) => item.id === String(projectRef)) : undefined;
if (projectRef && !project) {
  console.error(`project "${projectRef}" not found. candidates:`);
  for (const item of projects) console.error(`  ${item.id}  ${item.data.title ?? ''}`);
  process.exit(1);
}

const translateSource = translateRef
  ? posts.find((item) => item.id === String(translateRef))
  : undefined;
if (translateRef && !translateSource) {
  console.error(`post "${translateRef}" not found. candidates:`);
  for (const item of posts) console.error(`  ${item.id}  (${item.data.lang ?? '?'})`);
  process.exit(1);
}

const sourceLang = translateSource?.data.lang === 'en' ? 'en' : 'zh';
const lang = String(flags.get('lang') ?? (translateSource
  ? sourceLang === 'zh'
    ? 'en'
    : 'zh'
  : 'zh'));
if (lang !== 'zh' && lang !== 'en') {
  console.error(`unsupported lang "${lang}", expected zh or en`);
  process.exit(1);
}
if (translateSource && translateSource.data.lang === lang) {
  console.error(`--translate-of expects the other language; source is already "${lang}"`);
  process.exit(1);
}

const seed = paper
  ? paperNoteSeed({ id: paper.id, ...paper.data }, lang)
  : project
    ? projectNoteSeed({ title: project.data.title, category: project.data.category }, lang)
    : translateSource
      ? {
          title: `TODO: ${translateSource.data.title}`,
          category: translateSource.data.category ?? 'notes',
          tags: translateSource.data.tags ?? ['notes'],
          summary:
            lang === 'zh'
              ? 'TODO: 一句话摘要（≤160 字）'
              : 'TODO: one-line summary (≤160 chars)',
          paper: translateSource.data.paper,
        }
      : undefined;

const title = providedTitle || seed?.title || '';
if (!title) {
  console.error('a title is required');
  process.exit(1);
}

const category = String(flags.get('category') ?? seed?.category ?? 'notes');
if (!blogCategories.includes(category)) {
  console.error(`unknown category "${category}"\nvalid: ${blogCategories.join(', ')}`);
  process.exit(1);
}

const tags = String(flags.get('tags') ?? '')
  .split(',')
  .map((tag) => tag.trim())
  .filter(Boolean);
const finalTags = tags.length > 0 ? tags : (seed?.tags ?? ['notes']);
const badTag = finalTags.find((tag) => !SLUG_PATTERN.test(tag));
if (badTag) {
  console.error(`tag "${badTag}" must be kebab-case (lowercase letters, digits, hyphens)`);
  process.exit(1);
}

const data = {
  title,
  date: localToday(),
  lang,
  category,
  tags: finalTags,
  summary: seed?.summary ?? 'TODO: 一句话摘要（≤160 字）',
  draft: true,
  ...(seed?.paper ? { paper: seed.paper } : {}),
  ...(translateSource ? { translationOf: translateSource.id } : {}),
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

const defaultSlug = translateSource
  ? `${translateSource.id}-${lang}`
  : paper
    ? `${paper.id}-note`
    : project
      ? `${project.id}-note`
      : deriveSlug(title);

const slug = String(flags.get('slug') ?? defaultSlug);
if (!slug) {
  console.error('cannot derive a slug from this title; pass --slug <kebab-case>');
  process.exit(1);
}
if (!SLUG_PATTERN.test(slug)) {
  console.error(`slug "${slug}" must be kebab-case (lowercase letters, digits, hyphens)`);
  process.exit(1);
}

const target = path.join(BLOG_DIR, `${slug}.md`);
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
  ...(post.paper ? [`paper: ${JSON.stringify(post.paper)}`] : []),
  ...(post.translationOf ? [`translationOf: ${JSON.stringify(post.translationOf)}`] : []),
  '---',
  '',
].join('\n');

const body = paper
  ? noteBody('paper', lang)
  : project
    ? noteBody('project', lang)
    : translateSource
      ? `${lang === 'zh' ? '<!-- TODO: 翻译这篇草稿 -->' : '<!-- TODO: translate this draft -->'}\n\n${translateSource.body}`
      : [
          '先说明这篇文章要解决的问题。',
          '',
          '## 背景',
          '',
          '## 做法',
          '',
          '## 结论',
          '',
        ].join('\n');

await mkdir(BLOG_DIR, { recursive: true });
await writeFile(target, frontmatter + body, 'utf8');

const langPrefix = lang === 'zh' ? 'zh/' : '';
console.log(`created ${target}`);
console.log(`next: npm run dev → http://localhost:4321/cv/${langPrefix}blog/${slug}/`);
console.log('replace the placeholder summary, then run npm run post:check');
