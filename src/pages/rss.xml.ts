import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { feedEntries } from '../lib/feed';
import { postsByLang, visiblePosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = postsByLang(visiblePosts(await getCollection('blog')), 'en');
  const entries = await feedEntries(posts, context.site!);

  return rss({
    title: 'Zicong Yang · Writing',
    description: 'Notes on software engineering, computer vision, and research.',
    site: new URL(import.meta.env.BASE_URL, context.site!),
    customData: '<language>en</language>',
    items: entries.map((entry) => ({
      title: entry.title,
      pubDate: new Date(entry.date),
      description: entry.summary,
      content: entry.contentHtml,
      link: entry.link,
      categories: entry.tags,
    })),
  });
}
