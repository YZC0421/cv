import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { localToday } from '../lib/date';
import { withBase } from '../lib/url';

export async function GET(context: APIContext) {
  const today = localToday();
  const posts = (await getCollection('blog'))
    .filter((post) => !post.data.draft && post.data.date <= today)
    .sort((a, b) => b.data.date.localeCompare(a.data.date));

  return rss({
    title: 'Zicong Yang · Writing',
    description: 'Notes on software engineering, computer vision, and research.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.summary,
      link: withBase(`blog/${post.id}`),
    })),
  });
}
