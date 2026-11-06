# Changelog

## 1.0.1

- Fix: la mappa finiva sopra header e menu sticky/fixed dell'app durante lo scroll (i pannelli di Leaflet hanno `z-index` fino a 1000). `ngx-map` e `ngx-map-picker` ora creano un proprio stacking context (`isolation: isolate`).

## 1.0.0

Prima versione stabile.

- `<ngx-map>`: marker tipizzati con categorie, popup di default o `ng-template`, polilinee, percorsi stradali (`leaflet-routing-machine`, opzionale), `fitBounds`, eventi `markerClick`, `mapClick`, `mapReady`.
- `<ngx-map-picker>`: selettore di posizione con `[(position)]`.
- `provideMap`: configurazione dal progetto: `style` + `apiKey` (stili `osm`, `carto-voyager`, `carto-light`, `carto-dark`, `stadia-smooth` o personalizzato, con ripiego se manca la chiave), `tileUrl`/`attribution`, `tileOptions`, `categories`, centro e zoom.
- Marker con coordinate non valide ignorati (con un warning) invece di rompere la mappa.
- Leaflet caricato in modo lazy solo nel browser: compatibile con SSR.

## 0.1.0

Versione interna iniziale.
