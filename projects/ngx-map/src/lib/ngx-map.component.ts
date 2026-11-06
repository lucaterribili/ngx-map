import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EmbeddedViewRef,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { LayerGroup, Map as LMap } from 'leaflet';
import { NGX_MAP_CONFIG } from './config';
import { Leaflet, loadLeaflet, loadRouting } from './leaflet-loader';
import { createBaseMap, createDefaultPopup, createMarkerIcon, resolveCategory } from './map-core';
import { NGX_MAP_STYLES } from './map-styles';
import { LatLngTuple, MapMarker, MapPolyline, MapPopupContext } from './models';

@Component({
  selector: 'ngx-map',
  template: `<div #container class="ngx-map-container"></div>`,
  styles: [NGX_MAP_STYLES],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxMap {
  private readonly config = inject(NGX_MAP_CONFIG);
  private readonly appRef = inject(ApplicationRef);

  readonly center = input<LatLngTuple>(this.config.center);
  readonly zoom = input<number>(this.config.zoom);
  readonly markers = input<MapMarker[]>([]);
  readonly polylines = input<MapPolyline[]>([]);
  /** Se true, la vista si adatta ai marker ogni volta che cambiano. */
  readonly fitBounds = input<boolean>(true);
  /** Waypoint di un percorso stradale (richiede `leaflet-routing-machine`). */
  readonly route = input<LatLngTuple[] | null>(null);
  readonly routeColor = input<string>('#E11D48');
  /** URL di un servizio OSRM; se omesso usa il server demo del plugin. */
  readonly routerUrl = input<string | undefined>(undefined);

  readonly markerClick = output<MapMarker>();
  readonly mapClick = output<LatLngTuple>();
  /** Emesso quando la mappa Leaflet è pronta, per usi avanzati. */
  readonly mapReady = output<LMap>();

  /** Template popup personalizzato: `<ng-template #popup let-marker>…</ng-template>`. */
  readonly popupTemplate = contentChild<TemplateRef<MapPopupContext>>('popup');
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');

  private readonly map = signal<LMap | null>(null);
  private L?: Leaflet;
  private markerLayer?: LayerGroup;
  private lineLayer?: LayerGroup;
  private routingControl?: any;
  private routeRun = 0;
  private popupViews = new Map<string | number, EmbeddedViewRef<MapPopupContext>>();
  private dispose?: () => void;
  private destroyed = false;

  constructor() {
    // afterNextRender gira solo nel browser: nessun controllo di piattaforma necessario.
    afterNextRender(() => void this.init());
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.closeAllPopups();
      this.dispose?.();
      this.map.set(null);
    });

    effect(() => {
      const map = this.map();
      if (map) map.setView(this.center(), this.zoom());
    });
    effect(() => this.syncMarkers(this.map(), this.markers(), this.fitBounds()));
    effect(() => this.syncPolylines(this.map(), this.polylines()));
    effect(() => void this.syncRoute(this.map(), this.route(), this.routeColor(), this.routerUrl()));
  }

  private async init(): Promise<void> {
    const L = await loadLeaflet();
    if (this.destroyed) return;
    this.L = L;
    const { map, dispose } = createBaseMap(L, this.container().nativeElement, this.config, this.center(), this.zoom());
    this.dispose = dispose;
    this.markerLayer = L.layerGroup().addTo(map);
    this.lineLayer = L.layerGroup().addTo(map);
    map.on('click', (e) => this.mapClick.emit([e.latlng.lat, e.latlng.lng]));
    this.map.set(map);
    this.mapReady.emit(map);
  }

  private syncMarkers(map: LMap | null, markers: MapMarker[], fit: boolean): void {
    const L = this.L;
    if (!map || !L || !this.markerLayer) return;
    this.closeAllPopups();
    this.markerLayer.clearLayers();

    // Coordinate mancanti o non numeriche (dati sporchi dal backend) non devono rompere la mappa intera.
    const valid = markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
    if (valid.length !== markers.length) {
      console.warn(`[ngx-map] ${markers.length - valid.length} marker con coordinate non valide ignorati.`);
    }

    for (const m of valid) {
      const category = resolveCategory(this.config, m.category);
      const marker = L.marker([m.lat, m.lng], { icon: createMarkerIcon(L, category.color) });
      marker.on('click', () => this.markerClick.emit(m));
      if (this.popupTemplate() || m.title) {
        marker.bindPopup(() => this.buildPopup(m, category));
        marker.on('popupclose', () => this.closePopup(m.id));
      }
      marker.addTo(this.markerLayer);
    }

    if (fit && valid.length) {
      map.fitBounds(L.latLngBounds(valid.map((m) => [m.lat, m.lng] as LatLngTuple)), { maxZoom: this.zoom() });
    }
  }

  private buildPopup(m: MapMarker, category: ReturnType<typeof resolveCategory>): HTMLElement {
    const tpl = this.popupTemplate();
    if (!tpl) return createDefaultPopup(m, category);
    this.closePopup(m.id);
    // Angular fa l'escape dei binding del template: niente HTML costruito a stringhe.
    const view = tpl.createEmbeddedView({ $implicit: m, marker: m });
    this.appRef.attachView(view);
    view.detectChanges();
    this.popupViews.set(m.id, view);
    const host = document.createElement('div');
    view.rootNodes.forEach((n) => host.appendChild(n));
    return host;
  }

  private closePopup(id: string | number): void {
    const view = this.popupViews.get(id);
    if (!view) return;
    this.appRef.detachView(view);
    view.destroy();
    this.popupViews.delete(id);
  }

  private closeAllPopups(): void {
    for (const id of [...this.popupViews.keys()]) this.closePopup(id);
  }

  private syncPolylines(map: LMap | null, lines: MapPolyline[]): void {
    const L = this.L;
    if (!map || !L || !this.lineLayer) return;
    this.lineLayer.clearLayers();
    for (const line of lines) {
      if (line.points.length < 2) continue;
      L.polyline(line.points, {
        color: line.color ?? '#E11D48',
        weight: line.weight ?? 4,
        opacity: line.opacity ?? 0.7,
      }).addTo(this.lineLayer);
    }
  }

  private async syncRoute(
    map: LMap | null,
    waypoints: LatLngTuple[] | null,
    color: string,
    routerUrl: string | undefined,
  ): Promise<void> {
    const L = this.L;
    if (!map || !L) return;
    const run = ++this.routeRun;
    if (this.routingControl) {
      map.removeControl(this.routingControl);
      this.routingControl = undefined;
    }
    if (!waypoints || waypoints.length < 2) return;

    const Routing = await loadRouting(L);
    // Un aggiornamento successivo o la distruzione hanno la precedenza.
    if (this.destroyed || run !== this.routeRun) return;

    this.routingControl = Routing.control({
      waypoints: waypoints.map(([lat, lng]) => L.latLng(lat, lng)),
      router: routerUrl ? Routing.osrmv1({ serviceUrl: routerUrl }) : undefined,
      lineOptions: { styles: [{ color, weight: 4, opacity: 0.7 }] },
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      createMarker: () => null,
    }).addTo(map);
  }
}
