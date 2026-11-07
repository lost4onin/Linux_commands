/**
 * Site-level settings. The content itself lives in /cheatsheet.md
 * (and its French translation /cheatsheet.fr.md). Interface text is in src/i18n.ts.
 */

/**
 * Topic groups for the filter chips on the home page.
 * Each section is matched by its slug (the URL, e.g. /files/). French pages use
 * the same slugs as the English ones (/fr/files/), so one list covers both.
 * A section that is not listed here still gets a page and a card; it just
 * lands in an automatic "Other" chip.
 */
export const topics: { id: string; label: { en: string; fr: string }; slugs: string[] }[] = [
  {
    id: 'basics',
    label: { en: 'Shell basics', fr: 'Bases du shell' },
    slugs: ['conventions', 'help', 'navigation', 'disk', 'remote-access'],
  },
  {
    id: 'files',
    label: { en: 'Files & permissions', fr: 'Fichiers et droits' },
    slugs: ['files', 'permissions'],
  },
  { id: 'text', label: { en: 'Text, regex & sed', fr: 'Texte, regex et sed' }, slugs: ['redirections'] },
  { id: 'scripting', label: { en: 'Bash scripting', fr: 'Scripts bash' }, slugs: ['bash-shell'] },
  {
    id: 'processes',
    label: { en: 'Processes & IPC', fr: 'Processus et IPC' },
    slugs: ['processes', 'inter-process-communication'],
  },
  { id: 'memory', label: { en: 'Cache memory', fr: 'Mémoire cache' }, slugs: ['cache-memory'] },
  { id: 'exam', label: { en: 'Exam', fr: 'Examen' }, slugs: ['exam-2017-2018-recreated'] },
];

export const otherTopicLabel = { en: 'Other', fr: 'Autres' };

/** Slugs that would collide with other pages. */
export const RESERVED_SLUGS = ['all', 'fr', '404', 'search-index.json', 'og.png', 'favicon.svg'];
