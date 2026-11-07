---
title: "从一份 55KB 的单页简历到 Astro 站点"
date: "2026-11-07"
lang: "zh"
tags: ["astro", "typescript", "static-site"]
summary: "记录把单文件双语简历迁移为内容驱动的静态站的过程与取舍。"
draft: false
---

这份站点此前是一个 786 行的 `index.html`，加上一份内容完全相同的 `CV.html`。中英双语靠两组
`span` 加运行时 JS 切换，样式来自 Tailwind CDN 与 FontAwesome CDN。

## 问题不在样式

真正的成本在内容维护：每加一篇论文，要同时改英文段与中文段；每换一次措辞，要找两处。
搜索引擎只能看到一份混排文本，分享链接也无法指定语言。

## 迁移到 Astro

论文、项目、文章被拆成独立的 Markdown 文件，frontmatter 由 Zod 校验。构建期完成排序、
首页精选、RSS 与 sitemap，运行期只保留三段原生 JS：主题切换、列表筛选、BibTeX 复制。

## 构建与校验

每次提交前跑同一组命令：

```bash
npm test
npm run check
npm run build
```

## 得到什么

- 新增一篇论文只需新增一个文件。
- 构建产物零 CDN 依赖，断网也能正常显示。
- About 的中英页面各自拥有稳定 URL，canonical 与 `hreflang` 正确。
- 下一步会给 About 页补打印样式，届时可直接输出 PDF。

## 没做什么

没有加评论、站内搜索和访问统计。论文只有六条、文章不足十篇时，这些能力带来的维护
成本高于收益。

## 一个容易踩的坑

第一版页面构建出来后，导航链接全部变成了 `/cvpublications` 这样的坏路径。原因是用
`${base}publications` 直接拼接，而 `base` 的取值末尾没有斜杠。所有站内路径现在都经过
`src/lib/url.ts` 的 `withBase`，由它统一补斜杠并保留文件扩展名。[^1]

[^1]: 这个问题在本地 `npm run dev` 下同样存在，因为 `BASE_URL` 与构建时的取值一致。
