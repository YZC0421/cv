import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { canonicalPostUrl, postsByLang, visiblePosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = postsByLang(visiblePosts(await getCollection('blog')), 'en');

  return rss({
    title: 'Zicong Yang · Writing',
    description: 'Notes on software engineering, computer vision, and research.',
    site: new URL(import.meta.env.BASE_URL, context.site!),
    customData: '<language>en</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.summary,
      content: post.body ?? post.data.summary,
      link: canonicalPostUrl(post),
      categories: post.data.tags,
    })),
  });
}
