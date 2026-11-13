import type { CollectionEntry } from 'astro:content';
import { toBibtex } from './format';

type Pub = CollectionEntry<'publications'>;

export function publicationBibtex(pub: Pub): string {
  const data = pub.data;
  return toBibtex({
    title: data.title,
    authors: data.authors,
    venue: data.venue,
    year: data.year,
    doi: data.doi,
    type: data.type,
    volume: data.volume,
    issue: data.issue,
    pages: data.pages,
    articleNumber: data.articleNumber,
  });
}

const roleRank: Record<string, number> = { first: 0, second: 1, third: 2, other: 3 };

const dateOf = (pub: Pub) => pub.data.date ?? `${pub.data.year}-01-01`;

export function sortPublications<T extends Pub>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const byDate = dateOf(b).localeCompare(dateOf(a));
    if (byDate !== 0) return byDate;
    const byRole = (roleRank[a.data.role] ?? 3) - (roleRank[b.data.role] ?? 3);
    if (byRole !== 0) return byRole;
    return a.id.localeCompare(b.id);
  });
}

/** Accepts a publication id, a bare DOI, or a https://doi.org/ URL. */
export function findPublication<T extends Pub>(items: T[], ref: string): T | undefined {
  return items.find(
    (pub) =>
      pub.id === ref ||
      pub.data.doi === ref ||
      (pub.data.doi ? `https://doi.org/${pub.data.doi}` === ref : false)
  );
}

export function notesByPublication<T extends Pub, P extends { id: string; data: { paper?: string } }>(
  posts: P[],
  publications: T[]
): Map<string, P[]> {
  const map = new Map<string, P[]>();
  for (const post of posts) {
    if (!post.data.paper) continue;
    const pub = findPublication(publications, post.data.paper);
    if (!pub) continue;
    map.set(pub.id, [...(map.get(pub.id) ?? []), post]);
  }
  return map;
}

export function sortPaperReading<T extends { data: { paper?: string; date: string } }>(
  posts: T[],
  publications: Pub[]
): T[] {
  return [...posts].sort((a, b) => {
    const yearA = findPublication(publications, a.data.paper ?? '')?.data.year ?? 0;
    const yearB = findPublication(publications, b.data.paper ?? '')?.data.year ?? 0;
    return yearB - yearA || b.data.date.localeCompare(a.data.date);
  });
}

const quartileRank: Record<string, number> = { Q1: 0, Q2: 1, Q3: 2, Q4: 3 };

export function selectHomepage<T extends Pub>(items: T[], limit?: number): T[] {
  const jcr = items
    .filter((pub) => pub.data.indexing in quartileRank)
    .sort((a, b) => {
      const byQuartile =
        (quartileRank[a.data.indexing] ?? 9) - (quartileRank[b.data.indexing] ?? 9);
      if (byQuartile !== 0) return byQuartile;
      const byRole = (roleRank[a.data.role] ?? 3) - (roleRank[b.data.role] ?? 3);
      if (byRole !== 0) return byRole;
      return dateOf(b).localeCompare(dateOf(a));
    });

  const firstAuthorEI = sortPublications(
    items.filter((pub) => pub.data.indexing === 'EI' && pub.data.role === 'first')
  );

  const all = [...jcr, ...firstAuthorEI];
  return limit ? all.slice(0, limit) : all;
}
