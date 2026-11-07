import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'scripts/out';
const targets = [
  { key: 'scientific-reports-2024', doi: '10.1038/s41598-024-71700-z' },
  { key: 'cisse-2024', doi: '10.1007/978-3-031-57037-7_7' },
  { key: 'mst-2025', doi: '10.1088/1361-6501/ae10d3' },
  {
    key: 'cvidl-2024-wheat',
    title:
      'Wheat Disease Recognition Based on a Fusion Model with Improved Spatial and Channel Reconstruction Convolution Combined with Contextual Transformer',
  },
  {
    key: 'cvidl-2024-garbage',
    title: 'Enhanced and improved garbage identification and classification of YOLOV5 based on data',
  },
  { key: 'ipmlp-2024', doi: '10.1145/3700906.3700946' },
];

const fetchJson = async (url) => {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'cv-site-build/1.0 (mailto:402641915@qq.com)' },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

const lookup = async (target) => {
  if (target.doi) {
    const json = await fetchJson(`https://api.crossref.org/works/${encodeURIComponent(target.doi)}`);
    return json.message;
  }
  const q = encodeURIComponent(target.title);
  const json = await fetchJson(`https://api.crossref.org/works?query.bibliographic=${q}&rows=1`);
  return json.message.items?.[0];
};

const toEntry = (item) => {
  const authors = (item.author ?? []).map((a) => [a.given, a.family].filter(Boolean).join(' '));
  const issued = item.issued?.['date-parts']?.[0] ?? [];
  const year = issued[0];
  const month = String(issued[1] ?? 1).padStart(2, '0');
  const day = String(issued[2] ?? 1).padStart(2, '0');
  const type = item.type === 'proceedings-article' ? 'conference' : 'journal';
  return {
    title: (item.title ?? [''])[0].replace(/\s+/g, ' ').trim(),
    authors,
    venue: (item['container-title'] ?? [''])[0],
    year,
    doi: item.DOI,
    url: item.URL,
    type,
    date: `${year}-${month}-${day}`,
  };
};

await mkdir(OUT, { recursive: true });
const review = ['# 论文元数据核对表', ''];

for (const target of targets) {
  try {
    const item = await lookup(target);
    if (!item) throw new Error('no crossref match');
    const entry = toEntry(item);
    const fm = [
      '---',
      `title: ${JSON.stringify(entry.title)}`,
      'authors:',
      ...entry.authors.map((a) => `  - ${JSON.stringify(a)}`),
      `venue: ${JSON.stringify(entry.venue)}`,
      `year: ${entry.year}`,
      `type: ${entry.type}`,
      'indexing: none',
      'role: other',
      `doi: ${JSON.stringify(entry.doi)}`,
      `url: ${JSON.stringify(entry.url)}`,
      'selected: false',
      `date: ${entry.date}`,
      '---',
      '',
    ].join('\n');
    await writeFile(`${OUT}/${target.key}.md`, fm, 'utf8');
    review.push(
      `## ${target.key}`,
      '',
      `- 标题：${entry.title}`,
      `- 作者：${entry.authors.join(', ')}`,
      `- 出处：${entry.venue} (${entry.year})`,
      `- DOI：${entry.doi}`,
      ''
    );
  } catch (error) {
    review.push(`## ${target.key}`, '', `- 失败：${error.message}`, '');
    console.warn(`[warn] ${target.key}: ${error.message}`);
  }
}

await writeFile(`${OUT}/review.md`, review.join('\n'), 'utf8');
console.log(`written to ${OUT}/`);
