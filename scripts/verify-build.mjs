import { readFile, access, readdir } from 'node:fs/promises';
import { constants, existsSync } from 'node:fs';

const checks = [];

const must = async (path, label) => {
  try {
    await access(path, constants.R_OK);
    checks.push([label, true]);
  } catch {
    checks.push([label, false]);
  }
};

const read = async (path) => {
  try {
    return await readFile(path, 'utf8');
  } catch {
    checks.push([`read ${path}`, false]);
    return '';
  }
};

const countFiles = async (dir, ext) =>
  (await readdir(dir)).filter((file) => file.endsWith(ext)).length;

const countDirs = async (dir, exclude = []) => {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory() && !exclude.includes(entry.name)).length;
  } catch {
    return -1;
  }
};

const indexRoutes = [
  'dist/index.html',
  'dist/publications/index.html',
  'dist/work/index.html',
  'dist/blog/index.html',
  'dist/about/index.html',
  'dist/about/zh/index.html',
  'dist/404.html',
  'dist/rss.xml',
  'dist/sitemap-index.xml',
  'dist/sitemap-0.xml',
  'dist/robots.txt',
  'dist/favicon.svg',
  'dist/CV.html',
];

for (const route of indexRoutes) await must(route, route);

const publicationFiles = await countFiles('src/content/publications', '.md');
const workFiles = await countFiles('src/content/work', '.md');
const workDetails = await countDirs('dist/work');
const postDetails = await countDirs('dist/blog', ['tag']);

checks.push(['work detail pages match content files', workDetails === workFiles]);
checks.push(['blog has at least one post page', postDetails >= 1]);

const home = await read('dist/index.html');
checks.push(['home shows 3 publications', (home.match(/class="pub-item"/g) ?? []).length === 3]);
checks.push(['home shows 3 work cards', (home.match(/class="work-card"/g) ?? []).length === 3]);

const publications = await read('dist/publications/index.html');
checks.push([
  'publications count matches content files',
  (publications.match(/class="pub-item"/g) ?? []).length === publicationFiles,
]);
checks.push([
  'every publication links a doi',
  (publications.match(/doi\.org\//g) ?? []).length >= publicationFiles,
]);

const rss = await read('dist/rss.xml');
checks.push(['rss has items', rss.includes('<item>')]);
checks.push(['rss channel link includes base', /<link>[^<]*\/cv\/<\/link>/.test(rss)]);

const about = await read('dist/about/index.html');
checks.push(['about has h1', /<h1[^>]*>About<\/h1>/.test(about)]);
checks.push(['about declares alternate zh-CN', /rel="alternate" hreflang="zh-CN"/.test(about)]);
checks.push(['about declares alternate en', /rel="alternate" hreflang="en"/.test(about)]);
checks.push(['about declares x-default', /hreflang="x-default"/.test(about)]);

const notFound = await read('dist/404.html');
checks.push(['404 is noindex', /name="robots"[^>]*noindex/.test(notFound)]);

const sitemap = await read('dist/sitemap-0.xml');
checks.push(['sitemap excludes 404', !sitemap.includes('/404')]);

const blogList = await read('dist/blog/index.html');
const blogFiles = (await readdir('src/content/blog')).filter((file) => file.endsWith('.md'));
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
const hiddenPosts = [];

for (const file of blogFiles) {
  const source = await readFile(`src/content/blog/${file}`, 'utf8');
  const draft = /^draft:\s*true\s*$/m.test(source);
  const date = source.match(/^date:\s*"(\d{4}-\d{2}-\d{2})"/m)?.[1];
  if (draft || (date && date > today)) hiddenPosts.push(file.replace(/\.md$/, ''));
}

checks.push([
  'hidden posts stay out of list, rss and sitemap',
  hiddenPosts.every(
    (slug) =>
      !blogList.includes(`/blog/${slug}/`) &&
      !rss.includes(`/blog/${slug}/`) &&
      !sitemap.includes(`/blog/${slug}/`)
  ),
]);

checks.push(['publications expose topic filters', publications.includes('data-group="topic"')]);
checks.push(['publications expose role filter', publications.includes('data-group="role"')]);
checks.push(['publications expose topic badges', publications.includes('badge-topic')]);

const workIndex = await read('dist/work/index.html');
checks.push(['work exposes topic filter', workIndex.includes('data-value="medical-signal"')]);

checks.push(['home has research areas', home.includes('Research Areas')]);
checks.push(['home has og image', /property="og:image"/.test(home)]);
checks.push(['home has twitter card', /name="twitter:card"/.test(home)]);
await must('dist/og.png', 'dist/og.png');

const tagPages = await countDirs('dist/blog/tag');
const tagSet = new Set();
for (const file of blogFiles) {
  const slug = file.replace(/\.md$/, '');
  if (hiddenPosts.includes(slug)) continue;
  const source = await readFile(`src/content/blog/${file}`, 'utf8');
  const match = source.match(/^tags:\s*\[(.+)\]$/m);
  if (match) {
    for (const tag of match[1].split(',')) tagSet.add(tag.trim().replace(/["']/g, ''));
  }
}
checks.push(['tag pages match visible tags', tagPages === tagSet.size]);

const cvExists = existsSync('public/cv.pdf');
checks.push([
  'cv link matches pdf presence',
  cvExists ? home.includes('/cv/cv.pdf') : !home.includes('/cv/cv.pdf'),
]);

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);

if (failed.length) {
  console.error(`\n${failed.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
