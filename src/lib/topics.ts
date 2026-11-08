export const areaSlugs = [
  'ai-vision',
  'biomedical-signal',
  'predictive-analytics',
] as const;

export type AreaSlug = (typeof areaSlugs)[number];

export const subtopicSlugs = [
  'agricultural-intelligence',
  'object-detection',
  'industrial-defect',
  'ecg-classification',
  'spatio-temporal-multiscale',
  'predictive-data-driven',
] as const;

export type SubtopicSlug = (typeof subtopicSlugs)[number];

interface Subtopic {
  slug: SubtopicSlug;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
}

interface ResearchArea {
  slug: AreaSlug;
  name: string;
  nameZh: string;
  short: string;
  shortZh: string;
  blurb: string;
  blurbZh: string;
  subtopics: Subtopic[];
}

export const researchAreas: ResearchArea[] = [
  {
    slug: 'ai-vision',
    name: 'Artificial Intelligence and Computer Vision',
    nameZh: '人工智能与计算机视觉',
    short: 'AI & Vision',
    shortZh: 'AI 与视觉',
    blurb:
      'Deep learning, attention, transformers, and feature fusion for agricultural diagnosis, object detection, and industrial inspection.',
    blurbZh: '基于深度学习、注意力机制、Transformer 与特征融合的农业诊断、目标检测与工业检测。',
    subtopics: [
      {
        slug: 'agricultural-intelligence',
        name: 'Agricultural Intelligence and Disease Recognition',
        nameZh: '农业智能化与植物病害识别',
        description:
          'Deep learning, attention, transformers, and feature fusion for crop image recognition and disease diagnosis.',
        descriptionZh: '基于深度学习、注意力机制、Transformer 与特征融合的农业图像识别与植物病害智能诊断。',
      },
      {
        slug: 'object-detection',
        name: 'Object Detection and Visual Recognition',
        nameZh: '目标检测与视觉识别',
        description:
          'YOLO-family models and deep vision architectures for localisation, classification, and recognition in complex backgrounds.',
        descriptionZh: '基于 YOLO 系列模型与深度视觉架构，研究复杂背景下的目标定位、图像分类与智能识别。',
      },
      {
        slug: 'industrial-defect',
        name: 'Industrial Defect Detection and Diffusion Models',
        nameZh: '工业缺陷检测与扩散模型',
        description:
          'Generative AI, diffusion models, deep features, and detection for small defects in industrial settings.',
        descriptionZh: '结合生成式 AI、扩散模型、深度特征与检测技术，研究复杂工业环境中的缺陷识别、小目标检测与特征增强。',
      },
    ],
  },
  {
    slug: 'biomedical-signal',
    name: 'Deep Learning and Biomedical Signal Processing',
    nameZh: '深度学习与生物医学信号处理',
    short: 'Biomedical Signal',
    shortZh: '生物医学信号',
    blurb:
      'Residual, recurrent, and attention-based networks for multi-lead ECG feature extraction, classification, and arrhythmia detection.',
    blurbZh: '利用残差网络、循环网络与注意力机制，对多导联心电信号进行特征提取、分类与心律失常检测。',
    subtopics: [
      {
        slug: 'ecg-classification',
        name: 'ECG Classification and Arrhythmia Detection',
        nameZh: '心电信号分类与心律失常检测',
        description:
          'Deep networks, residual and recurrent architectures, and attention for multi-lead ECG feature extraction and arrhythmia detection.',
        descriptionZh: '利用深度神经网络、残差网络、循环神经网络与注意力机制，对多导联心电信号进行特征提取、分类与心律失常检测。',
      },
      {
        slug: 'spatio-temporal-multiscale',
        name: 'Spatio-Temporal Representation Learning and Multiscale Feature Fusion',
        nameZh: '时空特征表征学习与多尺度特征融合',
        description:
          'Joint modelling of spatio-temporal dependencies with adaptive multiscale extraction and fusion for complex biomedical signals.',
        descriptionZh: '研究深度神经网络对多导联生物医学信号的时空依赖建模，利用自适应多尺度特征提取与融合提升复杂信号识别能力。',
      },
    ],
  },
  {
    slug: 'predictive-analytics',
    name: 'Machine Learning and Predictive Analytics',
    nameZh: '机器学习与智能预测分析',
    short: 'Predictive Analytics',
    shortZh: '预测分析',
    blurb:
      'Predictive modelling and data-driven decision support for business and operational questions.',
    blurbZh: '面向业务与运营问题的预测建模与数据驱动决策支持。',
    subtopics: [
      {
        slug: 'predictive-data-driven',
        name: 'Predictive Modeling and Data-Driven Decision Making',
        nameZh: '预测建模与数据驱动决策',
        description:
          'Machine learning for pattern discovery, predictive modelling, intelligent classification, and decision support.',
        descriptionZh: '利用机器学习算法挖掘数据规律，构建数据驱动的预测模型，实现智能分类、预测分析与辅助决策。',
      },
    ],
  },
];

export function areaName(slug: AreaSlug, lang: 'en' | 'zh' = 'en'): string {
  const area = researchAreas.find((entry) => entry.slug === slug);
  if (!area) return slug;
  return lang === 'zh' ? area.nameZh : area.name;
}

export function areaBlurb(slug: AreaSlug, lang: 'en' | 'zh' = 'en'): string {
  const area = researchAreas.find((entry) => entry.slug === slug);
  if (!area) return '';
  return lang === 'zh' ? area.blurbZh : area.blurb;
}

export function areaShort(slug: AreaSlug, lang: 'en' | 'zh' = 'en'): string {
  const area = researchAreas.find((entry) => entry.slug === slug);
  if (!area) return slug;
  return lang === 'zh' ? area.shortZh : area.short;
}

export function subtopic(slug: SubtopicSlug): Subtopic | undefined {
  for (const area of researchAreas) {
    const found = area.subtopics.find((item) => item.slug === slug);
    if (found) return found;
  }
  return undefined;
}

export function subtopicName(slug: SubtopicSlug, lang: 'en' | 'zh' = 'en'): string {
  const item = subtopic(slug);
  if (!item) return slug;
  return lang === 'zh' ? item.nameZh : item.name;
}

export function subtopicDescription(slug: SubtopicSlug, lang: 'en' | 'zh' = 'en'): string {
  const item = subtopic(slug);
  if (!item) return '';
  return lang === 'zh' ? item.descriptionZh : item.description;
}

export function areaOfSubtopic(slug: SubtopicSlug): AreaSlug | undefined {
  return researchAreas.find((area) =>
    area.subtopics.some((item) => item.slug === slug)
  )?.slug;
}
