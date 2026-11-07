import type { APIRoute } from 'astro';
import { getCheatsheet } from '../lib/cheatsheet';

/** Static JSON file (dist/search-index.json) loaded by the search dialog on first use. */
export const GET: APIRoute = async () => {
  const { searchIndex } = await getCheatsheet();
  return new Response(JSON.stringify(searchIndex), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
