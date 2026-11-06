/** Coordinate nel formato [latitudine, longitudine]. */
export type LatLngTuple = [lat: number, lng: number];

export interface MapCategory {
  /** Colore del marker (qualsiasi valore CSS valido). */
  color: string;
  /** Etichetta mostrata nel popup di default. */
  label: string;
}

export interface MapMarker<T = unknown> {
  id: string | number;
  lat: number;
  lng: number;
  title?: string;
  /** Chiave in `NgxMapConfig.categories`; determina colore ed etichetta. */
  category?: string;
  description?: string;
  address?: string;
  /** Payload libero, restituito negli eventi e nel template del popup. */
  data?: T;
}

export interface MapPolyline {
  points: LatLngTuple[];
  color?: string;
  weight?: number;
  opacity?: number;
}

/** Contesto del template popup: `<ng-template #popup let-marker>`. */
export interface MapPopupContext<T = unknown> {
  $implicit: MapMarker<T>;
  marker: MapMarker<T>;
}
