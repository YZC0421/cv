import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const checks = [];

const must = async (path, label) => {
  try {
    await access(path, constants.R_OK);
    checks.push([label, true]);
    return true;
  } catch {
    checks.push([label, false]);
    return false;
  }
};

const routes = [
  'dist/index.html',
  'dist/publications/index.html',
  'dist/work/index.html',
  'dist/work/guangzhou-xiyang/index.html',
  'dist/work/sudden-cardiac-death-prediction/index.html',
  'dist/blog/index.html',
  'dist/blog/from-single-page-to-astro/index.html',
  'dist/about/index.html',
  'dist/about/zh/index.html',
  'dist/404.html',
  'dist/rss.xml',
  'dist/sitemap-index.xml',
  'dist/robots.txt',
  'dist/favicon.svg',
  'dist/CV.html',
];

for (const route of routes) await must(route, route);

const home = await readFile('dist/index.html', 'utf8');
checks.push(['home shows 3 publications', (home.match(/class="pub-item"/g) ?? []).length === 3]);
checks.push(['home shows 3 work cards', (home.match(/class="work-card"/g) ?? []).length === 3]);

const pubs = await readFile('dist/publications/index.html', 'utf8');
checks.push(['publications has 6 entries', (pubs.match(/class="pub-item"/g) ?? []).length === 6]);
checks.push(['publications include doi links', pubs.includes('doi.org')]);

const rss = await readFile('dist/rss.xml', 'utf8');
checks.push(['rss has items', rss.includes('<item>')]);
checks.push(['rss channel link includes base', rss.includes('<link>https://yzc0421.github.io/cv/</link>')]);

const about = await readFile('dist/about/index.html', 'utf8');
checks.push(['about has h1', about.includes('<h1>About</h1>')]);
checks.push(['about includes hreflang', about.includes('hreflang="zh-CN"')]);

const notFound = await readFile('dist/404.html', 'utf8');
checks.push(['404 is noindex', notFound.includes('name="robots" content="noindex"')]);

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);

if (failed.length) {
  console.error(`\n${failed.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
