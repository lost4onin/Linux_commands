/**
 * Site-level settings. The content itself lives in /cheatsheet.md.
 */
export const site = {
  /** Short name shown in the header next to the >_ logo. */
  brand: 'Unix/Linux cheat sheet',
  /** Appended to every page title. */
  titleSuffix: 'Linux / Unix Cheat Sheet',
};

/**
 * Topic groups for the filter chips on the home page.
 * Each section is matched by its slug (the URL, e.g. /files/).
 * A section that is not listed here still gets a page and a card; it just
 * lands in an automatic "Other" chip.
 */
export const topics: { id: string; label: string; slugs: string[] }[] = [
  {
    id: 'basics',
    label: 'Shell basics',
    slugs: ['conventions', 'help', 'navigation', 'disk', 'remote-access'],
  },
  { id: 'files', label: 'Files & permissions', slugs: ['files', 'permissions'] },
  { id: 'text', label: 'Text, regex & sed', slugs: ['redirections'] },
  { id: 'scripting', label: 'Bash scripting', slugs: ['bash-shell'] },
  {
    id: 'processes',
    label: 'Processes & IPC',
    slugs: ['processes', 'inter-process-communication'],
  },
  { id: 'memory', label: 'Cache memory', slugs: ['cache-memory'] },
];

/** Slugs that would collide with other pages. */
export const RESERVED_SLUGS = ['all', '404', 'search-index.json', 'og.png', 'favicon.svg'];
