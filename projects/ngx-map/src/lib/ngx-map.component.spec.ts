import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NgxMap } from './ngx-map.component';
import { NgxMapPicker } from './ngx-map-picker.component';
import { LatLngTuple, MapMarker } from './models';

const settle = async (f: { detectChanges(): void; whenStable(): Promise<unknown> }) => {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 20));
    f.detectChanges();
    await f.whenStable();
  }
};

@Component({
  imports: [NgxMap],
  template: `<ngx-map style="height:300px" [markers]="markers()">
    <ng-template #popup let-marker><b class="tpl">{{ marker.title }}</b></ng-template>
  </ngx-map>`,
})
class Host {
  markers = signal<MapMarker[]>([
    { id: 1, lat: 41.7, lng: 12.2, title: 'A' },
    { id: 2, lat: 41.8, lng: 12.3, title: '<i>B</i>' },
  ]);
}

@Component({ imports: [NgxMapPicker], template: `<ngx-map-picker [(position)]="pos" />` })
class PickerHost {
  pos = signal<LatLngTuple>([41.7, 12.2]);
}

describe('NgxMap', () => {
  it('disegna i marker, aggiorna e rende il popup del template con escape', async () => {
    const f = TestBed.createComponent(Host);
    await settle(f);
    const root: HTMLElement = f.nativeElement;
    expect(root.querySelectorAll('.ngx-map-marker').length).toBe(2);

    f.componentInstance.markers.set([{ id: 3, lat: 41.9, lng: 12.5, title: '<i>B</i>' }]);
    await settle(f);
    expect(root.querySelectorAll('.ngx-map-marker').length).toBe(1);

    (root.querySelector('.ngx-map-marker') as HTMLElement).click();
    await settle(f);
    const tpl = root.querySelector('.tpl')!;
    expect(tpl.textContent).toBe('<i>B</i>');
    expect(tpl.querySelector('i')).toBeNull();
    f.destroy();
  });
});

@Component({
  imports: [NgxMap],
  template: `<ngx-map style="height:300px" [markers]="markers()" [polylines]="lines()" (markerClick)="clicked.set($event)" />`,
})
class PlainHost {
  markers = signal<MapMarker[]>([]);
  lines = signal<{ points: LatLngTuple[] }[]>([]);
  clicked = signal<MapMarker | null>(null);
}

describe('NgxMap (plain)', () => {
  it('ignora i marker con coordinate non valide senza rompere gli altri', async () => {
    const f = TestBed.createComponent(PlainHost);
    f.componentInstance.markers.set([
      { id: 1, lat: 41.7, lng: 12.2 },
      { id: 2, lat: NaN, lng: 12.2 },
      { id: 3, lat: null as unknown as number, lng: 12.2 },
    ]);
    await settle(f);
    expect(f.nativeElement.querySelectorAll('.ngx-map-marker').length).toBe(1);
    f.destroy();
  });

  it('emette markerClick con il marker cliccato', async () => {
    const f = TestBed.createComponent(PlainHost);
    f.componentInstance.markers.set([{ id: 7, lat: 41.7, lng: 12.2, title: 'X' }]);
    await settle(f);
    (f.nativeElement.querySelector('.ngx-map-marker') as HTMLElement).click();
    await settle(f);
    expect(f.componentInstance.clicked()?.id).toBe(7);
    f.destroy();
  });

  it('disegna le polilinee e scarta quelle con meno di due punti', async () => {
    const f = TestBed.createComponent(PlainHost);
    f.componentInstance.lines.set([{ points: [[41.7, 12.2], [41.8, 12.3]] }, { points: [[41.7, 12.2]] }]);
    await settle(f);
    expect(f.nativeElement.querySelectorAll('path.leaflet-interactive').length).toBe(1);
    f.destroy();
  });

  it('senza marker non genera errori', async () => {
    const f = TestBed.createComponent(PlainHost);
    await settle(f);
    expect(f.nativeElement.querySelectorAll('.ngx-map-marker').length).toBe(0);
    f.destroy();
  });
});

describe('NgxMapPicker', () => {
  it('mostra il marker e segue position', async () => {
    const f = TestBed.createComponent(PickerHost);
    await settle(f);
    expect(f.nativeElement.querySelectorAll('.ngx-map-marker').length).toBe(1);
    f.componentInstance.pos.set([42, 13]);
    await settle(f);
    expect(f.nativeElement.querySelectorAll('.ngx-map-marker').length).toBe(1);
    f.destroy();
  });
});
