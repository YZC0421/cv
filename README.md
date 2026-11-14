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
npm run new -- --paper 10.1109/...     # scaffold a paper note (DOI or publication id)
npm run new -- --project <slug>        # scaffold a project note
npm run new -- --translate-of <slug>   # scaffold the other-language draft
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
3. Optional: `category` (defaults to `notes`), `cover`, `updated`, `reviewed`, `changelog`,
   `draft`, `translationOf`, `paper`.
4. `draft: true` is visible in `npm run dev` with a banner, and excluded from lists, RSS,
   sitemap and the build output.
5. `paper: <publication id or DOI>` turns the post into a paper note: the post shows the paper
   entry with BibTeX, and the publications list links back to the note. Invalid references
   fail the build.
6. Categories: `ai-agent`, `llm-engineering`, `ai-application`, `software-engineering`,
   `data-science`, `time-series`, `paper-reading`, `notes`.
7. `updated` shows as "updated on"; `changelog: [{date, note}]` renders a collapsed list.
   Posts older than 12 months show a staleness banner until `reviewed` is bumped.
8. Run `npm run post:check && npm run check && npm run build && npm run verify`.

## Add a project

1. Create `src/content/projects/<slug>.md`.
2. Required: `title`, `category`, `summary`.
3. Categories: `ai-agent`, `ai-application`, `enterprise-software`, `data-intelligence`,
   `research`.
4. Optional fields: `status` (`complete` | `ongoing` | `planned`), `period`, `stack`,
   `links`, `cover`, `goal`, `architecture`, `role`, `results`, `private`, `featured`, `order`.
5. Use `todo: []` for missing facts. Never invent metrics, roles, or outcomes.
6. `private: true` lists the project with a Private badge and turns its detail page into a
   password gate; details ship as ciphertext only. See below.

## Private projects

A static site cannot check a password on a server, so private details are encrypted at build
time rather than hidden with CSS.

1. Write the content in `private/<slug>.json` (git-ignored). Keys: `en` and/or `zh`; fields:
   `summary`, `goal`, `architecture`, `role`, `results`, `stack`, `links`, `images`, `body`.
   Images use `"images": [{ "alt": "Architecture", "file": "architecture.png" }]` with the
   files in `private/media/` (png/jpg/webp/gif, ≤2 MB each, ≤6 MB total); they are encrypted
   together with the text.
2. Encrypt it with the access password:
   `PRIVATE_PASSWORD='<password>' npm run private:encrypt -- <slug>`
   Without the variable the script prompts with a silent input.
3. Commit `public/private/<slug>.json` (salt, IV, ciphertext). Never commit `private/`.
4. The detail page fetches the ciphertext and decrypts it in the browser with AES-256-GCM and
   PBKDF2-SHA-256 (600,000 iterations). The password is stored nowhere: if it is lost, the
   content can only be re-encrypted from the plaintext file.
5. Anyone with the password can read the content, and a weak password can be attacked
   offline. Do not put anything here that must survive a determined attacker.

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

## Images

- Put content images in `src/assets/images/` and reference them relatively from Markdown.
- `![alt](../../assets/images/x.png "图 1：说明")` renders a `<figure>` with a caption. `alt`
  is required; missing alt fails `npm run post:check` and `npm run verify` (the page shows a
  placeholder instead of dropping the image).
- In MDX, use `src/components/Figure.astro` directly.
- Markdown images are emitted as responsive WebP with `srcset`, width and height.
- Each post gets its own 1200×630 share image at `dist/og/<slug>.png` during `npm run build`;
  pages without one fall back to `public/og.png`.

## Feeds

- `/rss.xml` and `/zh/rss.xml` carry the rendered HTML, not the Markdown source.
- `/feed.json` and `/zh/feed.json` are JSON Feed 1.1.
- Article links and images inside feeds are rewritten to absolute URLs.

## Search

`npm run build` runs `pagefind --site dist` after the static build. Search UI lives at
`/search` and loads `/pagefind/pagefind-ui.js`; the index is not committed.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml` (test → post:check → check → build
→ verify → Pages). The workflow installs `fonts-noto-cjk` so Chinese share images render on
Ubuntu. Pull requests run the same checks but skip the deploy job.

## TODO

- LinkedIn URL: `src/data/profile.ts`
- Project details for the three planned AI projects: `src/content/projects/*.md`
- Optional profile photo / project covers: `public/images/`
- Confirm location string in `src/data/profile.ts`
