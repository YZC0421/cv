export const topicSlugs = ['medical-signal', 'industrial-vision'] as const;

export type TopicSlug = (typeof topicSlugs)[number];

export const topics: { slug: TopicSlug; name: string; blurb: string }[] = [
  {
    slug: 'medical-signal',
    name: 'Medical Signal Processing',
    blurb: 'ECG arrhythmia detection and cardiac risk modelling with multiscale deep networks.',
  },
  {
    slug: 'industrial-vision',
    name: 'Industrial Visual Inspection',
    blurb: 'Defect detection and lightweight deployment for manufacturing and agriculture.',
  },
];

export function topicName(slug: TopicSlug): string {
  return topics.find((topic) => topic.slug === slug)?.name ?? slug;
}
