import type { CollectionEntry } from 'astro:content';
import { localToday } from './date';
import type { Lang } from '../i18n/ui';

type Post = CollectionEntry<'blog'>;

export interface VisibleOptions {
  /** Drafts stay visible in `astro dev` so a post can be previewed before publishing. */
  includeDrafts?: boolean;
}

function isDevServer(): boolean {
  const env = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env;
  return env?.DEV === true;
}

export function visiblePosts<T extends Post>(
  posts: T[],
  today = localToday(),
  options: VisibleOptions = {}
): T[] {
  const includeDrafts = options.includeDrafts ?? isDevServer();
  return posts
    .filter((post) => (includeDrafts || !post.data.draft) && post.data.date <= today)
    .sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
}

export function postTags<T extends Post>(posts: T[]): string[] {
  return [...new Set(posts.flatMap((post) => post.data.tags))].sort();
}

export function postsByLang<T extends Post>(posts: T[], lang: Lang): T[] {
  return posts.filter((post) => post.data.lang === lang);
}

/** Canonical path for a post: Chinese posts live under /zh/blog, English under /blog. */
export function canonicalPostPath(post: Post): string {
  return post.data.lang === 'zh' ? `zh/blog/${post.id}` : `blog/${post.id}`;
}

function defaultBase(): string {
  const env = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env;
  const base = (env?.BASE_URL ?? '/').replace(/\/$/, '');
  return base === '' ? '' : base;
}

export function canonicalPostUrl(post: Post, base = defaultBase()): string {
  return `${base}/${canonicalPostPath(post)}/`;
}

export function isCanonicalPath(post: Post, pathname: string, base = defaultBase()): boolean {
  const canonical = canonicalPostUrl(post, base).replace(/\/$/, '');
  const path = pathname.replace(/\/$/, '');
  return path === canonical || path === `${canonical}/index.html`;
}

/**
 * Translations are declared on either side (`translationOf`), so lookup checks both
 * the explicit declaration and the inverse one.
 */
export function translationFor<T extends Post>(posts: T[], post: T): T | undefined {
  if (post.data.translationOf) {
    const explicit = posts.find(
      (item) => item.id === post.data.translationOf && item.data.lang !== post.data.lang
    );
    if (explicit) return explicit;
  }
  return posts.find(
    (item) => item.data.translationOf === post.id && item.data.lang !== post.data.lang
  );
}
