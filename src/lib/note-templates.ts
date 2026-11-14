export type NoteKind = 'paper' | 'project';
export type NoteLang = 'en' | 'zh';

export interface NoteSeed {
  title: string;
  category: string;
  tags: string[];
  summary: string;
  paper?: string;
}

export interface PaperInput {
  id?: string;
  title: string;
  topics?: string[];
  doi?: string;
  url?: string;
}

export interface ProjectInput {
  title: string;
  category: string;
}

const projectCategoryMap: Record<string, string> = {
  'enterprise-software': 'software-engineering',
  'data-intelligence': 'data-science',
  research: 'notes',
};

export function paperNoteSeed(paper: PaperInput, lang: NoteLang): NoteSeed {
  const tags = (paper.topics ?? []).filter((topic) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic));
  return {
    title: lang === 'zh' ? `《${paper.title}》阅读笔记` : `Reading notes: ${paper.title}`,
    category: 'paper-reading',
    tags: tags.length > 0 ? tags.slice(0, 3) : ['paper-reading'],
    summary:
      lang === 'zh'
        ? 'TODO: 这篇论文解决了什么问题（≤160 字）'
        : 'TODO: what problem does this paper solve? (≤160 chars)',
    paper: paper.doi ?? paper.url ?? paper.id,
  };
}

export function projectNoteSeed(project: ProjectInput, lang: NoteLang): NoteSeed {
  return {
    title: lang === 'zh' ? `《${project.title}》项目笔记` : `Project notes: ${project.title}`,
    category: projectCategoryMap[project.category] ?? project.category,
    tags: [project.category],
    summary:
      lang === 'zh'
        ? 'TODO: 这个项目解决了什么问题（≤160 字）'
        : 'TODO: what problem does this project solve? (≤160 chars)',
  };
}

const bodies: Record<NoteKind, Record<NoteLang, string>> = {
  paper: {
    zh: [
      '用一句话说明这篇论文解决了什么问题，以及你为什么读它。',
      '',
      '## 问题',
      '',
      '论文要解决的核心问题、已有方法的不足。',
      '',
      '## 方法',
      '',
      '关键设计，与基线相比的差异。',
      '',
      '## 实验',
      '',
      '数据集、指标、主要结果。只写你核对过的数字。',
      '',
      '## 局限',
      '',
      '作者承认的局限，以及你看出来的问题。',
      '',
      '## 可复现性',
      '',
      '代码、数据、超参数是否可得；还需要补充什么。',
      '',
      '## 引用',
      '',
      '页面底部的 BibTeX 可直接复制。',
      '',
    ].join('\n'),
    en: [
      'One sentence on what this paper solves, and why you read it.',
      '',
      '## Problem',
      '',
      'The core problem and what existing methods miss.',
      '',
      '## Method',
      '',
      'Key design decisions and how they differ from the baselines.',
      '',
      '## Experiments',
      '',
      'Datasets, metrics, main results. Only numbers you verified.',
      '',
      '## Limitations',
      '',
      'What the authors admit, and what you noticed.',
      '',
      '## Reproducibility',
      '',
      'Code, data, hyperparameters; what is still missing.',
      '',
      '## Citation',
      '',
      'Use the BibTeX block at the bottom of this page.',
      '',
    ].join('\n'),
  },
  project: {
    zh: [
      '说明这个项目为什么存在，你负责哪一部分。',
      '',
      '## 背景',
      '',
      '## 目标',
      '',
      '## 架构',
      '',
      '## 关键取舍',
      '',
      '## 结果',
      '',
      '只写可验证的结果，不写没有数据的收益。',
      '',
      '## 复盘',
      '',
      '如果重做一次，会改什么。',
      '',
    ].join('\n'),
    en: [
      'Why this project exists, and which part you owned.',
      '',
      '## Context',
      '',
      '## Goal',
      '',
      '## Architecture',
      '',
      '## Trade-offs',
      '',
      '## Results',
      '',
      'Verified outcomes only. No unmeasured benefits.',
      '',
      '## Retrospective',
      '',
      'What you would change if you did it again.',
      '',
    ].join('\n'),
  },
};

export function noteBody(kind: NoteKind, lang: NoteLang): string {
  return bodies[kind][lang];
}
