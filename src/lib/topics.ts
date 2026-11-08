export const topicSlugs = ['medical-signal', 'industrial-vision'] as const;

export type TopicSlug = (typeof topicSlugs)[number];

export const topics: {
  slug: TopicSlug;
  name: string;
  nameZh: string;
  blurb: string;
  blurbZh: string;
}[] = [
  {
    slug: 'medical-signal',
    name: 'Medical Signal Processing',
    nameZh: '医学信号处理',
    blurb: 'ECG arrhythmia detection and cardiac risk modelling with multiscale deep networks.',
    blurbZh: '基于多尺度深度网络的心电心律失常检测与心源性风险建模。',
  },
  {
    slug: 'industrial-vision',
    name: 'Industrial Visual Inspection',
    nameZh: '工业视觉检测',
    blurb: 'Defect detection and lightweight deployment for manufacturing and agriculture.',
    blurbZh: '面向制造与农业场景的缺陷检测与轻量化部署。',
  },
];

export function topicName(slug: TopicSlug, lang: 'en' | 'zh' = 'en'): string {
  const topic = topics.find((entry) => entry.slug === slug);
  if (!topic) return slug;
  return lang === 'zh' ? topic.nameZh : topic.name;
}

export function topicBlurb(slug: TopicSlug, lang: 'en' | 'zh' = 'en'): string {
  const topic = topics.find((entry) => entry.slug === slug);
  if (!topic) return '';
  return lang === 'zh' ? topic.blurbZh : topic.blurb;
}
