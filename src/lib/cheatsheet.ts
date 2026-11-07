/**
 * Build-time parser for /cheatsheet.md.
 *
 * - The `#` heading is the site title; everything before the first `##` is the intro.
 * - Every `##` heading starts a section, which becomes one page.
 * - Tables, lists, paragraphs and code blocks are indexed for the client-side search.
 *
 * Nothing here runs in the browser.
 */
import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { toString as mdToString } from 'mdast-util-to-string';
import { toString as hastToString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';
import GithubSlugger, { slug as slugOnce } from 'github-slugger';
import { createHighlighter, type Highlighter } from 'shiki';
import type { Root as MdRoot, RootContent as MdContent, Table as MdTable } from 'mdast';
import type { Root as HRoot, RootContent as HContent, Element, ElementContent, Properties } from 'hast';
import { terminalTheme } from './terminal-theme';
import { topics, RESERVED_SLUGS } from '../site.config';

export const SOURCE_PATH = path.resolve(process.cwd(), 'cheatsheet.md');

export interface SubHeading {
  id: string;
  text: string;
}

export interface Section {
  index: number;
  /** "3" for "3. Files: ..." (empty if the heading has no number). */
  number: string;
  /** Heading text without the number. */
  title: string;
  /** Full heading text, exactly as in the markdown. */
  heading: string;
  /** Part of the title before the first ":", "," or " and ". */
  shortTitle: string;
  slug: string;
  url: string;
  topic: string;
  /** One-line description for cards and meta tags. */
  summary: string;
  /** True when the summary is a list of command names (shown in monospace). */
  summaryIsCommands: boolean;
  entryCount: number;
  subheadings: SubHeading[];
  /** HTML for the section's own page (### becomes h2). */
  html: string;
  /** HTML for the one-page sheet (### stays h3, ids prefixed with the slug). */
  htmlAll: string;
}

export interface SearchEntry {
  /** kind: row | code | note | heading | section */
  k: 'row' | 'code' | 'note' | 'heading' | 'section';
  /** command / first cell */
  c: string;
  /** full name (second column of command tables) */
  n?: string;
  /** explanation */
  d: string;
  /** context: sub-heading or table caption */
  x?: string;
  /** section number and short title */
  s: string;
  /** link */
  u: string;
}

export interface Cheatsheet {
  title: string;
  introHtml: string;
  description: string;
  sections: Section[];
  topics: { id: string; label: string; count: number }[];
  searchIndex: {
    sections: { n: string; t: string; u: string }[];
    entries: SearchEntry[];
  };
}

/* ------------------------------------------------------------------ */
/* Caching: re-parse only when the file changes (keeps `npm run dev` live) */

let cache: { mtime: number; data: Promise<Cheatsheet> } | undefined;

export function getCheatsheet(): Promise<Cheatsheet> {
  const mtime = fs.statSync(SOURCE_PATH).mtimeMs;
  if (!cache || cache.mtime !== mtime) {
    cache = { mtime, data: buildCheatsheet() };
  }
  return cache.data;
}

let highlighter: Promise<Highlighter> | undefined;
function getHighlighter() {
  highlighter ??= createHighlighter({
    themes: [terminalTheme],
    langs: ['bash', 'shellscript', 'c', 'cpp', 'makefile', 'asm', 'diff', 'ini'],
  });
  return highlighter;
}

/* ------------------------------------------------------------------ */
/* Command detection                                                   */

/** Placeholders used in the sheet that are not real command names. */
const PLACEHOLDERS = new Set(['cmd', 'cmd1', 'cmd2', 'file', 'dir', 'name', 'var', 'src', 'dest']);
const COMMAND_TOKEN = /^[a-z][\w.+-]*$/;

function headerOf(table: MdTable): string {
  const first = table.children[0]?.children[0];
  return first ? mdToString(first).trim().toLowerCase() : '';
}

function inlineCodes(node: MdContent): string[] {
  const out: string[] = [];
  visit(node, 'inlineCode', (code) => {
    out.push(code.value);
  });
  return out;
}

/** Command or function names from the first column of a table. */
function firstColumnNames(table: MdTable, purpose: 'summary' | 'known'): string[] {
  const header = headerOf(table);
  const isCommand = /^command\b/.test(header);
  const isCall = /^call\b/.test(header);
  const accepted =
    purpose === 'summary' ? isCommand || isCall : isCommand || /^(tool|syntax)\b/.test(header);
  if (!accepted) return [];

  const names: string[] = [];
  for (const row of table.children.slice(1)) {
    const cell = row.children[0];
    if (!cell) continue;
    for (const code of inlineCodes(cell)) {
      if (isCall) {
        const fn = code.match(/([A-Za-z_]\w*)\s*\(/);
        if (fn) names.push(fn[1]);
        continue;
      }
      const token = code.trim().split(/\s+/)[0] ?? '';
      if (COMMAND_TOKEN.test(token) && !PLACEHOLDERS.has(token)) names.push(token);
    }
  }
  return names;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/* ------------------------------------------------------------------ */
/* Small hast helpers                                                  */

function el(tagName: string, properties: Properties = {}, children: ElementContent[] = []): Element {
  return { type: 'element', tagName, properties, children };
}
function txt(value: string): ElementContent {
  return { type: 'text', value };
}
function isEl(node: unknown, tag?: string): node is Element {
  return (
    typeof node === 'object' &&
    node !== null &&
    (node as Element).type === 'element' &&
    (tag === undefined || (node as Element).tagName === tag)
  );
}
function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
function childElements(node: Element, tag?: string): Element[] {
  return node.children.filter((c): c is Element => isEl(c, tag));
}

function copyButton(): Element {
  return el('button', {
    type: 'button',
    className: ['copy-inline'],
    dataCopy: 'inline',
    ariaLabel: 'Copy command',
    title: 'Copy',
  });
}

/**
 * Decide whether an inline `code` gets a copy button.
 * - In the first column of a Command / Syntax / Call table: always (unless it
 *   is a key like Ctrl-c or a lone symbol).
 * - Elsewhere: only when it starts with a known command and has arguments,
 *   e.g. `kill -STOP PID`, `du -sh dir`.
 */
function shouldCopy(text: string, mode: 'command-cell' | 'prose', known: Set<string>): boolean {
  const t = text.trim();
  if ((t.match(/[a-z0-9]/gi) ?? []).length < 2) return false;
  if (/^ctrl-/i.test(t)) return false;
  if (mode === 'command-cell') return true;
  const first = t.split(/\s+/)[0] ?? '';
  return /\s/.test(t) && known.has(first);
}

function addCopyButtons(node: Element, mode: 'command-cell' | 'prose', known: Set<string>) {
  const targets: { parent: Element; index: number }[] = [];
  visit(node, 'element', (child, index, parent) => {
    if (child.tagName !== 'code' || index === undefined || !parent) return;
    if (shouldCopy(hastToString(child), mode, known)) {
      targets.push({ parent: parent as Element, index });
    }
  });
  for (const { parent, index } of targets.reverse()) {
    parent.children.splice(index + 1, 0, copyButton());
  }
}

/* ------------------------------------------------------------------ */
/* Section renderer (rehype plugin)                                    */

interface RenderOptions {
  slug: string;
  sectionTitle: string;
  sectionLabel: string;
  mode: 'page' | 'all';
  known: Set<string>;
  highlighter: Highlighter;
  entries: SearchEntry[];
  subheadings: SubHeading[];
}

function rehypeCheatsheet(opts: RenderOptions) {
  return (tree: HRoot) => {
    const slugger = new GithubSlugger();
    const prefix = opts.mode === 'all' ? `${opts.slug}--` : '';
    const makeId = (text: string) => {
      const words = clean(text).split(' ').slice(0, 8).join(' ');
      return prefix + (slugger.slug(words) || slugger.slug('item'));
    };
    const url = (id: string) => `/${opts.slug}/#${id}`;
    const collect = (entry: Omit<SearchEntry, 's'>) => {
      if (opts.mode === 'page') opts.entries.push({ ...entry, s: opts.sectionLabel });
    };

    let context = '';
    let codeCount = 0;
    const out: HContent[] = [];

    for (const node of tree.children) {
      if (!isEl(node)) {
        out.push(node);
        continue;
      }

      // Sub-headings: ### becomes h2 on the section page.
      if (/^h[3-6]$/.test(node.tagName)) {
        const text = clean(hastToString(node));
        const id = makeId(text);
        node.properties.id = id;
        const level = Number(node.tagName[1]);
        if (opts.mode === 'page') node.tagName = `h${level - 1}`;
        if (level === 3) opts.subheadings.push({ id, text });
        context = text;
        collect({ k: 'heading', c: text, d: opts.sectionTitle, u: url(id) });
        out.push(node);
        continue;
      }

      if (node.tagName === 'p') {
        const meaningful = node.children.filter(
          (c) => !(c.type === 'text' && c.value.trim() === ''),
        );
        const text = clean(hastToString(node));
        const id = makeId(text);
        node.properties.id = id;
        if (meaningful.length === 1 && isEl(meaningful[0], 'strong')) {
          // A bold-only paragraph acts as a caption for the table below it.
          node.properties.className = ['caption'];
          context = text;
          collect({ k: 'heading', c: text, d: opts.sectionTitle, u: url(id) });
        } else {
          addCopyButtons(node, 'prose', opts.known);
          collect({ k: 'note', c: '', d: text, x: context || undefined, u: url(id) });
        }
        out.push(node);
        continue;
      }

      if (node.tagName === 'ul' || node.tagName === 'ol') {
        for (const li of childElements(node, 'li')) {
          const text = clean(hastToString(li));
          const id = makeId(text);
          li.properties.id = id;
          addCopyButtons(li, 'prose', opts.known);
          collect({ k: 'note', c: '', d: text, x: context || undefined, u: url(id) });
        }
        out.push(node);
        continue;
      }

      if (node.tagName === 'table') {
        out.push(transformTable(node, context || opts.sectionTitle));
        continue;
      }

      if (node.tagName === 'pre') {
        out.push(transformCode(node, context || opts.sectionTitle));
        continue;
      }

      out.push(node);
    }

    tree.children = out;

    /* ---- tables ---- */
    function transformTable(table: Element, caption: string): Element {
      const thead = childElements(table, 'thead')[0];
      const tbody = childElements(table, 'tbody')[0];
      const headerRow = thead ? childElements(thead, 'tr')[0] : undefined;
      const headerCells = headerRow ? childElements(headerRow) : [];
      const headers = headerCells.map((c) => clean(hastToString(c)));
      const h0 = (headers[0] ?? '').toLowerCase();
      const isCommandTable = /^(command|syntax|call)\b/.test(h0);
      const cols = headers.length || (tbody ? childElements(childElements(tbody, 'tr')[0] ?? el('tr')).length : 0);

      for (const th of headerCells) th.properties.scope = 'col';

      for (const tr of tbody ? childElements(tbody, 'tr') : []) {
        const cells = childElements(tr);
        const texts = cells.map((c) => clean(hastToString(c)));
        const first = cells[0];
        if (!first) continue;
        // First column = row header (sticky, monospace for commands).
        first.tagName = 'th';
        first.properties.scope = 'row';

        const id = makeId(texts[0] || 'row');
        tr.properties.id = id;

        cells.forEach((cell, i) =>
          addCopyButtons(cell, i === 0 && isCommandTable ? 'command-cell' : 'prose', opts.known),
        );

        let name: string | undefined;
        let desc: string;
        if (cols >= 3 && /name/i.test(headers[1] ?? '')) {
          name = texts[1];
          desc = texts.slice(2).join(' · ');
        } else if (cols > 2) {
          desc = texts
            .slice(1)
            .map((t, i) => (headers[i + 1] ? `${headers[i + 1]}: ${t}` : t))
            .join(' · ');
        } else {
          desc = texts[1] ?? '';
        }
        collect({ k: 'row', c: texts[0] ?? '', n: name || undefined, d: desc, x: context || undefined, u: url(id) });
      }

      table.properties.className = isCommandTable ? ['is-commands'] : [];
      table.properties.dataCols = String(cols);
      return el(
        'div',
        { className: ['table-wrap'], tabIndex: 0, role: 'group', ariaLabel: `Table: ${caption}` },
        [table],
      );
    }

    /* ---- code blocks ---- */
    function transformCode(pre: Element, caption: string): Element {
      const code = childElements(pre, 'code')[0] ?? pre;
      const classes = ([] as unknown[]).concat(code.properties.className ?? []).map(String);
      const lang = classes.find((c) => c.startsWith('language-'))?.slice('language-'.length) ?? 'text';
      const source = hastToString(code).replace(/\n$/, '');
      const loaded = opts.highlighter.getLoadedLanguages();
      const highlighted = opts.highlighter.codeToHast(source, {
        lang: loaded.includes(lang) ? lang : 'text',
        theme: 'terminal',
      });
      const shikiPre = highlighted.children.find((c): c is Element => isEl(c, 'pre')) ?? pre;
      shikiPre.properties = {
        className: ['shiki'],
        tabIndex: 0,
        ariaLabel: `${lang} code: ${caption}`,
      };

      codeCount += 1;
      const id = `${prefix}code-${codeCount}`;

      // Index each commented chunk: "# for loop" + the lines below it.
      for (const chunk of source.split(/\n\s*\n/)) {
        const lines = chunk.split('\n').filter((l) => l.trim() !== '');
        const comments = lines
          .filter((l) => /^\s*(#(?!!)|\/\/|\/\*)/.test(l))
          .map((l) => l.replace(/^\s*(#|\/\/|\/\*)\s?/, '').replace(/\*\/\s*$/, ''));
        const codeLines = lines.filter((l) => !/^\s*(#(?!!)|\/\/|\/\*)/.test(l));
        if (codeLines.length === 0) continue;
        collect({
          k: 'code',
          c: clean(codeLines[0] ?? '') + (codeLines.length > 1 ? ' …' : ''),
          d: clean(comments.join(' ') || codeLines.slice(1).join(' ')),
          x: context || undefined,
          u: url(id),
        });
      }

      return el('div', { className: ['code-block'], id }, [
        el('div', { className: ['code-head'] }, [
          el('span', { className: ['code-lang'] }, [txt(lang)]),
          el('button', { type: 'button', className: ['copy-block'], dataCopy: 'block' }, [
            el('span', { className: ['copy-label'] }, [txt('Copy')]),
            el('span', { className: ['sr-only'] }, [txt(' code')]),
          ]),
        ]),
        shikiPre,
      ]);
    }
  };
}

async function renderNodes(nodes: MdContent[], opts: RenderOptions): Promise<string> {
  const root: MdRoot = { type: 'root', children: structuredClone(nodes) };
  const processor = unified().use(remarkRehype).use(rehypeCheatsheet, opts).use(rehypeStringify);
  const hast = await processor.run(root);
  return processor.stringify(hast as HRoot);
}

async function renderPlain(nodes: MdContent[]): Promise<string> {
  const root: MdRoot = { type: 'root', children: structuredClone(nodes) };
  const processor = unified().use(remarkRehype).use(rehypeStringify);
  const hast = await processor.run(root);
  return processor.stringify(hast as HRoot);
}

/* ------------------------------------------------------------------ */
/* Main build                                                          */

async function buildCheatsheet(): Promise<Cheatsheet> {
  // Normalise Windows line endings so copied code has no stray \r.
  const source = fs.readFileSync(SOURCE_PATH, 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const mdTree = unified().use(remarkParse).use(remarkGfm).parse(source) as MdRoot;

  let title = '';
  const intro: MdContent[] = [];
  const raw: { headingText: string; nodes: MdContent[] }[] = [];

  for (const node of mdTree.children) {
    if (node.type === 'heading' && node.depth === 1 && !title && raw.length === 0) {
      title = clean(mdToString(node));
      continue;
    }
    if (node.type === 'heading' && node.depth === 2) {
      raw.push({ headingText: clean(mdToString(node)), nodes: [] });
      continue;
    }
    if (raw.length > 0) raw[raw.length - 1]!.nodes.push(node);
    else intro.push(node);
  }

  if (raw.length === 0) {
    throw new Error(`cheatsheet.md has no "## " headings, so there are no sections to build.`);
  }

  // Commands known anywhere in the sheet, used to decide which inline code gets a copy button.
  const known = new Set<string>();
  for (const r of raw) {
    for (const node of r.nodes) {
      if (node.type === 'table') firstColumnNames(node, 'known').forEach((n) => known.add(n));
    }
  }

  const highlighter = await getHighlighter();
  const usedSlugs = new Set(RESERVED_SLUGS);
  const entries: SearchEntry[] = [];
  const sections: Section[] = [];

  for (const [index, r] of raw.entries()) {
    const m = r.headingText.match(/^(\d+)[.)]\s+(.*)$/);
    const number = m?.[1] ?? '';
    const title_ = m?.[2] ?? r.headingText;
    const shortTitle = clean(title_.split(/[:,(]|\s+and\s+/i)[0] ?? '') || title_;

    const base = slugOnce(shortTitle) || `section-${index}`;
    let slug = base;
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${base}-${n}`;
    usedSlugs.add(slug);

    // One-line summary: <!-- description: ... --> override, else command names,
    // else the first paragraph, else the sub-headings.
    const override = r.nodes
      .filter((n): n is Extract<MdContent, { type: 'html' }> => n.type === 'html')
      .map((n) => n.value.match(/<!--\s*description:\s*([\s\S]*?)\s*-->/)?.[1])
      .find(Boolean);
    const commands = unique(
      r.nodes.flatMap((n) => (n.type === 'table' ? firstColumnNames(n, 'summary') : [])),
    );
    const firstNode = r.nodes.find((n) => n.type !== 'html');
    const firstParagraph = firstNode?.type === 'paragraph' ? clean(mdToString(firstNode)) : '';
    const headingTexts = r.nodes
      .filter((n) => n.type === 'heading')
      .map((n) => clean(mdToString(n)));

    let summary: string;
    let summaryIsCommands = false;
    if (override) summary = clean(override);
    else if (commands.length > 0) {
      summary = commands.join(' · ');
      summaryIsCommands = true;
    } else if (firstParagraph) summary = firstParagraph;
    else summary = headingTexts.join(' · ') || title_;

    const sectionLabel = number ? `${number}. ${shortTitle}` : shortTitle;
    const subheadings: SubHeading[] = [];
    const before = entries.length;
    const common = { slug, sectionTitle: r.headingText, sectionLabel, known, highlighter };

    const html = await renderNodes(r.nodes, { ...common, mode: 'page', entries, subheadings });
    const htmlAll = await renderNodes(r.nodes, { ...common, mode: 'all', entries: [], subheadings: [] });

    const entryCount = entries.slice(before).filter((e) => e.k === 'row' || e.k === 'code').length;
    entries.splice(before, 0, {
      k: 'section',
      c: r.headingText,
      d: summary,
      s: sectionLabel,
      u: `/${slug}/`,
    });

    sections.push({
      index,
      number,
      title: title_,
      heading: r.headingText,
      shortTitle,
      slug,
      url: `/${slug}/`,
      topic: topics.find((t) => t.slugs.includes(slug))?.id ?? 'other',
      summary,
      summaryIsCommands,
      entryCount,
      subheadings,
      html,
      htmlAll,
    });
  }

  const introParagraphs = intro.filter((n) => n.type === 'paragraph').map((n) => clean(mdToString(n)));
  const description =
    introParagraphs.slice().sort((a, b) => b.length - a.length)[0] ?? title;

  const topicList = [...topics, { id: 'other', label: 'Other', slugs: [] }]
    .map((t) => ({ id: t.id, label: t.label, count: sections.filter((s) => s.topic === t.id).length }))
    .filter((t) => t.count > 0);

  return {
    title: title || 'Cheat sheet',
    introHtml: await renderPlain(intro),
    description,
    sections,
    topics: topicList,
    searchIndex: {
      sections: sections.map((s) => ({ n: s.number, t: s.title, u: s.url })),
      entries,
    },
  };
}
