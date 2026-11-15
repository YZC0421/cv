export const backendSections = [
  { slug: '01-computer-fundamentals', index: '01', title: '计算机基础', titleEn: 'Computer Fundamentals' },
  { slug: '02-languages-runtimes', index: '02', title: '编程语言与运行时', titleEn: 'Languages & Runtimes' },
  { slug: '03-networking', index: '03', title: '计算机网络与通信', titleEn: 'Networking' },
  { slug: '04-web-backend', index: '04', title: 'Web 后端基础', titleEn: 'Web Backend Basics' },
  { slug: '05-frameworks', index: '05', title: '后端框架与工程开发', titleEn: 'Frameworks & Engineering' },
  { slug: '06-databases', index: '06', title: '数据库与数据存储', titleEn: 'Databases & Storage' },
  { slug: '07-caching', index: '07', title: '缓存技术', titleEn: 'Caching' },
  { slug: '08-authentication', index: '08', title: '身份认证与权限管理', titleEn: 'Authentication & Authorization' },
  { slug: '09-concurrency', index: '09', title: '并发编程与异步处理', titleEn: 'Concurrency & Async' },
  { slug: '10-messaging', index: '10', title: '消息队列与事件驱动', titleEn: 'Messaging & Events' },
  { slug: '11-distributed-systems', index: '11', title: '分布式系统与微服务', titleEn: 'Distributed Systems' },
  { slug: '12-architecture-patterns', index: '12', title: '后端架构与设计模式', titleEn: 'Architecture & Patterns' },
  { slug: '13-security', index: '13', title: '系统安全', titleEn: 'Security' },
  { slug: '14-performance', index: '14', title: '性能优化与系统稳定性', titleEn: 'Performance & Reliability' },
  { slug: '15-testing-deployment', index: '15', title: '测试与工程化部署', titleEn: 'Testing & Deployment' },
  { slug: '16-observability', index: '16', title: '监控与可观测性', titleEn: 'Monitoring & Observability' },
] as const;

export type BackendSection = (typeof backendSections)[number];
export type BackendSectionSlug = BackendSection['slug'];

export const backendSectionSlugs = backendSections.map((section) => section.slug) as [
  BackendSectionSlug,
  ...BackendSectionSlug[],
];

export function findBackendSection(slug: string): BackendSection | undefined {
  return backendSections.find((section) => section.slug === slug);
}

export function backendSectionTitle(slug: string, lang: 'zh' | 'en' = 'zh'): string {
  const section = findBackendSection(slug);
  if (!section) return slug;
  return lang === 'zh' ? section.title : section.titleEn;
}
