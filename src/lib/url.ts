const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(path = ''): string {
  const clean = path.replace(/^\//, '');
  if (!clean) return `${BASE}/`;
  const isFile = /\.[a-z0-9]+$/i.test(clean);
  return `${BASE}/${clean}${isFile ? '' : '/'}`;
}

export function stripBase(pathname: string): string {
  if (!pathname.startsWith(BASE)) return pathname;
  const stripped = pathname.slice(BASE.length);
  return stripped === '' ? '/' : stripped;
}
