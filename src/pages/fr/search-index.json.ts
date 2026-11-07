import type { APIRoute } from 'astro';
import { getCheatsheet, hasLang } from '../../lib/cheatsheet';

/** dist/fr/search-index.json, loaded by the search dialog on French pages. */
export const GET: APIRoute = async () => {
  const index = hasLang('fr') ? (await getCheatsheet('fr')).searchIndex : { sections: [], entries: [] };
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
