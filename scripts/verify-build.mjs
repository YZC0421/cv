import { readFile, access, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';

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

const countDirs = async (dir) =>
  (await readdir(dir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).length;

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
const postDetails = await countDirs('dist/blog');

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
checks.push(['sitemap excludes drafts', !sitemap.includes('/blog/draft-check/')]);

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);

if (failed.length) {
  console.error(`\n${failed.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
