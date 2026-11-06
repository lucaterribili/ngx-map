import { NgxMapConfig } from './config';
import { Leaflet } from './leaflet-loader';
import { LatLngTuple, MapCategory, MapMarker } from './models';

export function resolveCategory(config: NgxMapConfig, key?: string): MapCategory {
  return (key && config.categories[key.toLowerCase()]) || config.categories[key ?? ''] || config.defaultCategory;
}

/** Marker a goccia disegnato con un DivIcon: non servono gli asset immagine di Leaflet. */
export function createMarkerIcon(L: Leaflet, color: string): import('leaflet').DivIcon {
  const el = document.createElement('div');
  el.className = 'ngx-map-pin';
  el.style.background = color;
  return L.divIcon({ className: 'ngx-map-marker', html: el, iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -26] });
}

/** Popup di default. Il testo è inserito con `textContent`, quindi non può iniettare HTML. */
export function createDefaultPopup(marker: MapMarker, category: MapCategory): HTMLElement {
  const root = document.createElement('div');
  root.className = 'ngx-map-popup';
  const add = (tag: string, cls: string, text?: string): HTMLElement | null => {
    if (!text) return null;
    const el = document.createElement(tag);
    el.className = cls;
    el.textContent = text;
    root.appendChild(el);
    return el;
  };
  const badge = add('span', 'ngx-map-popup__badge', category.label);
  if (badge) badge.style.background = category.color;
  add('h3', 'ngx-map-popup__title', marker.title);
  add('p', 'ngx-map-popup__description', marker.description);
  add('p', 'ngx-map-popup__address', marker.address);
  return root;
}

/** Crea la mappa base con tile layer e la tiene dimensionata col suo contenitore. */
export function createBaseMap(
  L: Leaflet,
  el: HTMLElement,
  config: NgxMapConfig,
  center: LatLngTuple,
  zoom: number,
): { map: import('leaflet').Map; dispose: () => void } {
  const map = L.map(el).setView(center, zoom);
  L.tileLayer(config.tileUrl, {
    ...config.tileOptions,
    attribution: config.attribution,
    minZoom: config.minZoom,
    maxZoom: config.maxZoom,
  }).addTo(map);

  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => map.invalidateSize()) : undefined;
  observer?.observe(el);

  return {
    map,
    dispose: () => {
      observer?.disconnect();
      map.remove();
    },
  };
}
