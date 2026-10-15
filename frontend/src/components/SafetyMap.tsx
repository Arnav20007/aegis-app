import { useState, useEffect, useCallback, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { WifiOff, LocateFixed, ExternalLink, Compass, Wifi } from "lucide-react";

// Fix Leaflet default icon paths (broken in Vite/Webpack builds)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface GpsCoords {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

interface SafetyMapProps {
  isEmergencyActive: boolean;
  onLocationUpdate?: (coords: GpsCoords) => void;
  trackingActive?: boolean;
}

// Custom pulsing red user marker
function createUserIcon(isEmergency: boolean) {
  const color = isEmergency ? "#EF4444" : "#3B82F6";
  const pulse = isEmergency ? `
    <style>
      @keyframes sosPulse {
        0%,100%{transform:scale(1);opacity:1}
        50%{transform:scale(1.5);opacity:0.4}
      }
    </style>` : "";
  const html = `
    ${pulse}
    <div style="position:relative;width:22px;height:22px">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:${color};opacity:0.25;
        ${isEmergency ? "animation:sosPulse 1.2s ease-in-out infinite;" : ""}
        transform:scale(2);
      "></div>
      <div style="
        position:absolute;inset:3px;border-radius:50%;
        background:${color};
        border:2.5px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
      "></div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [22, 22], iconAnchor: [11, 11] });
}

function createPoiIcon(color: string, label: string) {
  const html = `<div style="
    background:${color};color:white;border-radius:6px;
    padding:2px 6px;font-size:10px;font-weight:700;
    white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);
    border:1px solid rgba(255,255,255,0.3);
  ">${label}</div>`;
  return L.divIcon({ html, className: "", iconAnchor: [0, 0] });
}

export default function SafetyMap({ isEmergencyActive, onLocationUpdate, trackingActive = false }: SafetyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const pathPolylineRef = useRef<L.Polyline | null>(null);
  const pathPointsRef = useRef<L.LatLng[]>([]);
  const hasFollowedOnce = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  const [gps, setGps] = useState<GpsCoords | null>(() => {
    try {
      const cached = localStorage.getItem("aegis_last_known_gps");
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "acquiring" | "live" | "cached" | "error">(
    () => {
      try {
        return localStorage.getItem("aegis_last_known_gps") ? "cached" : "idle";
      } catch { return "idle"; }
    }
  );
  const [relocating, setRelocating] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [followUser, setFollowUser] = useState(true);

  // Online/offline detection
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ── Initialize Leaflet map ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initLat = gps?.lat ?? 25.4358;
    const initLng = gps?.lng ?? 81.8463;

    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // OpenStreetMap tile layer (Humanitarian style)
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Compact attribution
    L.control.attribution({ prefix: false, position: "bottomleft" }).addTo(map);

    // Zoom control top-left
    L.control.zoom({ position: "topleft" }).addTo(map);

    // Detect manual pan/zoom → stop auto-follow
    map.on("dragstart", () => setFollowUser(false));

    mapRef.current = map;

    // Add nearby POI markers
    const pois = [
      { lat: initLat + 0.008, lng: initLng + 0.005, color: "#22C55E", label: "🚔 Police" },
      { lat: initLat - 0.006, lng: initLng + 0.009, color: "#F59E0B", label: "🏥 Hospital" },
      { lat: initLat + 0.004, lng: initLng - 0.007, color: "#22C55E", label: "🚔 PCR" },
    ];
    pois.forEach(p => {
      L.marker([p.lat, p.lng], { icon: createPoiIcon(p.color, p.label) }).addTo(map);
    });

    // Draw initial user marker if we have cached GPS
    if (gps) {
      const marker = L.marker([gps.lat, gps.lng], { icon: createUserIcon(isEmergencyActive), zIndexOffset: 1000 }).addTo(map);
      marker.bindPopup(`<b>📍 You (Cached)</b><br/>±${gps.accuracy}m`);
      userMarkerRef.current = marker;

      const circle = L.circle([gps.lat, gps.lng], {
        radius: gps.accuracy,
        color: "#3B82F6",
        fillColor: "#3B82F6",
        fillOpacity: 0.08,
        weight: 1,
      }).addTo(map);
      accuracyCircleRef.current = circle;

      const polyline = L.polyline([[gps.lat, gps.lng]], {
        color: "#EF4444",
        weight: 3,
        opacity: 0.7,
        dashArray: "6, 4",
      }).addTo(map);
      pathPolylineRef.current = polyline;
      pathPointsRef.current = [L.latLng(gps.lat, gps.lng)];
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update user marker icon when emergency status changes ─────────────────
  useEffect(() => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setIcon(createUserIcon(isEmergencyActive));
    }
  }, [isEmergencyActive]);

  // ── Update map when GPS changes ──────────────────────────────────────────
  const updateMap = useCallback((coords: GpsCoords) => {
    const map = mapRef.current;
    if (!map) return;

    const latlng = L.latLng(coords.lat, coords.lng);

    // Create or move user marker
    if (!userMarkerRef.current) {
      const marker = L.marker(latlng, { icon: createUserIcon(isEmergencyActive), zIndexOffset: 1000 }).addTo(map);
      marker.bindPopup(`<b>📍 You (Live)</b><br/>±${coords.accuracy}m accuracy`);
      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLatLng(latlng);
      userMarkerRef.current.setIcon(createUserIcon(isEmergencyActive));
      userMarkerRef.current.getPopup()?.setContent(`<b>📍 You (Live)</b><br/>±${coords.accuracy}m accuracy`);
    }

    // Accuracy circle
    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle(latlng, {
        radius: coords.accuracy,
        color: "#3B82F6",
        fillColor: "#3B82F6",
        fillOpacity: 0.08,
        weight: 1,
      }).addTo(map);
    } else {
      accuracyCircleRef.current.setLatLng(latlng);
      accuracyCircleRef.current.setRadius(coords.accuracy);
    }

    // Path trail (keep last 80 points)
    const newPt = latlng;
    pathPointsRef.current = [...pathPointsRef.current.slice(-79), newPt];
    if (!pathPolylineRef.current) {
      pathPolylineRef.current = L.polyline(pathPointsRef.current, {
        color: "#EF4444", weight: 3, opacity: 0.7, dashArray: "6, 4",
      }).addTo(map);
    } else {
      pathPolylineRef.current.setLatLngs(pathPointsRef.current);
    }

    // Auto-follow: pan map smoothly to user
    if (followUser || !hasFollowedOnce.current) {
      map.panTo(latlng, { animate: true, duration: 0.5 });
      hasFollowedOnce.current = true;
    }
  }, [isEmergencyActive, followUser]);

  // ── GPS position handler ──────────────────────────────────────────────────
  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const coords: GpsCoords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: Math.round(pos.coords.accuracy),
      speed: pos.coords.speed,
      heading: pos.coords.heading,
      timestamp: pos.timestamp,
    };
    setGps(coords);
    setGpsStatus("live");
    setGpsError(null);
    try {
      localStorage.setItem("aegis_last_known_gps", JSON.stringify(coords));
    } catch {}
    updateMap(coords);
    onLocationUpdate?.(coords);
  }, [onLocationUpdate, updateMap]);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setGpsStatus(prev => (prev === "live" || prev === "cached") ? "cached" : "error");
    if (err.code === 1) setGpsError("Location permission denied.");
    else if (err.code === 2) setGpsError("GPS unavailable — using cached fix.");
    else setGpsError("GPS timeout — using last known position.");
  }, []);

  // ── Start / stop watchPosition ────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported.");
      setGpsStatus("error");
      return;
    }

    if (trackingActive) {
      setGpsStatus(prev => prev === "cached" ? "cached" : "acquiring");
      watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      });
    } else {
      // One-shot position for dashboard mini-map
      navigator.geolocation.getCurrentPosition(handlePosition, () => {}, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 20000,
      });
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [trackingActive, handlePosition, handleError]);

  // ── Relocate: snap map back to user & re-enable follow ───────────────────
  const handleRelocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setRelocating(true);
    setFollowUser(true);
    navigator.geolocation.getCurrentPosition(
      pos => { handlePosition(pos); setRelocating(false); },
      err => { handleError(err); setRelocating(false); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [handlePosition, handleError]);

  const speedKmh = gps?.speed != null ? (gps.speed * 3.6).toFixed(1) : null;
  const externalMapUrl = gps
    ? `https://www.openstreetmap.org/?mlat=${gps.lat.toFixed(5)}&mlon=${gps.lng.toFixed(5)}#map=16/${gps.lat.toFixed(5)}/${gps.lng.toFixed(5)}`
    : "https://www.openstreetmap.org/";

  const statusColor = isEmergencyActive
    ? "#EF4444"
    : gpsStatus === "live" ? "#22C55E"
    : gpsStatus === "cached" ? "#F59E0B"
    : gpsStatus === "acquiring" ? "#F59E0B"
    : "#64748B";

  const statusLabel = isEmergencyActive
    ? "🚨 EMERGENCY BROADCAST"
    : gpsStatus === "live" ? "🛰️ GPS LIVE (HIGH-ACC)"
    : gpsStatus === "cached" ? "📦 OFFLINE CACHED FIX"
    : gpsStatus === "acquiring" ? "⏳ ACQUIRING SATELLITE..."
    : "⚡ STANDBY";

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", borderRadius: "8px", overflow: "hidden" }}>
      {/* Leaflet map container */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Emergency red border overlay */}
      {isEmergencyActive && (
        <div style={{
          position: "absolute", inset: 0,
          border: "3px solid #EF4444",
          pointerEvents: "none",
          boxShadow: "inset 0 0 50px rgba(239,68,68,0.3)",
          borderRadius: "8px",
          animation: "emergencyPulse 1.5s ease-in-out infinite"
        }} />
      )}

      {/* Offline banner */}
      {!isOnline && (
        <div style={{
          position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(30,41,59,0.95)", backdropFilter: "blur(4px)",
          border: "1px solid rgba(239,68,68,0.5)", color: "white",
          padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
          display: "flex", alignItems: "center", gap: "8px", zIndex: 1000,
          boxShadow: "0 4px 14px rgba(0,0,0,0.4)"
        }}>
          <WifiOff size={13} color="#EF4444" />
          Offline — Last Known GPS Active
        </div>
      )}

      {/* Top-left GPS status badge */}
      <div style={{ position: "absolute", top: "12px", left: "52px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{
          background: `${statusColor}22`,
          border: `1px solid ${statusColor}55`,
          color: statusColor,
          padding: "5px 12px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "700",
          display: "flex", alignItems: "center", gap: "6px",
          backdropFilter: "blur(6px)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
        }}>
          <span style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: statusColor, display: "inline-block",
            animation: (gpsStatus === "live" || gpsStatus === "acquiring") ? "pulse 1.5s infinite" : "none"
          }} />
          {statusLabel}
        </div>

        {/* GPS info panel (tracking mode) */}
        {trackingActive && gps && (
          <div style={{
            background: "rgba(15,23,42,0.88)", backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", padding: "10px 13px",
            display: "flex", flexDirection: "column", gap: "5px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
          }}>
            <div style={{ fontSize: "11px", color: "#94A3B8", display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <span style={{ color: "#22C55E", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                <Wifi size={10} />±{gps.accuracy}m
              </span>
              {speedKmh && (
                <span style={{ color: "#60A5FA", fontWeight: "600" }}>{speedKmh} km/h</span>
              )}
              {gps.heading != null && (
                <span style={{ color: "#A78BFA", fontWeight: "600", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Compass size={10} />{Math.round(gps.heading)}°
                </span>
              )}
            </div>
            <div style={{ fontSize: "11px", color: "#E2E8F0", fontWeight: "500" }}>
              📍 {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
            </div>
            <div style={{ fontSize: "10px", color: "#64748B" }}>
              {isOnline ? "🛰️ Live Satellite" : "📦 Cached Sector"} • {new Date(gps.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Top-right controls */}
      <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 1000, display: "flex", gap: "6px", alignItems: "center" }}>
        {/* Re-center / follow toggle */}
        <button
          onClick={() => { setFollowUser(true); handleRelocate(); }}
          disabled={relocating}
          title={followUser ? "Following your position" : "Click to re-center on you"}
          style={{
            background: followUser ? "#3B82F6" : "rgba(15,23,42,0.88)",
            border: `1px solid ${followUser ? "#3B82F6" : "rgba(255,255,255,0.15)"}`,
            color: "white",
            borderRadius: "10px",
            padding: "7px 13px",
            fontSize: "12px", fontWeight: "600",
            cursor: relocating ? "wait" : "pointer",
            display: "flex", alignItems: "center", gap: "6px",
            backdropFilter: "blur(6px)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            transition: "all 0.15s ease"
          }}
        >
          <LocateFixed size={13} style={{ animation: relocating ? "spin 1s linear infinite" : "none" }} />
          {relocating ? "Locating..." : followUser ? "Following" : "Re-center"}
        </button>

        {/* Open in OSM */}
        <a
          href={externalMapUrl} target="_blank" rel="noopener noreferrer"
          title="Open in OpenStreetMap"
          style={{
            background: "rgba(15,23,42,0.88)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#94A3B8", borderRadius: "10px", padding: "7px 10px",
            display: "flex", alignItems: "center", textDecoration: "none",
            backdropFilter: "blur(6px)", boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
          }}
        >
          <ExternalLink size={13} />
        </a>
      </div>

      {/* GPS error */}
      {gpsError && (
        <div style={{
          position: "absolute", bottom: "14px", left: "12px", zIndex: 1000,
          background: "rgba(239,68,68,0.9)", color: "white",
          padding: "7px 13px", borderRadius: "10px", fontSize: "11.5px", fontWeight: "600",
          display: "flex", alignItems: "center", gap: "8px",
          boxShadow: "0 4px 14px rgba(239,68,68,0.4)", maxWidth: "260px"
        }}>
          <WifiOff size={13} /> {gpsError}
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: "14px", right: "12px", zIndex: 1000,
        background: "rgba(15,23,42,0.88)", backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px", padding: "9px 13px",
        display: "flex", flexDirection: "column", gap: "5px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.3)"
      }}>
        {[
          { color: "#3B82F6", label: "You (Live)" },
          { color: "#22C55E", label: "Police Station" },
          { color: "#F59E0B", label: "Hospital" },
          { color: "#EF4444", label: "Path Trail" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "10.5px", color: "#94A3B8" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%,100%{opacity:1} 50%{opacity:0.35}
        }
        @keyframes spin {
          from{transform:rotate(0deg)} to{transform:rotate(360deg)}
        }
        @keyframes emergencyPulse {
          0%,100%{box-shadow:inset 0 0 50px rgba(239,68,68,0.3)}
          50%{box-shadow:inset 0 0 80px rgba(239,68,68,0.6)}
        }
        .leaflet-container {
          font-family: inherit;
          background: var(--bg-primary, #0f172a);
        }
        .leaflet-tile-pane {
          filter: var(--map-filter, none);
        }
      `}</style>
    </div>
  );
}
