/**
 * Small client script loaded on every page. The search UI (and Fuse.js)
 * is only downloaded the first time search is opened.
 */
import { readStrings, format } from './strings';

const ui = readStrings();
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
  if (label) label.textContent = ok ? ui.copied : ui.failed;
  announce(ok ? ui.announceCopied : ui.announceFailed);
  window.setTimeout(() => {
    button.classList.remove('is-copied', 'is-failed');
    if (label) label.textContent = ui.copy;
  }, 1600);
});

/* ---------------- Search (lazy) ---------------- */

let searchModule: Promise<typeof import('./search')> | undefined;
const loadSearch = () => (searchModule ??= import('./search'));

async function openSearch(initial?: string) {
  // Open and focus right away so keys typed while the search code loads are kept.
  const dialog = document.getElementById('search-dialog') as HTMLDialogElement | null;
  const input = document.getElementById('search-input') as HTMLInputElement | null;
  if (dialog && !dialog.open) {
    dialog.showModal();
    input?.focus();
    input?.select(); // reopening: typing replaces the previous query
  }
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

    const slugs = visible.map((c) => c.dataset.slug!);
    const allUrl = chips.dataset.allUrl ?? '/all/';
    const only = selected.size === 0 ? '' : `only=${slugs.join(',')}`;
    if (revise) revise.href = `${allUrl}${only ? `?${only}` : ''}`;
    if (print) print.href = `${allUrl}?${only ? `${only}&` : ''}print=1`;
    if (status && count) {
      status.hidden = selected.size === 0;
      count.textContent = format(ui.showing, { n: visible.length, total: cards.length });
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
      count.textContent = format(ui.revision, { n: shown.length, total: sections.length });
      note.hidden = false;
    }
  }
}

document.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));

// Off-screen sections of the full sheet skip layout (content-visibility), so their
// height is only estimated. When the page is opened at an #anchor, lay everything
// out first and jump again so we land on the right section.
const allPage = document.querySelector('.all-page');
function jumpToHash() {
  if (!allPage || !location.hash) return;
  allPage.classList.add('is-anchored');
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }));
}
jumpToHash();
window.addEventListener('hashchange', jumpToHash);

if (params.get('print') === '1' && document.querySelector('.all-page')) {
  // Drop ?print=1 so a reload doesn't print again.
  params.delete('print');
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
  window.addEventListener('load', () => window.setTimeout(() => window.print(), 250), { once: true });
}

/* ---------------- 404: show the path that was asked for ---------------- */

const missing = document.querySelector('[data-missing-path]');
if (missing) missing.textContent = location.pathname;

/* ---------------- Tab strip (section navigation) ---------------- */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const tabbar = document.querySelector<HTMLElement>('.tabbar');
const strip = document.querySelector<HTMLElement>('.tabs');
const arrows = [...document.querySelectorAll<HTMLButtonElement>('[data-tabs-scroll]')];

function updateArrows() {
  if (!strip) return;
  const max = strip.scrollWidth - strip.clientWidth;
  const [left, right] = arrows;
  if (left) left.hidden = strip.scrollLeft <= 2;
  if (right) right.hidden = strip.scrollLeft >= max - 2;
}

if (strip) {
  // Put the current page's tab in the middle of the strip (after first paint: no forced reflow).
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const active = strip.querySelector<HTMLElement>('a[aria-current]');
      if (active) strip.scrollLeft = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
      updateArrows();
    }),
  );
  strip.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows, { passive: true });
  for (const arrow of arrows) {
    arrow.addEventListener('click', () => {
      const dir = Number(arrow.dataset.tabsScroll);
      strip.scrollBy({ left: dir * strip.clientWidth * 0.7, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  }
  // A vertical mouse wheel over the strip scrolls it sideways (until it reaches an end).
  strip.addEventListener(
    'wheel',
    (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = strip.scrollWidth - strip.clientWidth;
      const atEnd = event.deltaY > 0 ? strip.scrollLeft >= max - 1 : strip.scrollLeft <= 0;
      if (max <= 0 || atEnd) return;
      event.preventDefault();
      strip.scrollLeft += event.deltaY;
    },
    { passive: false },
  );
}

/* ---------------- Reading progress + console: follow the scroll position ---------------- */

const consoleList = document.querySelector<HTMLElement>('.console-lines');
const consoleLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-console-target]')];

interface Spy {
  link: HTMLElement;
  target: HTMLElement;
}
const byId = (id: string) => document.getElementById(decodeURIComponent(id));
const consoleSpies: Spy[] = consoleLinks
  .map((link) => ({ link: link.parentElement!, target: byId(link.dataset.consoleTarget!)! }))
  .filter((s) => s.target);

/** The last target whose top has passed the reading line. */
function current(spies: Spy[], line: number): Spy | undefined {
  let found: Spy | undefined;
  for (const s of spies) {
    if (s.target.offsetParent === null && !s.target.getClientRects().length) continue; // hidden
    if (s.target.getBoundingClientRect().top <= line) found = s;
    else break;
  }
  return found ?? spies[0];
}

let activeLine: Spy | undefined;
let ticking = false;

function onScroll() {
  ticking = false;

  // 1. Read layout (all reads before any write, so the browser lays out once).
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
  const line = (tabbar?.offsetHeight ?? 36) + window.innerHeight * 0.25;
  const consoleShown = Boolean(consoleList && consoleList.offsetParent !== null);
  const cl = consoleShown ? current(consoleSpies, line) : undefined;
  const consoleTop =
    consoleShown && cl && cl !== activeLine ? cl.link.offsetTop - consoleList!.clientHeight / 3 : undefined;

  // 2. Write.
  tabbar?.style.setProperty('--progress', String(progress));
  if (consoleShown && cl !== activeLine) {
    activeLine?.link.classList.remove('is-active');
    cl?.link.classList.add('is-active');
    activeLine = cl;
    // Keep the active line in view inside the console only (not the page).
    if (consoleTop !== undefined) {
      consoleList!.scrollTo({ top: consoleTop, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
  }
}

if (tabbar) {
  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  // First pass after the first paint, when layout is already done (no forced reflow).
  requestAnimationFrame(() => requestAnimationFrame(onScroll));
}

/* ---------------- Console panel: open / close (remembered) ---------------- */

const consoleToggle = document.querySelector<HTMLButtonElement>('[data-console-toggle]');
if (consoleToggle) {
  const sync = () => consoleToggle.setAttribute('aria-expanded', String(root.dataset.console !== 'closed'));
  sync();
  consoleToggle.addEventListener('click', () => {
    if (root.dataset.console === 'closed') delete root.dataset.console;
    else root.dataset.console = 'closed';
    try {
      localStorage.setItem('console', root.dataset.console ?? 'open');
    } catch {
      /* ignore */
    }
    sync();
    onScroll();
  });
}

/* ---------------- Hero: grid spotlight follows the pointer ---------------- */

const spotlight = document.querySelector<HTMLElement>('[data-spotlight]');
const spotlightBg = spotlight?.querySelector<HTMLElement>('.hero-bg');
if (spotlight && spotlightBg && window.matchMedia('(hover: hover)').matches) {
  let frame = 0;
  spotlight.addEventListener('pointermove', (event) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = spotlightBg.getBoundingClientRect();
      spotlightBg.style.setProperty('--mx', `${event.clientX - r.left}px`);
      spotlightBg.style.setProperty('--my', `${event.clientY - r.top}px`);
    });
  });
}

/* ---------------- Scroll reveal ---------------- */

const revealItems = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (revealItems.length && 'IntersectionObserver' in window && !reduceMotion.matches) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        // Small stagger for items that appear together.
        el.style.transitionDelay = `${Math.min(Number(el.dataset.revealIndex ?? 0), 6) * 40}ms`;
        el.classList.add('is-visible');
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  revealItems.forEach((el, i) => {
    el.dataset.revealIndex = String(i % 3);
    io.observe(el);
  });
} else {
  revealItems.forEach((el) => el.classList.add('is-visible'));
}

/* ---------------- "Decrypt" effect on hover (card labels) ---------------- */

const GLYPHS = '!<>-_/[]{}=+*^?#01$%';
function scramble(el: HTMLElement) {
  const original = el.dataset.text ?? el.textContent ?? '';
  el.dataset.text = original;
  if (reduceMotion.matches || el.dataset.busy) return;
  el.dataset.busy = '1';
  const start = performance.now();
  const duration = 420;
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const settled = Math.floor(p * original.length);
    el.textContent =
      original.slice(0, settled) +
      [...original.slice(settled)]
        .map((ch) => (ch === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
        .join('');
    if (p < 1) requestAnimationFrame(step);
    else {
      el.textContent = original;
      delete el.dataset.busy;
    }
  };
  requestAnimationFrame(step);
}
document.querySelectorAll<HTMLElement>('[data-scramble]').forEach((label) => {
  const host = label.closest('a') ?? label;
  host.addEventListener('pointerenter', () => scramble(label));
  host.addEventListener('focus', () => scramble(label));
});
