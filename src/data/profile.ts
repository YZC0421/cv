export const profile = {
  name: 'Zicong Yang',
  nameZh: '杨梓聪',
  email: '402641915@qq.com',
  links: {
    github: 'https://github.com/YZC0421',
    scholar: 'https://scholar.google.com/citations?user=0Ynn-awAAAAJ',
    orcid: 'https://orcid.org/0009-0001-0948-3606',
    linkedin: 'TODO',
  },
  headline: 'Applied AI · Computer Vision · Biomedical Signal Processing',
  summary:
    'Software engineer and researcher applying deep learning to biomedical signals and computer vision — from multi-lead ECG arrhythmia detection and crop disease or industrial defect recognition to data-driven predictive analytics, extending into LLM and agent tooling.',
  location: 'Zhuhai / Guangzhou, China',
  focus: [
    { name: 'Computer Vision', detail: 'Agricultural diagnosis, object detection, and industrial defect inspection.' },
    { name: 'Biomedical Signals', detail: 'ECG classification, spatio-temporal modelling, and multiscale fusion.' },
    { name: 'Applied Machine Learning', detail: 'Predictive modelling and data-driven decision support.' },
    { name: 'LLM & Agent Tooling', detail: 'Retrieval pipelines and tool-using agent systems.' },
  ],
  education: [
    {
      school: 'Zhuhai College of Science and Technology',
      degree: 'B.E. in Software Engineering',
      period: '2021.09 – 2025.07',
      detail: 'GPA 3.64/4.0, top 1% of the major. National Scholarship, Top 10 Student.',
    },
  ],
  skillGroups: [
    { name: 'AI & Data', items: ['PyTorch', 'Ultralytics YOLO', 'OpenCV', 'ONNX / TensorRT', 'RAG', 'BERT', 'Time-series ML'] },
    { name: 'Engineering', items: ['Python', 'C++', 'Java', 'PyQt5', 'SQLAlchemy / SQLite', 'Spring Boot', 'REST APIs'] },
    { name: 'Tooling', items: ['Git', 'Bash', 'Docker (TODO)', 'Astro', 'TypeScript', 'Claude Code', 'MCP'] },
  ],
  awards: [
    'National Scholarship',
    'Top 10 Student, Zhuhai College of Science and Technology',
    'First-Class Scholarship (three consecutive years)',
    'MCM Meritorious Winner (top 7%)',
    'National Third Prize, CP Group Cup Market Analysis Competition',
    'National Excellent Research Report (CNKI-indexed paper, second author)',
  ],
  zh: {
    headline: '应用 AI · 计算机视觉 · 生物医学信号处理',
    summary:
      '软件工程师与研究者，把深度学习用于生物医学信号与计算机视觉 —— 从多导联 ECG 心律失常检测、作物病害与工业缺陷识别，到数据驱动的预测分析，并延伸到 LLM 与 Agent 工具链。',
    location: '珠海 / 广州，中国',
    focus: [
      { name: '计算机视觉', detail: '农业诊断、目标检测与工业缺陷检测。' },
      { name: '生物医学信号', detail: 'ECG 分类、时空建模与多尺度融合。' },
      { name: '应用机器学习', detail: '预测建模与数据驱动决策支持。' },
      { name: 'LLM 与 Agent 工具链', detail: '检索管线与工具调用型 Agent 系统。' },
    ],
    education: [
      {
        school: '珠海科技学院',
        degree: '软件工程 本科',
        period: '2021.09 – 2025.07',
        detail: 'GPA 3.64/4.0，专业前 1%。国家奖学金、十佳大学生。',
      },
    ],
    skillGroups: [
      { name: 'AI 与数据', items: ['PyTorch', 'Ultralytics YOLO', 'OpenCV', 'ONNX / TensorRT', 'RAG', 'BERT', '时序建模'] },
      { name: '工程', items: ['Python', 'C++', 'Java', 'PyQt5', 'SQLAlchemy / SQLite', 'Spring Boot', 'REST API'] },
      { name: '工具', items: ['Git', 'Bash', 'Docker（待确认）', 'Astro', 'TypeScript', 'Claude Code', 'MCP'] },
    ],
    awards: [
      '国家奖学金',
      '珠海科技学院十佳大学生',
      '连续三年一等奖学金',
      '美国大学生数学建模竞赛 M 奖（国际前 7%）',
      '正大杯市场调研大赛全国三等奖',
      '国家级优秀调研报告（二作论文，知网检索）',
    ],
  },
  // TODO: 补充 LinkedIn、个人照片、所在城市确认，以及 AI 方向项目的真实细节。
} as const;
