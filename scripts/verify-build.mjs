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
  'dist/projects/index.html',
  'dist/projects/ai-supply-demand-diagnosis/index.html',
  'dist/blog/index.html',
  'dist/blog/category/software-engineering/index.html',
  'dist/about/index.html',
  'dist/about/zh/index.html',
  'dist/resume/index.html',
  'dist/contact/index.html',
  'dist/search/index.html',
  'dist/404.html',
  'dist/rss.xml',
  'dist/sitemap-index.xml',
  'dist/sitemap-0.xml',
  'dist/robots.txt',
  'dist/favicon.svg',
  'dist/CV.html',
  'dist/pagefind/pagefind-ui.js',
  'dist/zh/index.html',
  'dist/zh/projects/index.html',
  'dist/zh/resume/index.html',
  'dist/zh/about/index.html',
  'dist/zh/contact/index.html',
  'dist/zh/blog/index.html',
  'dist/zh/publications/index.html',
  'dist/zh/search/index.html',
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
checks.push(['home shows 3 project cards', (home.match(/class="project-card"/g) ?? []).length === 3]);

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
checks.push([
  'publication topic badges match entries',
  (publications.match(/class="badge badge-topic"/g) ?? []).length >= publicationFiles,
]);

const cssFiles = (await readdir('dist/_astro')).filter((file) => file.endsWith('.css'));
const cssText = (
  await Promise.all(cssFiles.map((file) => readFile(`dist/_astro/${file}`, 'utf8')))
).join('\n');
checks.push(['hidden attribute is enforced', cssText.includes('[hidden]{display:none!important}')]);

const workIndex = await read('dist/work/index.html');
checks.push(['work exposes topic filter', workIndex.includes('data-value="medical-signal"')]);

checks.push(['home has research areas', home.includes('Research Areas')]);
checks.push(['home has og image', /property="og:image"/.test(home)]);
checks.push(['home has twitter card', /name="twitter:card"/.test(home)]);

await must('dist/og.png', 'dist/og.png');
const ogPng = await readFile('dist/og.png');
checks.push([
  'og image is 1200x630',
  ogPng.length > 24 && ogPng.readUInt32BE(16) === 1200 && ogPng.readUInt32BE(20) === 630,
]);

const tagPages = await countDirs('dist/blog/tag');
const linkedTags = new Set(
  [...blogList.matchAll(/blog\/tag\/([^/"#?]+)\//g)].map((match) => decodeURIComponent(match[1]))
);
checks.push(['tag pages match linked tags', tagPages === linkedTags.size]);

const aboutZh = await read('dist/about/zh/index.html');
const projectsHtml = await read('dist/projects/index.html');
checks.push(['projects list has cards', /class="project-card"/.test(projectsHtml)]);

const resumeHtml = await read('dist/resume/index.html');
checks.push([
  'resume has core sections',
  ['Education', 'Work Experience', 'Publications'].every((section) =>
    resumeHtml.includes(`>${section}<`)
  ),
]);

const searchHtml = await read('dist/search/index.html');
checks.push(['search page wires Pagefind', searchHtml.includes('PagefindUI')]);
await must('dist/pagefind/pagefind-entry.json', 'pagefind index');

const zhHome = await read('dist/zh/index.html');
checks.push(['zh home is localized', zhHome.includes('精选项目') && zhHome.includes('研究方向')]);
checks.push(['zh home sets lang', /<html lang="zh-CN"/.test(zhHome)]);
checks.push(['en home declares zh alternate', /hreflang="zh-CN"/.test(home)]);
checks.push([
  'language switch points to zh',
  /href="\/cv\/zh\//.test(home),
]);

const cvExists = existsSync('public/cv.pdf');
checks.push([
  'cv link matches pdf presence on home and about pages',
  cvExists
    ? home.includes('/cv/cv.pdf') &&
      about.includes('/cv/cv.pdf') &&
      aboutZh.includes('/cv/cv.pdf')
    : !home.includes('/cv/cv.pdf') &&
      !about.includes('/cv/cv.pdf') &&
      !aboutZh.includes('/cv/cv.pdf'),
]);

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);

if (failed.length) {
  console.error(`\n${failed.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
