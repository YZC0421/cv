const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(path = ''): string {
  const match = path.match(/^([^?#]*)(.*)$/);
  const pathname = match?.[1] ?? '';
  const suffix = match?.[2] ?? '';
  const clean = pathname.replace(/^\/+/, '').replace(/\/+$/, '');

  if (!clean) return `${BASE}/${suffix}`;

  const isFile = /\.[a-z0-9]+$/i.test(clean);
  return `${BASE}/${clean}${isFile ? '' : '/'}${suffix}`;
}

export function stripBase(pathname: string): string {
  if (pathname === BASE) return '/';
  if (!pathname.startsWith(`${BASE}/`)) return pathname;
  const stripped = pathname.slice(BASE.length);
  return stripped === '' ? '/' : stripped;
}
