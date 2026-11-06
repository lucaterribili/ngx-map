# @lucaterribili/ngx-map

Componenti Angular standalone per mappe, costruiti su [Leaflet](https://leafletjs.com).

- `<ngx-map>`: marker tipizzati con categorie, popup di default o `ng-template`, polilinee, percorsi stradali
- `<ngx-map-picker>`: selettore di posizione con `[(position)]`
- Stile dei tile deciso dall'app (`style` + `apiKey`), con ripiego se manca la chiave
- Signals, `OnPush`, SSR-safe (Leaflet si carica lazy, solo nel browser)
- Marker disegnati in CSS: niente asset immagine da copiare in `angular.json`

Richiede Angular 21 e Leaflet 1.9.

## Installazione

```bash
npm i @lucaterribili/ngx-map leaflet
# opzionale, solo per i percorsi stradali:
npm i leaflet-routing-machine
```

Aggiungi il CSS di Leaflet in `angular.json` → `styles`:

```json
"node_modules/leaflet/dist/leaflet.css"
```

## Configurazione (facoltativa)

```ts
// app.config.ts
provideMap({
  style: 'carto-voyager',
  apiKey: environment.cartoKey,
  center: [41.73, 12.27],
  zoom: 13,
  categories: { beach: { color: '#0ea5e9', label: 'Spiaggia' } },
});
```

Senza `provideMap` si usano i default: tile OpenStreetMap, centro su Roma.

| Opzione | Descrizione |
|---|---|
| `style` | Nome di uno stile incluso, oppure uno stile personalizzato `{ url, attribution, keyParam?, keyRequired?, options? }` |
| `apiKey` | Chiave del provider dei tile, aggiunta all'URL come parametro query (`keyParam`) |
| `fallbackStyle` | Stile usato se `style` richiede la chiave e manca (default `osm`, con un warning in console) |
| `tileUrl`, `attribution`, `tileOptions` | Alternativa manuale a `style`: nessun ripiego né chiave |
| `center`, `zoom`, `minZoom`, `maxZoom` | Vista iniziale e limiti |
| `categories` | `Record<string, { color, label }>`: colore e etichetta dei marker per `category` |
| `defaultCategory` | Categoria per i marker senza `category` o con chiave sconosciuta |

Stili inclusi (`MAP_STYLES`): `osm` (default), `carto-voyager`, `carto-light`, `carto-dark`, `stadia-smooth` (richiede la chiave).
Con i provider a chiave opzionale (Carto) `apiKey` si può omettere. Il tile server di default (OpenStreetMap) è soggetto alla
[tile usage policy](https://operations.osmfoundation.org/policies/tiles/): per traffico reale usa un provider tuo.

## `<ngx-map>`

```html
<ngx-map style="height: 400px" [markers]="markers" (markerClick)="open($event)">
  <ng-template #popup let-marker>
    <strong>{{ marker.title }}</strong>
    <a [routerLink]="['/place', marker.id]">Dettagli</a>
  </ng-template>
</ngx-map>
```

```ts
markers: MapMarker[] = [{ id: 1, lat: 41.73, lng: 12.27, title: 'Lido', category: 'beach' }];
```

| Input | Tipo | Default | |
|---|---|---|---|
| `markers` | `MapMarker[]` | `[]` | Marker con coordinate non valide vengono ignorati (warning in console) |
| `polylines` | `MapPolyline[]` | `[]` | Linee con meno di 2 punti sono scartate |
| `route` | `LatLngTuple[] \| null` | `null` | Waypoint di un percorso stradale (serve `leaflet-routing-machine`) |
| `routeColor` | `string` | `#E11D48` | |
| `routerUrl` | `string` | — | Servizio OSRM; senza, il plugin usa il server demo, **non adatto alla produzione** |
| `center`, `zoom` | | da config | |
| `fitBounds` | `boolean` | `true` | Adatta la vista ai marker ogni volta che cambiano |

| Output | |
|---|---|
| `markerClick` | `MapMarker` cliccato |
| `mapClick` | `LatLngTuple` del punto cliccato |
| `mapReady` | istanza Leaflet `Map`, per usi avanzati |

`MapMarker<T>`: `{ id, lat, lng, title?, category?, description?, address?, data?: T }`. `data` è un payload libero,
disponibile negli eventi e nel template del popup. Il popup di default inserisce i testi come testo, non come HTML.

## `<ngx-map-picker>`

```html
<ngx-map-picker style="height: 300px" [(position)]="position" />
```

```ts
position: LatLngTuple = [41.73, 12.27];
```

Marker trascinabile, oppure click sulla mappa. Se `position` cambia da fuori, marker e vista lo seguono.
Input facoltativi: `zoom` (14), `color`.

## Note

- Il contenitore deve avere un'altezza (`<ngx-map style="height: 400px">`).
- Con SSR non serve altro: Leaflet viene importato solo nel browser.
- Per esporre il colore dei marker usa `categories`; i marker sono disegnati in CSS.

## Licenza

MIT
