/** Interface text for the current language (see src/i18n.ts and Base.astro). */
export interface UiStrings {
  lang: string;
  indexUrl: string;
  copy: string;
  copied: string;
  failed: string;
  announceCopied: string;
  announceFailed: string;
  showing: string;
  revision: string;
  loading: string;
  noResults: string;
  resultOne: string;
  resultMany: string;
  indexError: string;
}

export function readStrings(): UiStrings {
  try {
    return JSON.parse(document.getElementById('ui-strings')?.textContent ?? '{}') as UiStrings;
  } catch {
    return {} as UiStrings;
  }
}

/** Fill "{n} of {total}" style templates. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
