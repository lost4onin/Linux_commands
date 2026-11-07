/**
 * Build-time parser for /cheatsheet.md (English) and /cheatsheet.fr.md (French).
 *
 * - The `#` heading is the site title; everything before the first `##` is the intro.
 * - Every `##` heading starts a section, which becomes one page.
 * - French sections are paired with English ones by position and reuse their slugs.
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
import { topics, otherTopicLabel, RESERVED_SLUGS } from '../site.config';
import { ui, langBase, type Lang } from '../i18n';

export const SOURCE_PATHS: Record<Lang, string> = {
  en: path.resolve(process.cwd(), 'cheatsheet.md'),
  fr: path.resolve(process.cwd(), 'cheatsheet.fr.md'),
};

/** True when the Markdown file for this language exists. */
export function hasLang(lang: Lang): boolean {
  return fs.existsSync(SOURCE_PATHS[lang]);
}

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
  lang: Lang;
  /** URL prefix: '' or '/fr'. */
  base: string;
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

const cache = new Map<Lang, { key: string; data: Promise<Cheatsheet> }>();

function mtime(file: string): number {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

export function getCheatsheet(lang: Lang = 'en'): Promise<Cheatsheet> {
  // French slugs depend on the English file, so both mtimes are part of the key.
  const key = `${mtime(SOURCE_PATHS.en)}:${mtime(SOURCE_PATHS[lang])}`;
  const hit = cache.get(lang);
  if (hit && hit.key === key) return hit.data;
  const data = buildCheatsheet(lang);
  cache.set(lang, { key, data });
  return data;
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

/* First-column table headers, in English and French. */
const H_COMMAND = /^(command|commande)\b/;
const H_CALL = /^(call|appel)\b/;
const H_TOOL_OR_SYNTAX = /^(tool|outil|syntax|syntaxe)\b/;
const H_COMMAND_TABLE = /^(command|commande|syntax|syntaxe|call|appel)\b/;
const H_NAME = /name|nom/i;

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
  const isCommand = H_COMMAND.test(header);
  const isCall = H_CALL.test(header);
  const accepted =
    purpose === 'summary' ? isCommand || isCall : isCommand || H_TOOL_OR_SYNTAX.test(header);
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

type Labels = (typeof ui)['en']['render'];

function copyButton(labels: Labels): Element {
  return el('button', {
    type: 'button',
    className: ['copy-inline'],
    dataCopy: 'inline',
    ariaLabel: labels.copyCommand,
    title: labels.copy,
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

function addCopyButtons(
  node: Element,
  mode: 'command-cell' | 'prose',
  known: Set<string>,
  labels: Labels,
) {
  const targets: { parent: Element; index: number }[] = [];
  visit(node, 'element', (child, index, parent) => {
    if (child.tagName !== 'code' || index === undefined || !parent) return;
    if (shouldCopy(hastToString(child), mode, known)) {
      targets.push({ parent: parent as Element, index });
    }
  });
  for (const { parent, index } of targets.reverse()) {
    parent.children.splice(index + 1, 0, copyButton(labels));
  }
}

/* ------------------------------------------------------------------ */
/* Section renderer (rehype plugin)                                    */

interface RenderOptions {
  slug: string;
  /** URL prefix of the language ('' or '/fr'). */
  base: string;
  labels: Labels;
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
    const url = (id: string) => `${opts.base}/${opts.slug}/#${id}`;
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
          addCopyButtons(node, 'prose', opts.known, opts.labels);
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
          addCopyButtons(li, 'prose', opts.known, opts.labels);
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
      const isCommandTable = H_COMMAND_TABLE.test(h0);
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
          addCopyButtons(cell, i === 0 && isCommandTable ? 'command-cell' : 'prose', opts.known, opts.labels),
        );

        let name: string | undefined;
        let desc: string;
        if (cols >= 3 && H_NAME.test(headers[1] ?? '')) {
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
        { className: ['table-wrap'], tabIndex: 0, role: 'group', ariaLabel: `${opts.labels.table}: ${caption}` },
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
        ariaLabel: `${opts.labels.code(lang)}: ${caption}`,
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
            el('span', { className: ['copy-label'] }, [txt(opts.labels.copy)]),
            el('span', { className: ['sr-only'] }, [txt(opts.labels.copyCodeSr)]),
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

async function buildCheatsheet(lang: Lang): Promise<Cheatsheet> {
  const file = SOURCE_PATHS[lang];
  const fileName = path.basename(file);
  const t = ui[lang];
  const base = langBase(lang);

  // Normalise Windows line endings so copied code has no stray \r.
  const source = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const mdTree = unified().use(remarkParse).use(remarkGfm).parse(source) as MdRoot;

  if (lang === 'fr') {
    // French typography: no line break before : ; ! ? » or after «. Code is untouched.
    visit(mdTree, 'text', (node) => {
      node.value = node.value.replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ');
    });
  }

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
    throw new Error(`${fileName} has no "## " headings, so there are no sections to build.`);
  }

  // Translations reuse the English slugs, paired by position, so /files/ <-> /fr/files/.
  const englishSlugs = lang === 'en' ? [] : (await getCheatsheet('en')).sections.map((s) => s.slug);
  if (lang !== 'en' && englishSlugs.length !== raw.length) {
    console.warn(
      `[cheatsheet] ${fileName} has ${raw.length} sections but cheatsheet.md has ${englishSlugs.length}. ` +
        'Sections are paired by position, so keep the same order in both files.',
    );
  }

  // Commands known anywhere in the sheet, used to decide which inline code gets a copy button.
  const known = new Set<string>();
  for (const r of raw) {
    for (const node of r.nodes) {
      if (node.type === 'table') firstColumnNames(node, 'known').forEach((n) => known.add(n));
    }
  }

  const highlighter = await getHighlighter();
  const usedSlugs = new Set([...RESERVED_SLUGS, ...englishSlugs]);
  const entries: SearchEntry[] = [];
  const sections: Section[] = [];

  for (const [index, r] of raw.entries()) {
    const m = r.headingText.match(/^(\d+)[.)]\s+(.*)$/);
    const number = m?.[1] ?? '';
    const title_ = m?.[2] ?? r.headingText;
    const shortTitle = clean(title_.split(/[:,(]|\s+(?:and|et)\s+/i)[0] ?? '') || title_;

    let slug = englishSlugs[index] ?? '';
    if (!slug) {
      const baseSlug = slugOnce(shortTitle) || `section-${index}`;
      slug = baseSlug;
      for (let n = 2; usedSlugs.has(slug); n++) slug = `${baseSlug}-${n}`;
      usedSlugs.add(slug);
    }
    const url = `${base}/${slug}/`;

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
    const common = {
      slug,
      base,
      labels: t.render,
      sectionTitle: r.headingText,
      sectionLabel,
      known,
      highlighter,
    };

    const html = await renderNodes(r.nodes, { ...common, mode: 'page', entries, subheadings });
    const htmlAll = await renderNodes(r.nodes, { ...common, mode: 'all', entries: [], subheadings: [] });

    const entryCount = entries.slice(before).filter((e) => e.k === 'row' || e.k === 'code').length;
    entries.splice(before, 0, { k: 'section', c: r.headingText, d: summary, s: sectionLabel, u: url });

    sections.push({
      index,
      number,
      title: title_,
      heading: r.headingText,
      shortTitle,
      slug,
      url,
      topic: topics.find((tp) => tp.slugs.includes(slug))?.id ?? 'other',
      summary,
      summaryIsCommands,
      entryCount,
      subheadings,
      html,
      htmlAll,
    });
  }

  const introParagraphs = intro.filter((n) => n.type === 'paragraph').map((n) => clean(mdToString(n)));
  const description = introParagraphs.slice().sort((a, b) => b.length - a.length)[0] ?? title;

  const topicList = [...topics, { id: 'other', label: otherTopicLabel, slugs: [] }]
    .map((tp) => ({
      id: tp.id,
      label: tp.label[lang],
      count: sections.filter((s) => s.topic === tp.id).length,
    }))
    .filter((tp) => tp.count > 0);

  return {
    lang,
    base,
    title: title || t.titleSuffix,
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
