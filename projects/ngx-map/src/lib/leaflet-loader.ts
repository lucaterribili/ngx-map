export type Leaflet = typeof import('leaflet');

let leafletPromise: Promise<Leaflet> | undefined;
let routingPromise: Promise<void> | undefined;

/** Carica Leaflet una sola volta, solo quando serve (mai su server). */
export function loadLeaflet(): Promise<Leaflet> {
  return (leafletPromise ??= import('leaflet').then(
    (m) => ((m as unknown as { default?: Leaflet }).default ?? m) as Leaflet,
  ));
}

/** Carica il plugin opzionale `leaflet-routing-machine` e ne restituisce il namespace. */
export async function loadRouting(L: Leaflet): Promise<any> {
  routingPromise ??= import('leaflet-routing-machine').then(() => undefined);
  await routingPromise;
  return (L as any).Routing ?? (globalThis as any).L?.Routing;
}
