import type { CollectionEntry } from 'astro:content';

type Pub = CollectionEntry<'publications'>;

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
