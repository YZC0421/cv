export const profile = {
  name: 'Zicong Yang',
  nameZh: '杨梓聪',
  headline: 'AI Engineering · Agent Development · Software Engineering · Data Intelligence',
  summary:
    'Software engineer and researcher working across applied AI, data intelligence, and production systems — from ECG signal models and industrial vision to LLM-backed tooling.',
  location: 'Zhuhai / Guangzhou, China',
  email: '402641915@qq.com',
  links: {
    github: 'https://github.com/YZC0421',
    scholar: 'https://scholar.google.com/citations?user=0Ynn-awAAAAJ',
    orcid: 'https://orcid.org/0009-0001-0948-3606',
    linkedin: 'TODO',
  },
  focus: [
    {
      name: 'AI Agents',
      detail: 'Agent runtime, tool management, and reliability of tool-using systems.',
    },
    {
      name: 'LLM Engineering',
      detail: 'RAG pipelines, retrieval quality, and LLM-backed report generation.',
    },
    {
      name: 'Applied Machine Learning',
      detail: 'ECG signal models, defect detection, and lightweight deployment.',
    },
    {
      name: 'Data Intelligence',
      detail: 'Large-scale review mining, forecasting, and decision support.',
    },
  ],
  education: [
    {
      school: 'Zhuhai College of Science and Technology',
      schoolZh: '珠海科技学院',
      degree: 'B.E. in Software Engineering',
      period: '2021.09 – 2025.07',
      detail: 'GPA 3.64/4.0, top 1% of the major. National Scholarship, Top 10 Student.',
    },
  ],
  skillGroups: [
    {
      name: 'AI & Data',
      items: ['PyTorch', 'Ultralytics YOLO', 'OpenCV', 'ONNX / TensorRT', 'RAG', 'BERT', 'Time-series ML'],
    },
    {
      name: 'Engineering',
      items: ['Python', 'C++', 'Java', 'PyQt5', 'SQLAlchemy / SQLite', 'Spring Boot', 'REST APIs'],
    },
    {
      name: 'Tooling',
      items: ['Git', 'Bash', 'Docker (TODO)', 'Astro', 'TypeScript', 'Claude Code', 'MCP'],
    },
  ],
  awards: [
    'National Scholarship',
    'Top 10 Student, Zhuhai College of Science and Technology',
    'First-Class Scholarship (three consecutive years)',
    'MCM Meritorious Winner (top 7%)',
    'National Third Prize, CP Group Cup Market Analysis Competition',
    'National Excellent Research Report (CNKI-indexed paper, second author)',
  ],
  // TODO: 补充 LinkedIn、个人照片、所在城市确认，以及 AI 方向项目的真实细节。
} as const;
