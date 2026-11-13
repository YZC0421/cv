import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { canonicalPostUrl, postsByLang, visiblePosts } from '../../lib/posts';

export async function GET(context: APIContext) {
  const posts = postsByLang(visiblePosts(await getCollection('blog')), 'zh');

  return rss({
    title: '杨梓聪 · 博客',
    description: '关于 AI、软件工程与研究的技术笔记。',
    site: new URL(`${import.meta.env.BASE_URL}zh/`, context.site!),
    customData: '<language>zh-CN</language>',
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
