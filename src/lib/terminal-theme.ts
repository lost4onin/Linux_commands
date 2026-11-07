import type { ThemeRegistration } from 'shiki';

/**
 * A small dark "terminal" theme for Shiki. Code blocks use it in both light
 * and dark mode. Every colour keeps at least 4.5:1 contrast on the background.
 */
export const terminalTheme: ThemeRegistration = {
  name: 'terminal',
  type: 'dark',
  colors: {
    'editor.background': '#111714',
    'editor.foreground': '#dfe7e2',
  },
  tokenColors: [
    { settings: { foreground: '#dfe7e2', background: '#111714' } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#93a49a', fontStyle: 'italic' },
    },
    {
      scope: ['string', 'string.quoted', 'punctuation.definition.string'],
      settings: { foreground: '#a6e3a1' },
    },
    {
      scope: ['string.unquoted.argument'],
      settings: { foreground: '#dfe7e2' },
    },
    {
      scope: ['keyword', 'keyword.control', 'storage.modifier'],
      settings: { foreground: '#f2c76e' },
    },
    {
      scope: [
        'variable',
        'variable.other',
        'variable.parameter',
        'variable.language',
        'punctuation.definition.variable',
      ],
      settings: { foreground: '#7dcfff' },
    },
    {
      scope: [
        'entity.name.function',
        'entity.name.command',
        'support.function',
        'meta.function-call',
      ],
      settings: { foreground: '#c9a7ff' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character'],
      settings: { foreground: '#ffb07a' },
    },
    {
      scope: ['storage.type', 'entity.name.type', 'support.type', 'support.class'],
      settings: { foreground: '#7fdbca' },
    },
    {
      scope: ['meta.preprocessor', 'keyword.control.directive', 'punctuation.definition.directive'],
      settings: { foreground: '#ff9ac1' },
    },
    {
      scope: ['keyword.operator', 'punctuation'],
      settings: { foreground: '#b9c6be' },
    },
  ],
};
