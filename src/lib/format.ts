export function readingMinutes(body: string): number {
  const cjk = body.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const latin = body.match(/[A-Za-z0-9]+/g)?.length ?? 0;
  return Math.max(1, Math.ceil(cjk / 400 + latin / 200));
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function boldSelf(authors: string[], self = 'Zicong Yang'): string {
  return authors
    .map((name) => {
      const safe = escapeHtml(name);
      return name.trim() === self ? `<strong>${safe}</strong>` : safe;
    })
    .join(', ');
}

export function toBibtex(input: {
  title: string;
  authors: string[];
  venue: string;
  year: number;
  doi: string;
  type: 'journal' | 'conference';
  volume?: string;
  pages?: string;
}): string {
  const surname = input.authors[0]?.split(' ').pop() ?? 'anon';
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 8);
  const key = `${surname}${input.year}${slug}`;
  const kind = input.type === 'journal' ? 'article' : 'inproceedings';
  const venueField = input.type === 'journal' ? 'journal' : 'booktitle';
  const lines = [
    `@${kind}{${key},`,
    `  author = {${input.authors.join(' and ')}},`,
    `  title = {${input.title}},`,
    `  ${venueField} = {${input.venue}},`,
    `  year = {${input.year}},`,
    ...(input.volume ? [`  volume = {${input.volume}},`] : []),
    ...(input.pages ? [`  pages = {${input.pages}},`] : []),
    `  doi = {${input.doi}}`,
    '}',
  ];
  return lines.join('\n');
}
