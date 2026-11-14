import sharp from 'sharp';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { categoryLabel } from '../src/lib/blog.ts';
import { localToday } from '../src/lib/date.ts';
import { escapeXml, wrapTitle } from '../src/lib/og.ts';

const BLOG_DIR = path.join('src', 'content', 'blog');
const POST_OG_DIR = path.join('dist', 'og');
const FONT =
  "'Noto Sans CJK SC', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Georgia, serif";
const BG = '#0b1120';
const FG = '#e5e7eb';
const MUTED = '#94a3b8';
const ACCENT = '#60a5fa';

function frame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${BG}"/>
  ${inner}
</svg>`;
}

function globalSvg() {
  return frame(`
  <text x="80" y="120" font-family="${FONT}" font-size="24" fill="${MUTED}">Zicong Yang</text>
  <text x="80" y="300" font-family="${FONT}" font-size="92" font-weight="600" fill="${FG}">Zicong Yang</text>
  <text x="80" y="370" font-family="${FONT}" font-size="30" fill="${MUTED}">Medical Signal Processing · Industrial Visual Inspection</text>
  <rect x="80" y="470" width="120" height="4" fill="${ACCENT}"/>
  `);
}

function postSvg({ title, subtitle, footer }) {
  const lines = wrapTitle(title, 18, 3);
  const fontSize = lines.length >= 3 ? 54 : 64;
  const firstLineY = 300 - (lines.length - 1) * fontSize * 0.62;
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="80" dy="${index === 0 ? 0 : fontSize * 1.25}">${escapeXml(line)}</tspan>`
    )
    .join('');

  return frame(`
  <text x="80" y="120" font-family="${FONT}" font-size="24" fill="${MUTED}">Zicong Yang</text>
  <text x="80" y="${firstLineY}" font-family="${FONT}" font-size="${fontSize}" font-weight="600" fill="${FG}">${tspans}</text>
  <rect x="80" y="470" width="120" height="4" fill="${ACCENT}"/>
  <text x="80" y="535" font-family="${FONT}" font-size="26" fill="${MUTED}">${escapeXml(subtitle)}</text>
  <text x="80" y="580" font-family="${FONT}" font-size="22" fill="${MUTED}">${escapeXml(footer)}</text>
  `);
}

async function writeGlobal() {
  await mkdir('public', { recursive: true });
  await sharp(Buffer.from(globalSvg())).png({ compressionLevel: 9 }).toFile('public/og.png');
  console.log('wrote public/og.png');
}

async function writePosts() {
  let files = [];
  try {
    files = (await readdir(BLOG_DIR)).filter((file) => /\.mdx?$/.test(file));
  } catch {
    return;
  }

  const today = localToday();
  const written = [];

  for (const file of files) {
    const source = await readFile(path.join(BLOG_DIR, file), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
    if (!frontmatter) continue;

    let data;
    try {
      data = parse(frontmatter);
    } catch {
      continue;
    }
    if (data.draft === true || !data.date || data.date > today) continue;

    const lang = data.lang === 'zh' ? 'zh' : 'en';
    const slug = file.replace(/\.mdx?$/, '');
    const subtitle = `${categoryLabel(data.category ?? 'notes', lang)} · ${data.date}`;
    const svg = postSvg({
      title: String(data.title ?? slug),
      subtitle,
      footer: lang === 'zh' ? '技术笔记' : 'Technical writing',
    });

    await mkdir(POST_OG_DIR, { recursive: true });
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9 })
      .toFile(path.join(POST_OG_DIR, `${slug}.png`));

    written.push(slug);
  }

  console.log(`wrote ${written.length} post og image(s) to ${POST_OG_DIR}`);
}

if (process.argv.includes('--posts')) {
  await writePosts();
} else {
  await writeGlobal();
}
