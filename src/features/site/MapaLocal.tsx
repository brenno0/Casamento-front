import { useEffect, useRef } from 'react';

/** Mapa OpenStreetMap (Leaflet, sem chave de API). Carregado sob demanda. */
export function MapaLocal({ latitude, longitude, nome }: { latitude: number; longitude: number; nome: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let mapa: { remove: () => void } | undefined;
    let cancelado = false;
    void (async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
        if (cancelado) return;
        const m = L.map(el, { scrollWheelZoom: false }).setView([latitude, longitude], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(m);
        // Marcador em círculo: dispensa as imagens de ícone do Leaflet.
        L.circleMarker([latitude, longitude], { radius: 10, color: '#9c6466', fillColor: '#c48b8b', fillOpacity: 0.9 })
          .addTo(m)
          .bindTooltip(nome);
        mapa = m;
      } catch {
        // Sem mapa (ex.: ambiente sem suporte); os botões de navegação continuam.
      }
    })();
    return () => {
      cancelado = true;
      mapa?.remove();
    };
  }, [latitude, longitude, nome]);

  return <div ref={ref} role="img" aria-label={`Mapa: ${nome}`} className="mt-3 h-56 w-full overflow-hidden rounded-card" />;
}
