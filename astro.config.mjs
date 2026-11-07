// @ts-check
import { defineConfig } from 'astro/config';
import path from 'node:path';

// Absolute site URL, used for canonical links and Open Graph tags.
// Set SITE_URL yourself, or let Vercel provide its production domain.
const site =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

const CHEATSHEETS = [path.resolve('cheatsheet.md'), path.resolve('cheatsheet.fr.md')];

/**
 * The cheat sheets are read with fs at build time, so Vite does not know about them.
 * This reloads the browser in `npm run dev` whenever one of them is saved.
 * @returns {import('vite').Plugin}
 */
function reloadOnCheatsheetChange() {
  return {
    name: 'reload-on-cheatsheet-change',
    configureServer(server) {
      server.watcher.add(CHEATSHEETS);
      server.watcher.on('change', (file) => {
        if (CHEATSHEETS.includes(path.resolve(file))) {
          server.environments.client.hot.send({ type: 'full-reload', path: '*' });
        }
      });
    },
  };
}

export default defineConfig({
  site,
  output: 'static',
  build: {
    // Inline the (small) stylesheet: no render-blocking CSS request.
    inlineStylesheets: 'always',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  vite: {
    plugins: [reloadOnCheatsheetChange()],
  },
});
