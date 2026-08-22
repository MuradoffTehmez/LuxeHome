"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type PropertyMapProps = {
  latitude: number;
  longitude: number;
  title: string;
  className?: string;
};

/**
 * Tək əmlakın yerini göstərən statik xəritə.
 *
 * Leaflet server tərəfdə `window` axtarır, ona görə yalnız client komponentdə
 * dinamik idxal olunur. OpenStreetMap tile-ları açar tələb etmir.
 */
export function PropertyMap({ latitude, longitude, title, className }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Default marker ikonları bundler-də yanlış yol axtarır — açıq şəkildə təyin edilir
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker([latitude, longitude], { icon }).addTo(map).bindPopup(title);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, title]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`${title} xəritədə`}
      className={className}
    />
  );
}
