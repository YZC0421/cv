import type { CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
export type ProjectCategory = Project['data']['category'];

export const projectCategories: { slug: ProjectCategory; label: string }[] = [
  { slug: 'ai-agent', label: 'AI Agent' },
  { slug: 'ai-application', label: 'AI Application' },
  { slug: 'enterprise-software', label: 'Enterprise Software' },
  { slug: 'data-intelligence', label: 'Data Intelligence' },
  { slug: 'research', label: 'Research' },
];

export function categoryLabel(slug: ProjectCategory): string {
  return projectCategories.find((item) => item.slug === slug)?.label ?? slug;
}

export function statusLabel(status: Project['data']['status']): string {
  return status === 'complete' ? 'Completed' : status === 'ongoing' ? 'Ongoing' : 'Planned';
}

export function sortProjects(items: Project[]): Project[] {
  return [...items].sort(
    (a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id)
  );
}

export function featuredProjects(items: Project[], limit = 3): Project[] {
  const featured = sortProjects(items.filter((item) => item.data.featured));
  if (featured.length >= limit) return featured.slice(0, limit);
  const rest = sortProjects(items.filter((item) => !item.data.featured));
  return [...featured, ...rest].slice(0, limit);
}
