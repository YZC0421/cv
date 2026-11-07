import type { CollectionEntry } from 'astro:content';
import { localToday } from './date';

type Post = CollectionEntry<'blog'>;

export function visiblePosts<T extends Post>(posts: T[], today = localToday()): T[] {
  return posts
    .filter((post) => !post.data.draft && post.data.date <= today)
    .sort((a, b) => b.data.date.localeCompare(a.data.date));
}
