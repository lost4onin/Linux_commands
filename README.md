# Linux / Unix Commands Cheat Sheet

A fast, static website built from one Markdown file, [`cheatsheet.md`](cheatsheet.md):
the Unix/Linux cheat sheet for the Operating Systems exam.

- English and French versions, with a **Français / English** button on every page
  (French pages live under `/fr/`, from [`cheatsheet.fr.md`](cheatsheet.fr.md))
- One page per `##` section (`/files/`, `/processes/`, …) plus a home page with cards
- Section 12, **EXAM 2017-2018 recreated**: the Operating Systems exam paper retyped
  (questions only), in French and English
- A tab strip at the top to move between sections, plus previous/next links
- Instant search over every command (press `/` or `Ctrl K`)
- Copy buttons on commands and code blocks
- Light/dark theme (follows the system until you pick one)
- Phone-friendly tables: horizontal scroll, sticky first column
- Print stylesheet and a one-page "full sheet" for printing or saving as PDF
- Console-style interface: a `console.log` panel listing the commands of the page you
  are reading (wide screens), a floating dock with home, previous/next, language, theme
  and search, and a pixel trail around the mouse on the home page
- Refreshing a page takes you back to the home page
- No server code, no database, no external fonts or trackers

Built with [Astro](https://astro.build) (static output), plain CSS and a few kilobytes
of JavaScript. Code blocks are highlighted at build time with Shiki.

## Run it locally

You need Node.js 22.23.4 or newer (Node 24 works).

```bash
npm install      # once
npm run dev      # http://localhost:4321, reloads when you save cheatsheet.md
npm run build    # writes the static site to dist/
npm run preview  # serves dist/ to check the production build
```

## Update the content

Edit **`cheatsheet.md`** only. Nothing else needs to change.

| In the Markdown | On the site |
| --- | --- |
| `# Title` (first line) | Site title, home page heading |
| Text before the first `##` | Intro on the home page and the full sheet |
| `## 3. Files: create, copy, …` | A new page. The number becomes the badge, the text the title |
| `### Sub-heading` | A sub-heading, listed in the console panel |
| Tables, lists, paragraphs | Rendered as written, and added to the search |
| ```` ```bash ```` / ```` ```c ```` code blocks | Highlighted, with a Copy button |

**Page URLs** come from the start of each `##` heading: the number is dropped and the
text is cut at the first `:`, `,`, `(` or ` and `. So `## 3. Files: create, copy…`
becomes `/files/` and `## 10. Inter-process communication and C system calls`
becomes `/inter-process-communication/`. If you rename a heading, its URL changes.

**Card descriptions** on the home page are generated: the command names from the
first column of the section's `Command` / `Call` tables, or else its first paragraph,
or else its sub-headings. To write your own, put this comment anywhere in the section:

```markdown
<!-- description: Everything about files and links -->
```

**Topic chips** on the home page group sections by their URL in
[`src/site.config.ts`](src/site.config.ts). A new section that is not listed there
still gets its page and card; it simply appears under an "Other" chip.

If `npm run dev` is running when you **add or rename** a section, restart it so the
new URL is picked up. Edits inside existing sections show up on save.

### The French version

[`cheatsheet.fr.md`](cheatsheet.fr.md) is the French translation and works the same way.
When you change `cheatsheet.md`, make the same change there.

- Keep **the same sections in the same order**. French pages are paired with English
  ones by position and reuse their URLs (`/files/` ↔ `/fr/files/`), which is how the
  language button knows where to go. The build prints a warning if the two files
  have a different number of sections.
- Translate the explanations only. Commands, code blocks and `code` spans stay
  exactly as in English; the "Nom complet" column keeps the English expansion
  (`pwd` = print working directory) because that is what the letters stand for.
- French spacing (a non-breaking space before `:` `;` `!` `?` and inside « ») is
  added automatically; type normal spaces.
- Interface text (buttons, menus, search messages) is in [`src/i18n.ts`](src/i18n.ts).

Delete `cheatsheet.fr.md` and the site goes back to English only (the button disappears).

## How it works

| File | Role |
| --- | --- |
| `cheatsheet.md`, `cheatsheet.fr.md` | The content, in English and French |
| `src/lib/cheatsheet.ts` | Reads the Markdown at build time, splits it on `##`, renders each section (tables, Shiki, copy buttons, anchors) and builds the search index |
| `src/lib/terminal-theme.ts` | Colours for highlighted code |
| `src/i18n.ts` | Interface text in English and French |
| `src/components/HomePage.astro` | Home page: cards, topic chips, print button |
| `src/components/SectionPage.astro` | One section with prev/next links |
| `src/components/AllPage.astro` | All sections on one page, used for printing |
| `src/pages/` | Routes: `/`, `/[slug]/`, `/all/` and the same under `/fr/`, plus `search-index.json` for each language |
| `src/layouts/Base.astro` | Page shell: tab strip, console panel, dock, footer credit, search dialog |
| `src/scripts/app.ts` | Theme, copy buttons, keyboard shortcuts, chips, tab strip, console scroll tracking, hero effects, pixel trail |
| `src/scripts/search.ts` | Search dialog with Fuse.js, loaded the first time search opens |
| `src/styles/global.css` | All styles: colour tokens for both themes, layout, print |
| `public/` | Favicon, social image (`og.png`), `robots.txt`, and the self-hosted pixel font |

## Design

The look is a terminal / IDE: near-black teal with neon mint in dark mode, pale mint
paper in light mode, monospace labels, thin headlines and a pixel font for big numbers.

- **Tab strip** (top): the site navigation. One tab per page (`index.page`,
  `files.section`, …, `all.page`); the current one is highlighted and scrolled into
  view. Use the ‹ › arrows or the mouse wheel when it is wider than the screen. A thin
  line under it shows how far you have read.
- **`console.log` panel** (screens 1408 px and wider): lists the commands of the
  section, typed out on load. The line for the row you are reading is highlighted;
  click a line to jump to it. Close it with the × in the tab strip (remembered).
- **Dock** (bottom): home, previous/next section, full sheet, language, theme, search.
- **Home**: pixels light up and fade around the mouse, the grid follows it, and red tags
  mark the sheet's dangerous commands (`rm -rf dir`, `kill -9 PID`, `sort f > f`,
  `SIGKILL`). The pixel trail is off on touch screens.
- **Refresh**: reloading any page sends you to the home page of its language (`/` or
  `/fr/`). This is switched off in `npm run dev`, where saving `cheatsheet.md`
  reloads the page.
- **Footer**: "Made by Akrem Medimagh · ITI3". Change it in `author` in
  [`src/site.config.ts`](src/site.config.ts).
- Animations are switched off when the system asks for reduced motion.

Colours are CSS variables at the top of `src/styles/global.css`. The pixel font is
[Silkscreen](https://github.com/googlefonts/silkscreen) (SIL Open Font License, see
`public/fonts/silkscreen-OFL.txt`), served from this site.

## Print or save as PDF

Click **Print / Save as PDF** on the home page. It opens `/all/` (every section on
one page) and starts the print dialog; choose "Save as PDF" as the printer. If topic
chips are selected, only those sections are printed. Any single section page can
also be printed with `Ctrl P`.

## Deploy on Vercel

No `vercel.json` is needed: Vercel detects Astro and serves `dist/` as a static site.

### Option A (recommended): GitHub + Vercel dashboard

Every `git push` then redeploys the site, so updating the cheat sheet is just
"edit `cheatsheet.md`, commit, push".

1. Push the code to GitHub. This repository already points to
   `https://github.com/lost4onin/Linux_commands.git`, so:

   ```bash
   git push origin main
   ```

2. Go to <https://vercel.com/new> and sign in with GitHub.
3. Under **Import Git Repository**, pick `Linux_commands` and click **Import**.
   (If it is not listed, click **Adjust GitHub App Permissions** and give Vercel
   access to the repository.)
4. Check the settings (Vercel fills them in):
   - **Framework Preset:** Astro
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install` (default)
5. Click **Deploy**. After about a minute you get a URL such as
   `https://linux-commands.vercel.app`.

### Option B: Vercel CLI

```bash
npx vercel          # first run: log in, answer the prompts, get a preview URL
npx vercel --prod   # deploy to the production URL
```

On the first `npx vercel`, accept the detected settings (Astro, `npm run build`,
`dist`). The CLI creates a `.vercel/` folder that links this folder to the project;
it is in `.gitignore`. Run `npx vercel --prod` again after each change.

### Site URL (canonical links and social previews)

Canonical links and absolute `og:image` URLs use, in order:

1. `SITE_URL` if you set it (Vercel → Project → Settings → Environment Variables,
   e.g. `https://my-domain.com`), then
2. `VERCEL_PROJECT_PRODUCTION_URL`, which Vercel sets on every build.

Without either (for example a local build), the canonical and `og:url` tags are left
out and `og:image` is a relative path.
