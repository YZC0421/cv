import { parseCodeMeta } from '../src/lib/markdown.ts';

function rawMeta(context) {
  const meta = context.options?.meta;
  if (typeof meta === 'string') return meta;
  return meta?.__raw ?? '';
}

/**
 * Adds `data-code-title` to the `<pre>` and marks highlighted lines.
 * Astro passes the raw fenced-code header as `meta`, while Shiki's own
 * integrations usually wrap it as `{ __raw }`; both shapes are accepted.
 */
export function codeMetaTransformer() {
  return {
    name: 'code-meta',
    pre(node) {
      const { title } = parseCodeMeta(rawMeta(this));
      if (!title) return;
      node.properties = node.properties ?? {};
      node.properties['data-code-title'] = title;
    },
    line(node, line) {
      const { highlight } = parseCodeMeta(rawMeta(this));
      if (highlight.some(([from, to]) => line >= from && line <= to)) {
        this.addClassToHast(node, 'highlighted');
      }
    },
  };
}
