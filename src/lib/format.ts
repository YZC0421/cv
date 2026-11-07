export function boldSelf(authors: string[], self = 'Zicong Yang'): string {
  return authors
    .map((name) => (name.trim() === self ? `<strong>${name}</strong>` : name))
    .join(', ');
}

export function toBibtex(input: {
  title: string;
  authors: string[];
  venue: string;
  year: number;
  doi: string;
  type: 'journal' | 'conference';
}): string {
  const surname = input.authors[0]?.split(' ').pop() ?? 'anon';
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 8);
  const key = `${surname}${input.year}${slug}`;
  const kind = input.type === 'journal' ? 'article' : 'inproceedings';
  const venueField = input.type === 'journal' ? 'journal' : 'booktitle';
  return `@${kind}{${key},
  author = {${input.authors.join(' and ')}},
  title = {${input.title}},
  ${venueField} = {${input.venue}},
  year = {${input.year}},
  doi = {${input.doi}}
}`;
}
