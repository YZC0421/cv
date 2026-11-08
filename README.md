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
npm run verify   # assert build output
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

1. Create `src/content/blog/<slug>.md` or `.mdx`.
2. Required: `title`, `date`, `lang` (`en` | `zh`), `summary` (≤160), `tags` (kebab-case).
3. Optional: `category` (defaults to `notes`), `cover`, `updated`, `draft`.
4. Categories: `ai-agent`, `llm-engineering`, `ai-application`, `software-engineering`,
   `data-science`, `time-series`, `paper-reading`, `notes`.
5. Run `npm run check && npm run build && npm run verify`.

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
