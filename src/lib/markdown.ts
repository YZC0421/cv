export interface CodeMeta {
  title?: string;
  highlight: Array<[number, number]>;
}

/**
 * Reads the fenced-code header, e.g. `title="src/lib/posts.ts" {2-4,7}`.
 * Malformed ranges are ignored instead of throwing at build time.
 */
export function parseCodeMeta(meta: string): CodeMeta {
  const title = meta.match(/title="([^"]+)"/)?.[1];
  const ranges = meta.match(/\{([^}]+)\}/)?.[1];
  const highlight: Array<[number, number]> = [];

  for (const part of ranges?.split(',') ?? []) {
    const [startRaw, endRaw] = part.trim().split('-');
    const start = Number.parseInt(startRaw ?? '', 10);
    if (Number.isNaN(start)) continue;
    const end = endRaw === undefined ? start : Number.parseInt(endRaw, 10);
    highlight.push([start, Number.isNaN(end) ? start : end]);
  }

  return { title, highlight };
}

export function hasMermaid(body: string): boolean {
  return /(^|\n)```mermaid(\s|$)/.test(body);
}
