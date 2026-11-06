import { describe, expect, it } from 'vitest';
import { DEFAULT_NGX_MAP_CONFIG, provideMap } from './config';
import { createDefaultPopup, resolveCategory } from './map-core';

describe('provideMap', () => {
  it('unisce le categorie ai default e sostituisce il resto', () => {
    const p = provideMap({ zoom: 10, categories: { bar: { color: '#000', label: 'Bar' } } }) as any;
    expect(p.useValue.zoom).toBe(10);
    expect(p.useValue.tileUrl).toBe(DEFAULT_NGX_MAP_CONFIG.tileUrl);
    expect(p.useValue.categories['bar'].label).toBe('Bar');
  });
});

describe('provideMap style', () => {
  it('aggiunge la apiKey come parametro query', () => {
    const p = provideMap({ style: 'carto-voyager', apiKey: 'abc' }) as any;
    expect(p.useValue.tileUrl).toBe('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=abc');
  });
  it('senza apiKey usa lo stile così com\'è se la chiave è facoltativa', () => {
    const p = provideMap({ style: 'carto-light' }) as any;
    expect(p.useValue.tileUrl).toBe('https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png');
  });
  it('ricade su OSM se lo stile richiede la chiave e manca', () => {
    const p = provideMap({ style: 'stadia-smooth' }) as any;
    expect(p.useValue.tileUrl).toBe(DEFAULT_NGX_MAP_CONFIG.tileUrl);
  });
  it('accetta uno stile personalizzato', () => {
    const p = provideMap({ style: { url: 'https://t.example/{z}/{x}/{y}.png', attribution: 'X', keyParam: 'k' }, apiKey: '1' }) as any;
    expect(p.useValue.tileUrl).toBe('https://t.example/{z}/{x}/{y}.png?k=1');
  });
});

describe('resolveCategory', () => {
  const cfg = provideMap({ categories: { beach: { color: '#0ea5e9', label: 'Spiaggia' } } }) as any;
  it('è case-insensitive e ricade sul default', () => {
    expect(resolveCategory(cfg.useValue, 'BEACH').label).toBe('Spiaggia');
    expect(resolveCategory(cfg.useValue, 'boh')).toBe(cfg.useValue.defaultCategory);
    expect(resolveCategory(cfg.useValue)).toBe(cfg.useValue.defaultCategory);
  });
});

describe('createDefaultPopup', () => {
  it('non interpreta HTML nei testi', () => {
    const el = createDefaultPopup(
      { id: 1, lat: 0, lng: 0, title: '<img src=x onerror=alert(1)>', address: '<b>via</b>' },
      { color: '#000', label: 'X' },
    );
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('b')).toBeNull();
    expect(el.querySelector('h3')!.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('loadRouting', () => {
  it('rende disponibile il namespace Routing del plugin', async () => {
    const { loadLeaflet, loadRouting } = await import('./leaflet-loader');
    const Routing = await loadRouting(await loadLeaflet());
    expect(typeof Routing.control).toBe('function');
    expect(typeof Routing.osrmv1).toBe('function');
  });
});
