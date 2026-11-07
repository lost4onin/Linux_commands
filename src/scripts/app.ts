/**
 * Small client script loaded on every page. The search UI (and Fuse.js)
 * is only downloaded the first time search is opened.
 */
const root = document.documentElement;
const liveStatus = document.getElementById('live-status');

function announce(message: string) {
  if (!liveStatus) return;
  liveStatus.textContent = '';
  window.setTimeout(() => (liveStatus.textContent = message), 30);
}

/* ---------------- Theme ---------------- */

const themeButton = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function savedTheme(): string | null {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
}

function applyTheme(theme: 'light' | 'dark') {
  root.dataset.theme = theme;
  themeButton?.setAttribute('aria-pressed', String(theme === 'dark'));
}

applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');

themeButton?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem('theme', next);
  } catch {
    /* private mode: the choice just isn't remembered */
  }
});

systemDark.addEventListener('change', (event) => {
  if (!savedTheme()) applyTheme(event.matches ? 'dark' : 'light');
});

/* ---------------- Mobile navigation drawer ---------------- */

const navToggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const sidebar = document.getElementById('sidebar');
const desktop = window.matchMedia('(min-width: 64rem)');

function setNav(open: boolean, returnFocus = false) {
  if (open) root.dataset.nav = 'open';
  else delete root.dataset.nav;
  navToggle?.setAttribute('aria-expanded', String(open));
  if (open) {
    (sidebar?.querySelector<HTMLAnchorElement>('[aria-current="page"]') ?? sidebar?.querySelector('a'))?.focus();
  } else if (returnFocus) {
    navToggle?.focus();
  }
}

navToggle?.addEventListener('click', () => setNav(root.dataset.nav !== 'open'));
document.querySelector('[data-nav-close]')?.addEventListener('click', () => setNav(false));
sidebar?.addEventListener('click', (event) => {
  if ((event.target as Element).closest('a')) setNav(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && root.dataset.nav === 'open') setNav(false, true);
});
desktop.addEventListener('change', () => setNav(false));

/* ---------------- Copy buttons ---------------- */

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

document.addEventListener('click', async (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-copy]');
  if (!button) return;

  let text = '';
  if (button.dataset.copy === 'block') {
    text = button.closest('.code-block')?.querySelector('pre')?.textContent ?? '';
  } else {
    const code = button.previousElementSibling;
    text = code?.tagName === 'CODE' ? (code.textContent ?? '') : '';
  }
  if (!text) return;

  const ok = await copyText(text.replace(/\n$/, ''));
  button.classList.add(ok ? 'is-copied' : 'is-failed');
  const label = button.querySelector('.copy-label');
  if (label) label.textContent = ok ? 'Copied' : 'Failed';
  announce(ok ? 'Copied to clipboard' : 'Copy failed');
  window.setTimeout(() => {
    button.classList.remove('is-copied', 'is-failed');
    if (label) label.textContent = 'Copy';
  }, 1600);
});

/* ---------------- Search (lazy) ---------------- */

let searchModule: Promise<typeof import('./search')> | undefined;
const loadSearch = () => (searchModule ??= import('./search'));

async function openSearch(initial?: string) {
  const { openSearch: open } = await loadSearch();
  open(initial);
}

document.querySelectorAll<HTMLElement>('[data-search-open]').forEach((trigger) => {
  trigger.addEventListener('click', () => openSearch());
  trigger.addEventListener('pointerenter', loadSearch, { once: true });
  trigger.addEventListener('focus', loadSearch, { once: true });
});

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

document.addEventListener('keydown', (event) => {
  const k = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && k === 'k') {
    event.preventDefault();
    openSearch();
  } else if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !isTyping(event.target)) {
    event.preventDefault();
    openSearch();
  }
});

/* ---------------- Home: topic chips ---------------- */

const chips = document.querySelector<HTMLElement>('[data-chips]');
if (chips) {
  const cards = [...document.querySelectorAll<HTMLElement>('.card[data-topic]')];
  const status = document.querySelector<HTMLElement>('[data-filter-status]');
  const count = document.querySelector<HTMLElement>('[data-filter-count]');
  const revise = document.querySelector<HTMLAnchorElement>('[data-revise-link]');
  const print = document.querySelector<HTMLAnchorElement>('[data-print-link]');
  const buttons = [...chips.querySelectorAll<HTMLButtonElement>('.chip')];
  const selected = new Set<string>();

  const update = () => {
    for (const b of buttons) {
      const t = b.dataset.topic!;
      b.setAttribute('aria-pressed', String(t === 'all' ? selected.size === 0 : selected.has(t)));
    }
    const visible = cards.filter((c) => selected.size === 0 || selected.has(c.dataset.topic!));
    for (const c of cards) c.hidden = !visible.includes(c);

    const slugs = visible.map((c) => c.querySelector('a')!.getAttribute('href')!.replace(/\//g, ''));
    const only = selected.size === 0 ? '' : `only=${slugs.join(',')}`;
    if (revise) revise.href = `/all/${only ? `?${only}` : ''}`;
    if (print) print.href = `/all/?${only ? `${only}&` : ''}print=1`;
    if (status && count) {
      status.hidden = selected.size === 0;
      count.textContent = `Showing ${visible.length} of ${cards.length} sections.`;
    }
    try {
      sessionStorage.setItem('topics', [...selected].join(','));
    } catch {
      /* ignore */
    }
  };

  chips.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('.chip');
    if (!button) return;
    const t = button.dataset.topic!;
    if (t === 'all') selected.clear();
    else if (selected.has(t)) selected.delete(t);
    else selected.add(t);
    update();
  });

  try {
    for (const t of (sessionStorage.getItem('topics') ?? '').split(',')) {
      if (t && buttons.some((b) => b.dataset.topic === t)) selected.add(t);
    }
  } catch {
    /* ignore */
  }
  chips.hidden = false;
  update();
}

/* ---------------- Full sheet: ?only= filter and ?print=1 ---------------- */

const params = new URLSearchParams(location.search);
const onlyParam = params.get('only');
if (onlyParam) {
  const wanted = new Set(onlyParam.split(',').filter(Boolean));
  const sections = [...document.querySelectorAll<HTMLElement>('.sheet-section[data-slug]')];
  const shown = sections.filter((s) => wanted.has(s.dataset.slug!));
  if (shown.length > 0) {
    for (const s of sections) s.hidden = !wanted.has(s.dataset.slug!);
    const note = document.querySelector<HTMLElement>('[data-only-note]');
    const count = document.querySelector<HTMLElement>('[data-only-count]');
    if (note && count) {
      count.textContent = `Revision view: ${shown.length} of ${sections.length} sections.`;
      note.hidden = false;
    }
  }
}

document.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));

if (params.get('print') === '1' && document.querySelector('.all-page')) {
  // Drop ?print=1 so a reload doesn't print again.
  params.delete('print');
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
  window.addEventListener('load', () => window.setTimeout(() => window.print(), 250), { once: true });
}

/* ---------------- 404: show the path that was asked for ---------------- */

const missing = document.querySelector('[data-missing-path]');
if (missing) missing.textContent = location.pathname;
