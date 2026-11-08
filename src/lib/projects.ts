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

const categoryLabelsZh: Record<ProjectCategory, string> = {
  'ai-agent': 'AI Agent',
  'ai-application': 'AI 应用',
  'enterprise-software': '企业软件',
  'data-intelligence': '数据智能',
  research: '研究项目',
};

export function categoryLabel(slug: ProjectCategory, lang: 'en' | 'zh' = 'en'): string {
  if (lang === 'zh') return categoryLabelsZh[slug] ?? slug;
  return projectCategories.find((item) => item.slug === slug)?.label ?? slug;
}

export function statusLabel(
  status: Project['data']['status'],
  lang: 'en' | 'zh' = 'en'
): string {
  if (lang === 'zh') {
    return status === 'complete' ? '已完成' : status === 'ongoing' ? '进行中' : '计划中';
  }
  return status === 'complete' ? 'Completed' : status === 'ongoing' ? 'Ongoing' : 'Planned';
}

export function localizedProject(item: Project, lang: 'en' | 'zh') {
  const data = item.data;
  if (lang !== 'zh' || !data.zh) return data;
  return {
    ...data,
    ...Object.fromEntries(
      Object.entries(data.zh).filter(([, value]) => value !== undefined)
    ),
  } as typeof data;
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
