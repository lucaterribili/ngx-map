export const NGX_MAP_STYLES = `
/* isolation: i pannelli di Leaflet hanno z-index fino a 1000 e non devono finire sopra header o menu dell'app */
ngx-map, ngx-map-picker { display: block; isolation: isolate; }
.ngx-map-container { width: 100%; height: 100%; min-height: 200px; }
.ngx-map-marker { background: none; border: 0; }
.ngx-map-pin {
  width: 28px; height: 28px; box-sizing: border-box;
  border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
  border: 3px solid #fff; box-shadow: 0 3px 8px rgba(0, 0, 0, .4);
}
.ngx-map-popup { min-width: 150px; font-family: system-ui, sans-serif; }
.ngx-map-popup__badge {
  display: inline-block; padding: 2px 8px; margin-bottom: 8px;
  border-radius: 4px; font-size: 10px; font-weight: 600; color: #fff;
}
.ngx-map-popup__title { margin: 0 0 4px; font-size: 14px; font-weight: 600; }
.ngx-map-popup__description { margin: 0 0 4px; font-size: 12px; color: #666; }
.ngx-map-popup__address { margin: 0; font-size: 11px; color: #888; }
`;
