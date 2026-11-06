import { InjectionToken, Provider } from '@angular/core';
import { LatLngTuple, MapCategory } from './models';
import { MAP_STYLES, MapStyle, MapStyleName, withApiKey } from './tile-styles';

export interface NgxMapConfig {
  /** URL dei tile, risolto da `style`/`apiKey` o impostato a mano. */
  tileUrl: string;
  attribution: string;
  /** Opzioni extra per `L.tileLayer` (es. `subdomains`). */
  tileOptions: Record<string, unknown>;
  center: LatLngTuple;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  categories: Record<string, MapCategory>;
  defaultCategory: MapCategory;
}

export const DEFAULT_NGX_MAP_CONFIG: NgxMapConfig = {
  tileUrl: MAP_STYLES.osm.url,
  attribution: MAP_STYLES.osm.attribution,
  tileOptions: {},
  center: [41.9028, 12.4964],
  zoom: 13,
  minZoom: 3,
  maxZoom: 19,
  categories: {},
  defaultCategory: { color: '#64748b', label: '' },
};

export const NGX_MAP_CONFIG = new InjectionToken<NgxMapConfig>('NGX_MAP_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_NGX_MAP_CONFIG,
});

/** Input di `provideMap`: come `NgxMapConfig`, più i campi per scegliere lo stile dei tile. */
export interface ProvideMapOptions extends Partial<NgxMapConfig> {
  /** Stile predefinito (`MAP_STYLES`) oppure uno stile personalizzato. Ha la precedenza su `tileUrl`/`attribution`. */
  style?: MapStyleName | MapStyle;
  /** Chiave API del provider dei tile. Facoltativa dove il provider non la richiede. */
  apiKey?: string;
  /** Stile di riserva se `style` richiede una chiave e `apiKey` manca. Default: `osm`. */
  fallbackStyle?: MapStyleName | MapStyle;
}

function resolveStyle(style: MapStyleName | MapStyle): MapStyle {
  return typeof style === 'string' ? MAP_STYLES[style] : style;
}

/** Traduce `style`+`apiKey` in `tileUrl`, `attribution` e `tileOptions`. */
export function resolveTiles(
  opts: Pick<ProvideMapOptions, 'style' | 'apiKey' | 'fallbackStyle'>,
): Pick<NgxMapConfig, 'tileUrl' | 'attribution' | 'tileOptions'> | null {
  if (!opts.style) return null;
  let style = resolveStyle(opts.style);
  if (style.keyRequired && !opts.apiKey) {
    console.warn('[ngx-map] Lo stile scelto richiede una apiKey: uso lo stile di riserva.');
    style = resolveStyle(opts.fallbackStyle ?? 'osm');
  }
  const key = opts.apiKey && style.keyParam ? opts.apiKey : undefined;
  return {
    tileUrl: key ? withApiKey(style.url, style.keyParam!, key) : style.url,
    attribution: style.attribution,
    tileOptions: style.options ?? {},
  };
}

/**
 * Configura le mappe dell'applicazione. Facoltativo: senza, si usano i default (tile OpenStreetMap).
 * `categories` viene unito a quelli di default, gli altri campi li sostituiscono.
 * Lo stile si sceglie con `style` (+ `apiKey`) oppure a mano con `tileUrl`/`attribution`.
 */
export function provideMap(options: ProvideMapOptions = {}): Provider {
  const { style, apiKey, fallbackStyle, ...config } = options;
  const tiles = resolveTiles({ style, apiKey, fallbackStyle });
  return {
    provide: NGX_MAP_CONFIG,
    useValue: {
      ...DEFAULT_NGX_MAP_CONFIG,
      ...config,
      ...tiles,
      categories: { ...DEFAULT_NGX_MAP_CONFIG.categories, ...config.categories },
    } satisfies NgxMapConfig,
  };
}
