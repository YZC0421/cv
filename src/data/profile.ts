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
  headline: 'AI Engineering · Agent Development · Software Engineering · Data Intelligence',
  summary:
    'Software engineer and researcher working across applied AI, data intelligence, and production systems — from ECG signal models and industrial vision to LLM-backed tooling.',
  location: 'Zhuhai / Guangzhou, China',
  focus: [
    { name: 'AI Agents', detail: 'Agent runtime, tool management, and reliability of tool-using systems.' },
    { name: 'LLM Engineering', detail: 'RAG pipelines, retrieval quality, and LLM-backed report generation.' },
    { name: 'Applied Machine Learning', detail: 'ECG signal models, defect detection, and lightweight deployment.' },
    { name: 'Data Intelligence', detail: 'Large-scale review mining, forecasting, and decision support.' },
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
    headline: 'AI 工程 · Agent 开发 · 软件工程 · 数据智能',
    summary:
      '软件工程师与研究者，关注应用 AI、数据智能与生产系统 —— 从 ECG 信号模型、工业视觉，到基于 LLM 的工具链。',
    location: '珠海 / 广州，中国',
    focus: [
      { name: 'AI Agent', detail: 'Agent 运行时、工具管理与工具调用系统的可靠性。' },
      { name: 'LLM 工程', detail: 'RAG 管线、检索质量与基于 LLM 的报告生成。' },
      { name: '应用机器学习', detail: 'ECG 信号模型、缺陷检测与轻量化部署。' },
      { name: '数据智能', detail: '大规模评论挖掘、预测与决策支持。' },
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
