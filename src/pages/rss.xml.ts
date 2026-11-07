import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { visiblePosts } from '../lib/posts';
import { withBase } from '../lib/url';

export async function GET(context: APIContext) {
  const posts = visiblePosts(await getCollection('blog'));

  return rss({
    title: 'Zicong Yang · Writing',
    description: 'Notes on software engineering, computer vision, and research.',
    site: new URL(import.meta.env.BASE_URL, context.site!),
    customData: '<language>zh-CN</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.summary,
      link: withBase(`blog/${post.id}`),
      categories: post.data.tags,
    })),
  });
}
