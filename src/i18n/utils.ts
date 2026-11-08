import type { Lang } from './ui';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function stripBase(pathname: string): string {
  if (pathname === BASE) return '/';
  if (!pathname.startsWith(`${BASE}/`)) return pathname;
  return pathname.slice(BASE.length) || '/';
}

export function isZhPath(pathname: string): boolean {
  const path = stripBase(pathname);
  return path === '/zh' || path.startsWith('/zh/');
}

export function langFromPath(pathname: string): Lang {
  return isZhPath(pathname) ? 'zh' : 'en';
}

/** Path without base and without language prefix, always leading slash. */
export function contentPath(pathname: string): string {
  let path = stripBase(pathname);
  if (path === '/zh') return '/';
  if (path.startsWith('/zh/')) path = path.slice(3);
  return path.startsWith('/') ? path : `/${path}`;
}

/** Build a URL with base + language prefix. `path` is content-relative, e.g. "projects/". */
export function localeUrl(path: string, lang: Lang): string {
  const clean = path.replace(/^\/+/, '');
  const prefixed = lang === 'zh' ? (clean ? `zh/${clean}` : 'zh/') : clean;
  return `${BASE}/${prefixed}`;
}

/** URL of the same page in the other language, preserving the path. */
export function alternateUrl(pathname: string, lang: Lang): string {
  const path = contentPath(pathname);
  return localeUrl(path.replace(/^\//, ''), lang);
}

/** Absolute URL for hreflang/canonical. */
export function absoluteUrl(site: URL | undefined, path: string): URL {
  return new URL(path, site);
}
