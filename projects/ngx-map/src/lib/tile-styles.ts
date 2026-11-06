export interface MapStyle {
  /** Template Leaflet dei tile (`{z}/{x}/{y}`, opzionalmente `{s}`). */
  url: string;
  attribution: string;
  /** Nome del parametro query con cui passare la chiave API (es. `key`, `api_key`). */
  keyParam?: string;
  /** Se true, senza `apiKey` lo stile non è utilizzabile e si ricade su `fallback`. */
  keyRequired?: boolean;
  /** Opzioni extra passate a `L.tileLayer` (es. `subdomains`, `maxZoom`). */
  options?: Record<string, unknown>;
}

const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
const CARTO = `${OSM} &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>`;

/** Stili pronti all'uso: `provideMap({ style: 'carto-voyager' })`. */
export const MAP_STYLES = {
  osm: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: OSM },
  'carto-voyager': {
    url: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution: CARTO,
    keyParam: 'key',
  },
  'carto-light': {
    url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: CARTO,
    keyParam: 'key',
  },
  'carto-dark': {
    url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: CARTO,
    keyParam: 'key',
  },
  'stadia-smooth': {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noopener">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
      OSM,
    keyParam: 'api_key',
    keyRequired: true,
  },
} as const satisfies Record<string, MapStyle>;

export type MapStyleName = keyof typeof MAP_STYLES;

/** Aggiunge la chiave API all'URL come parametro query. */
export function withApiKey(url: string, param: string, key: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}${param}=${encodeURIComponent(key)}`;
}
