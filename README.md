# cv

Personal site of Zicong Yang: projects, resume, publications, and technical writing.

Built with Astro 5 (static output), MDX content, and Pagefind search. No runtime CDN, no
external fonts, no client framework.

## Local

```bash
npm install
npm run dev      # http://localhost:4321/cv/
npm run preview  # preview the built site
npm run check    # Astro + TypeScript diagnostics
npm test         # unit tests for schema, ordering, and URL helpers
npm run build    # astro build + pagefind index
npm run verify   # assert build output, including internal links and anchors
npm run new -- "标题" --slug my-post   # scaffold a draft post
npm run post:check                     # validate post frontmatter before publishing
npm run og       # regenerate public/og.png (committed; manual only)
```

## Languages

English lives at the root (`/projects/`), Chinese under `/zh/` (`/zh/projects/`). The switch
in the header keeps you on the same page.

- UI copy: `src/i18n/ui.ts`
- Locale helpers: `src/i18n/utils.ts`
- Profile copy: `profile.zh` in `src/data/profile.ts`
- Project copy: optional `zh:` block in project frontmatter
- Posts: `lang` field; posts are not auto-translated
- Canonical post URL follows `lang`: Chinese posts live at `/zh/blog/<slug>/`, English at
  `/blog/<slug>/`. The other prefix is kept for old links but is `noindex` and canonicalised.
- `translationOf: <slug>` declares a real translation; only then does the language switch and
  `hreflang` point at it. Otherwise the switch reads "暂无英文版" instead of linking.
- RSS is split: `/rss.xml` (English) and `/zh/rss.xml` (Chinese)
- `/about/zh` redirects to `/zh/about`

## Structure

```
src/
  data/profile.ts        # name, headline, links, education, skills, awards
  content/
    projects/*.md        # portfolio entries (category, status, TODO fields)
    blog/*.{md,mdx}      # posts (category, tags, cover, draft)
    work/*.md            # experience timeline
    publications/*.md    # papers (DOI, topics, author note)
  layouts/               # BaseLayout, PageLayout, PostLayout, ResumeLayout
  components/            # Header, Hero, ProjectCard, PublicationItem, Toc, ...
  pages/                 # index, projects, blog, publications, resume, about, contact, search
  styles/global.css      # single stylesheet, tokens, light/dark, print
```

## Add a post

1. Run `npm run new -- "标题" --slug some-slug` (add `--lang en` for English). This writes a
   draft with valid frontmatter.
2. Required: `title`, `date`, `lang` (`en` | `zh`), `summary` (≤160), `tags` (kebab-case).
3. Optional: `category` (defaults to `notes`), `cover`, `updated`, `draft`, `translationOf`,
   `paper`.
4. `draft: true` is visible in `npm run dev` with a banner, and excluded from lists, RSS,
   sitemap and the build output.
5. `paper: <publication id or DOI>` turns the post into a paper note: the post shows the paper
   entry with BibTeX, and the publications list links back to the note. Invalid references
   fail the build.
6. Categories: `ai-agent`, `llm-engineering`, `ai-application`, `software-engineering`,
   `data-science`, `time-series`, `paper-reading`, `notes`.
7. Run `npm run post:check && npm run check && npm run build && npm run verify`.

## Add a project

1. Create `src/content/projects/<slug>.md`.
2. Required: `title`, `category`, `summary`.
3. Categories: `ai-agent`, `ai-application`, `enterprise-software`, `data-intelligence`,
   `research`.
4. Optional fields: `status` (`complete` | `ongoing` | `planned`), `period`, `stack`,
   `links`, `cover`, `goal`, `architecture`, `role`, `results`, `featured`, `order`.
5. Use `todo: []` for missing facts. Never invent metrics, roles, or outcomes.

## Add a publication

1. Create `src/content/publications/<slug>.md`.
2. `doi` and `topics` are required. `relatedWork` slugs must exist in `src/content/work/`.
3. `volume`/`pages` only feed BibTeX.

## Resume

`/resume` renders from `src/data/profile.ts`, the `work` collection, and the `projects`
collection. The print action produces an A4 layout; no separate PDF is generated.

Place an exported PDF at `public/cv.pdf` to additionally show a download link on the About
pages and the home page.

## Math, diagrams, code

- `$inline$` and `$$block$$` render with KaTeX; CSS and fonts are bundled locally.
- A fenced ` ```mermaid ` block renders client-side, importing a local chunk only on posts
  that contain one.
- Code fences accept `title="src/lib/posts.ts"` and highlight ranges like `{2-4,7}`. Blocks
  over 40 lines collapse behind a toggle.

## Search

`npm run build` runs `pagefind --site dist` after the static build. Search UI lives at
`/search` and loads `/pagefind/pagefind-ui.js`; the index is not committed.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml` (test → check → build → verify →
Pages). Pull requests run the same checks but skip the deploy job.

## TODO

- LinkedIn URL: `src/data/profile.ts`
- Project details for the three planned AI projects: `src/content/projects/*.md`
- Optional profile photo / project covers: `public/images/`
- Confirm location string in `src/data/profile.ts`
