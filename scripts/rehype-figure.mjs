function walk(node, visit) {
  if (!node || !Array.isArray(node.children)) return;
  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index];
    if (!child || typeof child !== 'object') continue;
    visit(child, index, node);
    walk(child, visit);
  }
}

/**
 * Wraps Markdown images in `<figure>`, uses the image title as the caption and
 * fails the build when alt text is missing.
 */
export function rehypeFigure() {
  return (tree) => {
    walk(tree, (node, index, parent) => {
      if (node.type !== 'element' || node.tagName !== 'img' || !parent) return;
      if (parent.type === 'element' && parent.tagName === 'figure') return;

      const props = node.properties ?? (node.properties = {});
      const alt = typeof props.alt === 'string' ? props.alt.trim() : '';
      // Marked here so `post:check` and `verify` can fail the pipeline; throwing
      // inside a rehype plugin only makes Astro drop the page content.
      if (!alt) {
        props['data-missing-alt'] = 'true';
        props.alt = '（缺少说明文字）';
      }

      props.loading ??= 'lazy';
      props.decoding ??= 'async';

      const caption = typeof props.title === 'string' ? props.title.trim() : '';
      if (caption) delete props.title;

      const figure = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['post-figure'] },
        children: [node],
      };
      if (caption) {
        figure.children.push({
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: caption }],
        });
      }
      parent.children[index] = figure;
    });
  };
}
