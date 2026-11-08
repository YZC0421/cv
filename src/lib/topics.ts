export const topicSlugs = [
  'medical-signal',
  'industrial-vision',
  'agricultural-environmental-vision',
  'data-intelligence',
] as const;

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
    blurb:
      'Multi-lead ECG arrhythmia detection and cardiac risk modelling with multiscale spatio-temporal networks.',
    blurbZh: '基于多尺度时空网络的多导联心电心律失常检测与心源性风险建模。',
  },
  {
    slug: 'industrial-vision',
    name: 'Industrial Visual Inspection',
    nameZh: '工业视觉检测',
    blurb:
      'Defect detection under limited data, diffusion-based synthesis, and lightweight deployment on production lines.',
    blurbZh: '小样本缺陷检测、扩散模型数据合成与产线端轻量化部署。',
  },
  {
    slug: 'agricultural-environmental-vision',
    name: 'Agricultural & Environmental Vision',
    nameZh: '农业与环境视觉',
    blurb:
      'Crop disease recognition, waste sorting, and surface litter detection with improved YOLO families.',
    blurbZh: '农作物病害识别、垃圾分类与地表废弃物检测，基于改进的 YOLO 系列模型。',
  },
  {
    slug: 'data-intelligence',
    name: 'Applied Data Intelligence',
    nameZh: '应用数据智能',
    blurb:
      'Survey modelling, large-scale review analytics, and forecasting for operational decisions.',
    blurbZh: '问卷建模、大规模评论分析与面向运营决策的预测。',
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
