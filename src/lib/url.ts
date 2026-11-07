function defaultBase(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

export function withBase(path = '', base = defaultBase()): string {
  const match = path.match(/^([^?#]*)(.*)$/);
  const pathname = match?.[1] ?? '';
  const suffix = match?.[2] ?? '';
  const clean = pathname.replace(/^\/+/, '').replace(/\/+$/, '');

  if (!clean) return `${base}/${suffix}`;

  const isFile = /\.[a-z0-9]+$/i.test(clean);
  return `${base}/${clean}${isFile ? '' : '/'}${suffix}`;
}

export function stripBase(pathname: string, base = defaultBase()): string {
  if (pathname === base) return '/';
  if (!pathname.startsWith(`${base}/`)) return pathname;
  const stripped = pathname.slice(base.length);
  return stripped === '' ? '/' : stripped;
}
