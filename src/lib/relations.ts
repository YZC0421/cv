import type { CollectionEntry } from 'astro:content';
import { findPublication } from './publications';

type Pub = CollectionEntry<'publications'>;
type Work = CollectionEntry<'work'>;

export function validateRelations(publications: Pub[], work: Work[]): string[] {
  const workIds = new Set(work.map((item) => item.id));
  const dois = new Set(publications.map((pub) => pub.data.doi));
  const errors: string[] = [];

  for (const pub of publications) {
    for (const slug of pub.data.relatedWork ?? []) {
      if (!workIds.has(slug)) {
        errors.push(`publications/${pub.id}.md: relatedWork "${slug}" not found`);
      }
    }
  }

  for (const item of work) {
    for (const doi of item.data.relatedPublications ?? []) {
      if (!dois.has(doi)) {
        errors.push(`work/${item.id}.md: relatedPublications "${doi}" not found`);
      }
    }
  }

  return errors;
}

/** Blog notes must point at a publication that exists in the collection. */
export function validateBlogPapers(
  posts: { id: string; data: { paper?: string } }[],
  publications: Pub[]
): string[] {
  const errors: string[] = [];
  for (const post of posts) {
    if (post.data.paper && !findPublication(publications, post.data.paper)) {
      errors.push(`blog/${post.id}.md: paper "${post.data.paper}" not found`);
    }
  }
  return errors;
}
