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

export function selectHomepage<T extends Pub>(items: T[], limit = 3): T[] {
  const chosen: T[] = [];
  const take = (list: T[]) => {
    for (const item of list) {
      if (chosen.length >= limit) break;
      if (!chosen.some((c) => c.id === item.id)) chosen.push(item);
    }
  };
  const sorted = sortPublications(items);
  take(sorted.filter((p) => p.data.selected));
  take(sorted.filter((p) => p.data.role === 'first'));
  take(sorted);
  return chosen.slice(0, limit);
}
