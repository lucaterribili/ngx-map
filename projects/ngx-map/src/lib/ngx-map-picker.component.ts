import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import type { Marker } from 'leaflet';
import { NGX_MAP_CONFIG } from './config';
import { loadLeaflet } from './leaflet-loader';
import { createBaseMap, createMarkerIcon } from './map-core';
import { NGX_MAP_STYLES } from './map-styles';
import { LatLngTuple } from './models';

/** Selettore di posizione: marker trascinabile, o click sulla mappa. Uso: `<ngx-map-picker [(position)]="pos" />`. */
@Component({
  selector: 'ngx-map-picker',
  template: `<div #container class="ngx-map-container"></div>`,
  styles: [NGX_MAP_STYLES],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxMapPicker {
  private readonly config = inject(NGX_MAP_CONFIG);

  readonly position = model.required<LatLngTuple>();
  readonly zoom = input<number>(14);
  readonly color = input<string>('#E11D48');

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly ready = signal(false);
  private marker?: Marker;
  private map?: import('leaflet').Map;
  private dispose?: () => void;
  private destroyed = false;

  constructor() {
    afterNextRender(() => void this.init());
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.dispose?.();
    });

    // Se `position` cambia dall'esterno, il marker e la vista lo seguono.
    effect(() => {
      const pos = this.position();
      if (!this.ready() || !this.marker || !this.map) return;
      const current = this.marker.getLatLng();
      if (current.lat !== pos[0] || current.lng !== pos[1]) {
        this.marker.setLatLng(pos);
        this.map.panTo(pos);
      }
    });
  }

  private async init(): Promise<void> {
    const L = await loadLeaflet();
    if (this.destroyed) return;
    const start = this.position();
    const { map, dispose } = createBaseMap(L, this.container().nativeElement, this.config, start, this.zoom());
    this.map = map;
    this.dispose = dispose;

    const marker = L.marker(start, { draggable: true, icon: createMarkerIcon(L, this.color()) }).addTo(map);
    marker.on('dragend', () => this.commit(marker.getLatLng()));
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      this.commit(e.latlng);
    });
    this.marker = marker;
    this.ready.set(true);
  }

  private commit(p: { lat: number; lng: number }): void {
    this.position.set([p.lat, p.lng]);
  }
}
