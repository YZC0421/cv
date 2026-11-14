import type { CollectionEntry } from 'astro:content';
import { render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { canonicalPostUrl } from './posts';
import { absolutizeHtml } from './url';

type Post = CollectionEntry<'blog'>;

export interface JsonFeedOptions {
  title: string;
  homeUrl: string;
  feedUrl: string;
  language: string;
}

export interface FeedEntry {
  title: string;
  summary: string;
  contentHtml: string;
  link: string;
  date: string;
  tags: string[];
}

/**
 * Renders posts through the same Markdown pipeline as the site, then makes
 * root-relative links absolute so feed readers do not resolve them locally.
 */
export async function feedEntries(posts: Post[], site: URL): Promise<FeedEntry[]> {
  const container = await AstroContainer.create();

  return Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post);
      const html = await container.renderToString(Content);
      return {
        title: post.data.title,
        summary: post.data.summary,
        contentHtml: absolutizeHtml(html, site),
        link: canonicalPostUrl(post),
        date: post.data.date,
        tags: post.data.tags,
      };
    })
  );
}

export function jsonFeedBody(entries: FeedEntry[], options: JsonFeedOptions) {
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: options.title,
    home_page_url: options.homeUrl,
    feed_url: options.feedUrl,
    language: options.language,
    items: entries.map((entry) => ({
      id: entry.link,
      url: new URL(entry.link, options.homeUrl).href,
      title: entry.title,
      summary: entry.summary,
      content_html: entry.contentHtml,
      date_published: new Date(`${entry.date}T00:00:00Z`).toISOString(),
      tags: entry.tags,
    })),
  };
}
