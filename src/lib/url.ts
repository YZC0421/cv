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

/**
 * Rewrites root-relative href/src values to absolute URLs, for feeds where
 * relative links would resolve against the reader's own host.
 */
export function absolutizeHtml(html: string, site: URL | string): string {
  const origin = typeof site === 'string' ? site : site.href;
  return html.replace(/(href|src)="(\/(?!\/)[^"]*)"/g, (_match, attr: string, path: string) => {
    return `${attr}="${new URL(path, origin).href}"`;
  });
}

export function stripBase(pathname: string, base = defaultBase()): string {
  if (pathname === base) return '/';
  if (!pathname.startsWith(`${base}/`)) return pathname;
  const stripped = pathname.slice(base.length);
  return stripped === '' ? '/' : stripped;
}
