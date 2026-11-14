import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { feedEntries, jsonFeedBody } from '../lib/feed';
import { postsByLang, visiblePosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const site = context.site!;
  const posts = postsByLang(visiblePosts(await getCollection('blog')), 'en');
  const entries = await feedEntries(posts, site);
  const body = jsonFeedBody(entries, {
    title: 'Zicong Yang · Writing',
    homeUrl: new URL(import.meta.env.BASE_URL, site).href,
    feedUrl: new URL(`${import.meta.env.BASE_URL}feed.json`, site).href,
    language: 'en',
  });

  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
}
