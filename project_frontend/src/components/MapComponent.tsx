import { useState, useEffect, useRef } from 'react';

/**
 * Super-Robust Vanilla Map Component
 * This version uses standard, non-React Leaflet to ensure 
 * zero compatibility issues with libraries.
 */

interface MapProps {
  startPos: [number, number] | null;
  endPos: [number, number] | null;
  routeGeometry: [number, number][] | null;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function MapComponent({ startPos, endPos, routeGeometry, onMapClick }: MapProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ start: any; end: any; route: any }>({ start: null, end: null, route: null });

  // 1. Initial Map Setup
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      try {
        // Load CSS and Leaflet dynamically
        if (!document.getElementById('leaflet-css-vanilla')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css-vanilla';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        const L = (await import('leaflet')).default;

        if (!isMounted || !mapContainerRef.current) return;

        // Create Map Instance
        const map = L.map(mapContainerRef.current, {
           center: [20.5937, 78.9629],
           zoom: 5,
           zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OSM'
        }).addTo(map);

        // Map Click Event
        map.on('click', (e: any) => {
           if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        setIsInitializing(false);
      } catch (err: any) {
        console.error("Map initialization failed:", err);
        setError("Could not load mapping engine. Please check your internet connection.");
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Update Markers and Polylines when Props Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    import('leaflet').then((mod) => {
      const L = mod.default;

      // Handle Start Marker
      if (markersRef.current.start) map.removeLayer(markersRef.current.start);
      if (startPos) {
        const startIcon = L.icon({
           iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
           iconSize: [25, 41], iconAnchor: [12, 41]
        });
        markersRef.current.start = L.marker(startPos, { icon: startIcon }).addTo(map).bindPopup("Start Point");
      }

      // Handle End Marker
      if (markersRef.current.end) map.removeLayer(markersRef.current.end);
      if (endPos) {
        const endIcon = L.icon({
           iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
           iconSize: [25, 41], iconAnchor: [12, 41]
        });
        markersRef.current.end = L.marker(endPos, { icon: endIcon }).addTo(map).bindPopup("Destination");
      }

      // Handle Polyline (Route)
      if (markersRef.current.route) map.removeLayer(markersRef.current.route);
      if (routeGeometry && routeGeometry.length > 0) {
        markersRef.current.route = L.polyline(routeGeometry, { color: '#3b82f6', weight: 5 }).addTo(map);
      }

      // Fit Bounds
      if (startPos && endPos) {
         map.fitBounds(L.latLngBounds([startPos, endPos]), { padding: [50, 50] });
      } else if (startPos) {
         map.setView(startPos, 14);
      } else if (endPos) {
         map.setView(endPos, 14);
      }
    });
  }, [startPos, endPos, routeGeometry]);

  if (error) {
    return (
       <div className="w-full h-80 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center text-red-600 p-6 text-center italic">
          {error}
       </div>
    );
  }

  return (
    <div className="w-full h-80 min-h-[320px] rounded-xl overflow-hidden border border-gray-300 shadow-sm relative bg-slate-50">
      {isInitializing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Map...</p>
        </div>
      )}
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} id="vanilla-map" />
    </div>
  );
}
