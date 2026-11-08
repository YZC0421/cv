import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'blog'>;

export const categoryLabels: Record<string, string> = {
  'ai-agent': 'AI Agent',
  'llm-engineering': 'LLM Engineering',
  'ai-application': 'AI Application Development',
  'software-engineering': 'Software Engineering',
  'data-science': 'Data Science',
  'time-series': 'Time Series Forecasting',
  'paper-reading': 'Research & Paper Reading',
  notes: 'Technical Notes',
};

export function categoryLabel(slug: string): string {
  return categoryLabels[slug] ?? slug;
}

export function relatedPosts(posts: Post[], current: Post, limit = 2): Post[] {
  return posts
    .filter((post) => post.id !== current.id)
    .map((post) => ({
      post,
      score: post.data.tags.filter((tag) => current.data.tags.includes(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.post.data.date.localeCompare(a.post.data.date)
    )
    .slice(0, limit)
    .map((entry) => entry.post);
}
