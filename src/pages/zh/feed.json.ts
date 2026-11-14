import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { feedEntries, jsonFeedBody } from '../../lib/feed';
import { postsByLang, visiblePosts } from '../../lib/posts';

export async function GET(context: APIContext) {
  const site = context.site!;
  const posts = postsByLang(visiblePosts(await getCollection('blog')), 'zh');
  const entries = await feedEntries(posts, site);
  const body = jsonFeedBody(entries, {
    title: '杨梓聪 · 博客',
    homeUrl: new URL(`${import.meta.env.BASE_URL}zh/`, site).href,
    feedUrl: new URL(`${import.meta.env.BASE_URL}zh/feed.json`, site).href,
    language: 'zh-CN',
  });

  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
}
