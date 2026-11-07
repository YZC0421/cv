# cv

Personal academic site of Zicong Yang: publications, work, and writing.

Built with Astro 5, statically generated, deployed to GitHub Pages.

## Local

```bash
npm install
npm run dev      # http://localhost:4321/cv/
npm run preview  # preview the built site
npm run check    # type + content schema check
npm test         # unit tests for schema and ordering rules
npm run build    # build to dist/
npm run verify   # assert build output
```

## Add a publication

1. Create `src/content/publications/<slug>.md` with the frontmatter defined in
   `src/lib/schema.ts`.
2. `doi` is required. `selected: true` pins an entry into the home page; the home page always
   shows three entries, filling the remainder with first-author papers, then the newest.
3. Run `npm run check`, `npm run build`, and `npm run verify`.

## Add a post

1. Create `src/content/blog/<slug>.md`; `lang` is `en` or `zh`, `tags` needs at least one
   entry, `summary` at most 160 characters.
2. `draft: true` keeps it out of the list, RSS, and sitemap.
3. Entries dated after the build day are excluded; they appear on the first build after
   that date (a push or a manual workflow run).

## Add a project or experience

1. Create `src/content/work/<slug>.md`; `kind` is `experience` or `project`.
2. `highlights` needs at least one factual bullet; do not add claims without a source.
3. Projects sort by `order`; experiences sort by `start`, newest first.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`. The site is served from
`https://yzc0421.github.io/cv/`. If a custom domain is added, update `site` and `base` in
`astro.config.mjs`, add `public/CNAME`, update `public/robots.txt`, and update the RSS/base
assertion in `scripts/verify-build.mjs`.

## Rollback

Re-run the last successful `Deploy to GitHub Pages` workflow, or `git revert` the offending
content commit. Build configuration changes revert the same way; no manual cleanup on Pages
is required.

## Notes

- No runtime CDN dependencies and no external fonts.
- Content is validated by Zod at build time; invalid frontmatter fails the build.
- Paper metadata was cross-checked against Crossref and confirmed manually.
- All internal links go through `withBase` in `src/lib/url.ts`; do not concatenate
  `import.meta.env.BASE_URL` directly.
