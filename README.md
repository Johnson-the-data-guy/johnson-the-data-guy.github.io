# Engineering logbook

A dated public record of design decisions, tools used on real problems, and
incident post-mortems. Built with Astro as a fully static site: HTML, one
stylesheet, self-hosted fonts, and no client-side JavaScript.

## Running it

Requires Node 22.12 or later.

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check, then build to dist/
npm run preview   # serve dist/ locally
```

`npm run dev` shows drafts, marked "Draft", so you can read them in place.
The build leaves them out entirely (see [Drafts](#drafts)).

## Adding a post

Create a Markdown file in `src/content/posts/`. The filename becomes the URL:
`src/content/posts/terraform-state-split.md` is published at
`/posts/terraform-state-split/`.

```md
---
title: Splitting one Terraform state into five
description: One sentence, shown under the title in the list, in RSS and in search results.
date: 2026-09-17
tags: [terraform, aws]
project: deploy-pipeline   # optional; a project's slug
kind: design               # design | tool | incident | correction | completion
draft: true                # optional; defaults to false
---

The entry, in Markdown.
```

- `kind` sets the mark beside the entry in the list and the rule under its
  title. Design, tool and incident each have their own colour. Correction
  uses the muted colour and completion uses the ink colour.
- `project` must match the `slug` of a project, or the build fails.
- Frontmatter is validated strictly. A missing field, a wrong type or an
  unknown key (`drafts:` for `draft:`) fails the build with the file named.
- Fenced code blocks are two-tone: comments in the muted colour, everything
  else in ink. Comments are found at build time for the language named on
  the fence (`sh`, `yaml`, `hcl`, `dockerfile`, `ts`, `go`, `sql` and
  others; the full list is in `src/lib/code-comments.ts`). Detection
  skips quoted strings but not heredocs. Use `text` for error output.

To publish, set `draft: false` or delete the line.

## Adding a project

Create a YAML file in `src/content/projects/`. The `slug` field sets the URL,
`/projects/<slug>/`.

```yaml
title: Deploy pipeline
slug: deploy-pipeline
company: Example Co
summary: >-
  One or two sentences on what the project is and why it exists.
stack:
  - GitHub Actions
  - Argo CD
repo: https://github.com/your-handle/deploy-pipeline
diagram: /diagrams/deploy-pipeline.svg   # optional
order: 1                                 # position on /projects/, lowest first
status: in-progress                      # in-progress | complete
draft: false                             # optional; defaults to false
```

A project page shows the summary, stack, repository link and diagram, then
every published post whose `project` matches its slug, newest first.

### Diagrams

Export the diagram as SVG and commit it to `public/diagrams/`. It is read at
build time and inlined into the page, not loaded with `<img>`, so:

- Draw strokes and text in `currentColor` and the diagram follows the light
  and dark palettes. Hard-coded colours stay as exported.
- Text without a `font-family` uses the site's sans-serif.
- The SVG renders at its own `width` and scales down on narrow screens.
  Something around 320px wide stays legible on a phone.
- Give it a `<title>`, or it gets an accessible name from the project title.

A `diagram` path pointing at a missing file fails the build.

## Drafts

Posts and projects marked `draft: true` exist only in `npm run dev`, where
they are listed and rendered with a "Draft" note. `npm run build` leaves
them out entirely: no page at their URL, no row in any list, no RSS item,
no sitemap entry. A draft can only be read locally.

A published post can name a draft project. The slug is still checked, but
the post only links to the project once the project is published.

All of this is controlled by `SHOW_DRAFTS` in `src/lib/content.ts`.

The seed posts and projects are drafts with placeholder content. Delete them
before publishing: the two posts, two project files and
`public/diagrams/deploy-pipeline.svg`.

## Deploy settings

The site is a GitHub user site, served at the root of
`https://johnson-the-data-guy.github.io`.

- `astro.config.mjs`: `site` holds that URL, with no `base`. Canonical URLs,
  Open Graph URLs, RSS and the sitemap are built from it.
- `src/site.ts`: name, identity line, description and GitHub profile link.
- `src/pages/about.md`: replace the bracketed placeholder.

## What `npm run build` produces

`npm run build` runs `astro check` (TypeScript and content schemas) and then
`astro build`. Any error stops it. The output in `dist/` is plain static
files, ready for any static host:

```text
dist/
├── index.html                      entry list
├── posts/<slug>/index.html         one per published post
├── projects/index.html             project list
├── projects/<slug>/index.html      one per published project
├── about/index.html
├── 404.html
├── rss.xml                         published posts, newest first
├── sitemap.xml                     published pages only
├── robots.txt                      points at the sitemap
├── _astro/
│   ├── <name>.<hash>.css           the one stylesheet
│   └── fonts/<hash>.woff2          Newsreader (upright, italic), Archivo
├── favicon.svg
└── diagrams/                       copied from public/
```

There are no `.js` files in the output. The build downloads the fonts from
Google Fonts, so it needs network access; readers' browsers never contact
Google.

## Layout of the source

```text
src/
├── content.config.ts     collection schemas
├── content/posts/        entries (Markdown)
├── content/projects/     projects (YAML)
├── site.ts               name, identity line, description, GitHub link
├── lib/content.ts        queries, sorting, labels, date formatting
├── lib/diagram.ts        reads and inlines diagram SVGs
├── lib/code-comments.ts  marks comments in code blocks
├── layouts/Base.astro    <head> metadata, header, footer
├── layouts/Page.astro    layout for Markdown pages (about.md)
├── components/EntryList.astro
├── pages/                one file per route
└── styles/global.css     all styles; design tokens at the top
```
