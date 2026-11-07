/**
 * Search dialog. Loaded on demand: downloads /search-index.json once and
 * searches it with Fuse.js entirely in the browser.
 */
import Fuse, { type IFuseOptions } from 'fuse.js';

interface Entry {
  k: 'row' | 'code' | 'note' | 'heading' | 'section';
  c: string;
  n?: string;
  d: string;
  x?: string;
  s: string;
  u: string;
}
interface Index {
  sections: { n: string; t: string; u: string }[];
  entries: Entry[];
}

const MAX_RESULTS = 40;

const dialog = document.getElementById('search-dialog') as HTMLDialogElement;
const input = document.getElementById('search-input') as HTMLInputElement;
const list = document.getElementById('search-results') as HTMLElement;
const status = dialog.querySelector('.search-status') as HTMLElement;
const hint = dialog.querySelector('.search-group') as HTMLElement;

const options: IFuseOptions<Entry> = {
  keys: [
    { name: 'c', weight: 3 },
    { name: 'n', weight: 1.5 },
    { name: 'd', weight: 1 },
    { name: 'x', weight: 0.4 },
    { name: 's', weight: 0.3 },
  ],
  threshold: 0.32,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

let index: Index | undefined;
let fuse: Fuse<Entry> | undefined;
const ready: Promise<void> = fetch('/search-index.json')
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<Index>;
  })
  .then((data) => {
    index = data;
    fuse = new Fuse(data.entries, options);
  })
  .catch(() => {
    status.textContent = 'The search index could not be loaded. Check your connection and try again.';
  });

let active = 0;
let results: { href: string }[] = [];

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

function setActive(i: number) {
  const options = list.querySelectorAll<HTMLElement>('[role="option"]');
  if (options.length === 0) {
    input.removeAttribute('aria-activedescendant');
    return;
  }
  active = (i + options.length) % options.length;
  options.forEach((o, j) => o.setAttribute('aria-selected', String(j === active)));
  const current = options[active]!;
  input.setAttribute('aria-activedescendant', current.id);
  current.scrollIntoView({ block: 'nearest' });
}

function renderEmpty() {
  const sections = index?.sections ?? [];
  results = sections.map((s) => ({ href: s.u }));
  hint.hidden = false;
  list.innerHTML = sections
      .map(
        (s, i) => `<a role="option" id="sr-${i}" class="result result-section" href="${s.u}" aria-selected="false" tabindex="-1">
          <span class="result-cmd"><span class="result-num">${escapeHtml(s.n.padStart(2, '0'))}</span> ${escapeHtml(s.t)}</span>
        </a>`,
      )
      .join('');
  status.textContent = index ? '' : 'Loading search index…';
  setActive(0);
}

function renderResults(query: string) {
  if (!fuse) {
    status.textContent = 'Loading search index…';
    return;
  }
  const found = fuse.search(query, { limit: MAX_RESULTS }).map((r) => r.item);
  results = found.map((e) => ({ href: e.u }));
  hint.hidden = true;

  if (found.length === 0) {
    list.innerHTML = '';
    status.textContent = `No results for “${query}”.`;
    return;
  }

  list.innerHTML = found
    .map((e, i) => {
      const where = e.x && e.x !== e.c ? `${e.s} › ${e.x}` : e.s;
      const main =
        e.k === 'note'
          ? `<span class="result-desc result-note">${escapeHtml(e.d)}</span>`
          : `<span class="result-cmd">${escapeHtml(e.c)}${e.n ? ` <span class="result-name">${escapeHtml(e.n)}</span>` : ''}</span>
             ${e.d ? `<span class="result-desc">${escapeHtml(e.d)}</span>` : ''}`;
      return `<a role="option" id="sr-${i}" class="result result-${e.k}" href="${e.u}" aria-selected="false" tabindex="-1">
          ${main}
          <span class="result-where">${escapeHtml(where)}</span>
        </a>`;
    })
    .join('');
  status.textContent = `${found.length}${found.length === MAX_RESULTS ? '+' : ''} result${found.length === 1 ? '' : 's'}`;
  setActive(0);
}

function render() {
  const q = input.value.trim();
  if (q.length < 2) renderEmpty();
  else renderResults(q);
}

function go(href: string) {
  dialog.close();
  const target = new URL(href, location.href);
  if (target.pathname === location.pathname && target.hash) {
    // Same page: jump to the row and re-trigger the :target highlight.
    location.hash = '';
    location.hash = target.hash;
  } else {
    location.href = target.href;
  }
}

input.addEventListener('input', render);

input.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setActive(active + 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    setActive(active - 1);
  } else if (event.key === 'Escape') {
    // A search input would otherwise use the first Esc to clear itself.
    event.preventDefault();
    dialog.close();
  } else if (event.key === 'Enter') {
    const result = results[active];
    if (result) {
      event.preventDefault();
      go(result.href);
    }
  }
});

list.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[role="option"]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
  event.preventDefault();
  go(link.getAttribute('href')!);
});

list.addEventListener('mousemove', (event) => {
  const link = (event.target as Element).closest<HTMLElement>('[role="option"]');
  if (!link) return;
  const i = [...list.querySelectorAll('[role="option"]')].indexOf(link);
  if (i !== active) setActive(i);
});

// Click on the backdrop closes the dialog.
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.querySelector('[data-search-close]')?.addEventListener('click', () => dialog.close());

export function openSearch(initial?: string) {
  if (!dialog.open) dialog.showModal();
  if (initial !== undefined) input.value = initial;
  input.focus();
  input.select();
  render();
  ready.then(render);
}
