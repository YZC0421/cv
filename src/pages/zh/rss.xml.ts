import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { feedEntries } from '../../lib/feed';
import { postsByLang, visiblePosts } from '../../lib/posts';

export async function GET(context: APIContext) {
  const posts = postsByLang(visiblePosts(await getCollection('blog')), 'zh');
  const entries = await feedEntries(posts, context.site!);

  return rss({
    title: '杨梓聪 · 博客',
    description: '关于 AI、软件工程与研究的技术笔记。',
    site: new URL(`${import.meta.env.BASE_URL}zh/`, context.site!),
    customData: '<language>zh-CN</language>',
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
