import type { CollectionEntry } from 'astro:content';

type Work = CollectionEntry<'work'>;

export function sortProjects<T extends Work>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id)
  );
}

export function sortWork<T extends Work>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => b.data.start.localeCompare(a.data.start) || a.id.localeCompare(b.id)
  );
}

export function sortExperience<T extends Work>(items: T[]): T[] {
  return sortWork(items);
}

export function workTitleMap<T extends Work>(items: T[]): Record<string, string> {
  return Object.fromEntries(items.map((item) => [item.id, item.data.title]));
}
