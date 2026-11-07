const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(path = ''): string {
  if (!path || path === '/') return `${BASE}/`;
  return `${BASE}/${path.replace(/^\//, '')}`;
}

export function stripBase(pathname: string): string {
  const stripped = pathname.slice(BASE.length);
  return stripped === '' ? '/' : stripped;
}
