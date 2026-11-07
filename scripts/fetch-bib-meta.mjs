const targets = [
  { file: 'scientific-reports-2024', doi: '10.1038/s41598-024-71700-z' },
  { file: 'cisse-2024', doi: '10.1007/978-3-031-57037-7_7' },
  { file: 'mst-2025', doi: '10.1088/1361-6501/ae10d3' },
  { file: 'cvidl-2024-wheat', doi: '10.1109/cvidl62147.2024.10604082' },
  { file: 'cvidl-2024-garbage', doi: '10.1109/cvidl62147.2024.10604280' },
  { file: 'ipmlp-2024', doi: '10.1145/3700906.3700946' },
];

for (const target of targets) {
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(target.doi)}`, {
      headers: { 'User-Agent': 'cv-site-build/1.0 (mailto:402641915@qq.com)' },
    });
    if (!res.ok) {
      console.log(`${target.file}: fetch failed (${res.status})`);
      continue;
    }
    const { message } = await res.json();
    console.log(`${target.file}: volume=${message.volume ?? ''} pages=${message.page ?? ''}`);
  } catch (error) {
    console.log(`${target.file}: ${error.message}`);
  }
}
