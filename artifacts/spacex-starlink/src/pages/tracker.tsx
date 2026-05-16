import React, { useEffect, useRef, useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Satellite, Wifi, Globe, Activity, RefreshCw, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TLERecord {
  name: string;
  line1: string;
  line2: string;
}

interface SatPosition {
  name: string;
  lat: number;
  lon: number;
  alt: number; // km
  speed: number; // km/s
}

// ─── Minimal SGP4 / Keplerian propagation ────────────────────────────────────
// Simplified circular orbit propagation from TLE elements (accurate enough for viz)

function parseTLE(lines: string[]): TLERecord[] {
  const records: TLERecord[] = [];
  for (let i = 0; i < lines.length - 2; i += 3) {
    const name = lines[i].trim();
    const line1 = lines[i + 1].trim();
    const line2 = lines[i + 2].trim();
    if (line1.startsWith("1 ") && line2.startsWith("2 ")) {
      records.push({ name, line1, line2 });
    }
  }
  return records;
}

function propagate(tle: TLERecord, now: Date): SatPosition | null {
  try {
    const l1 = tle.line1;
    const l2 = tle.line2;

    // Parse epoch from line 1
    const epochYear2 = parseInt(l1.substring(18, 20));
    const epochDay = parseFloat(l1.substring(20, 32));
    const fullYear = epochYear2 < 57 ? 2000 + epochYear2 : 1900 + epochYear2;
    const epochDate = new Date(Date.UTC(fullYear, 0, 1));
    epochDate.setUTCDate(epochDate.getUTCDate() + Math.floor(epochDay) - 1);
    const fracDay = epochDay - Math.floor(epochDay);
    epochDate.setUTCHours(
      Math.floor(fracDay * 24),
      Math.floor((fracDay * 24 * 60) % 60),
      Math.floor((fracDay * 24 * 3600) % 60),
    );

    // Parse line 2 orbital elements
    const inclinationDeg = parseFloat(l2.substring(8, 16));
    const raanDeg = parseFloat(l2.substring(17, 25));
    const eccStr = l2.substring(26, 33);
    const eccentricity = parseFloat("0." + eccStr);
    const argPerigeeDeg = parseFloat(l2.substring(34, 42));
    const meanAnomalyDeg = parseFloat(l2.substring(43, 51));
    const meanMotionRevDay = parseFloat(l2.substring(52, 63));

    const GM = 398600.4418; // km^3/s^2
    const Re = 6371.0; // km

    // Mean motion in rad/s
    const n = (meanMotionRevDay * 2 * Math.PI) / 86400;
    // Semi-major axis (km)
    const a = Math.cbrt(GM / (n * n));
    const alt = a - Re;
    // Orbital speed (km/s)
    const speed = Math.sqrt(GM / a);

    // Time since epoch (seconds)
    const dt = (now.getTime() - epochDate.getTime()) / 1000;

    // Convert to radians
    const inc = (inclinationDeg * Math.PI) / 180;
    const raan = (raanDeg * Math.PI) / 180;
    const argPerigee = (argPerigeeDeg * Math.PI) / 180;
    let M = ((meanAnomalyDeg + (meanMotionRevDay * 360 * dt) / 86400) * Math.PI) / 180;
    M = M % (2 * Math.PI);

    // Solve Kepler's equation (3 iterations Newton-Raphson)
    let E = M;
    for (let k = 0; k < 3; k++) {
      E = E - (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E));
    }
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const nu = Math.atan2(
      Math.sqrt(1 - eccentricity * eccentricity) * sinE,
      cosE - eccentricity,
    );

    // Argument of latitude
    const u = argPerigee + nu;

    // Position in orbital plane
    const r = a * (1 - eccentricity * cosE);
    const xOrb = r * Math.cos(u);
    const yOrb = r * Math.sin(u);

    // ECI coordinates
    const cosRaan = Math.cos(raan);
    const sinRaan = Math.sin(raan);
    const cosInc = Math.cos(inc);
    const sinInc = Math.sin(inc);

    const xEci = cosRaan * xOrb - sinRaan * cosInc * yOrb;
    const yEci = sinRaan * xOrb + cosRaan * cosInc * yOrb;
    const zEci = sinInc * yOrb;

    // GMST (Greenwich Mean Sidereal Time)
    const J2000 = 2451545.0;
    const jd = now.getTime() / 86400000 + 2440587.5;
    const T = (jd - J2000) / 36525;
    let gmst =
      280.46061837 +
      360.98564736629 * (jd - J2000) +
      0.000387933 * T * T -
      (T * T * T) / 38710000;
    gmst = ((gmst % 360) * Math.PI) / 180;

    // ECEF
    const xEcef = xEci * Math.cos(-gmst) - yEci * Math.sin(-gmst);
    const yEcef = xEci * Math.sin(-gmst) + yEci * Math.cos(-gmst);
    const zEcef = zEci;

    // Geodetic
    const lon = (Math.atan2(yEcef, xEcef) * 180) / Math.PI;
    const lat = (Math.atan2(zEcef, Math.sqrt(xEcef * xEcef + yEcef * yEcef)) * 180) / Math.PI;

    return { name: tle.name, lat, lon, alt: Math.round(alt), speed: Math.round(speed * 10) / 10 };
  } catch {
    return null;
  }
}

// ─── Canvas Renderer ─────────────────────────────────────────────────────────

function drawMap(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  satellites: SatPosition[],
  hovered: number | null,
) {
  ctx.clearRect(0, 0, w, h);

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "#010810");
  bgGrad.addColorStop(1, "#000508");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = "rgba(0,212,255,0.08)";
  ctx.lineWidth = 0.5;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Equator highlight
  ctx.strokeStyle = "rgba(0,212,255,0.15)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  const eqY = h / 2;
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(w, eqY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tropics
  ctx.strokeStyle = "rgba(0,212,255,0.07)";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 6]);
  [-23.5, 23.5].forEach((lat) => {
    const y = ((90 - lat) / 180) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Labels
  ctx.fillStyle = "rgba(0,212,255,0.3)";
  ctx.font = "9px 'Space Grotesk', sans-serif";
  ctx.textAlign = "left";
  [-60, -30, 0, 30, 60].forEach((lat) => {
    const y = ((90 - lat) / 180) * h;
    ctx.fillText(`${lat}°`, 4, y - 2);
  });
  ctx.textAlign = "center";
  [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].forEach((lon) => {
    const x = ((lon + 180) / 360) * w;
    ctx.fillText(`${lon}°`, x, h - 4);
  });

  // Satellite dots
  satellites.forEach((sat, idx) => {
    const x = ((sat.lon + 180) / 360) * w;
    const y = ((90 - sat.lat) / 180) * h;
    const isHovered = idx === hovered;
    const r = isHovered ? 5 : 2.5;

    if (isHovered) {
      // Glow ring
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 20);
      glow.addColorStop(0, "rgba(0,212,255,0.4)");
      glow.addColorStop(1, "rgba(0,212,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Dot
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = isHovered ? "#00d4ff" : "rgba(0,212,255,0.7)";
    ctx.fill();

    if (isHovered) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tooltip
      const label = sat.name.replace("STARLINK-", "SL-");
      const tw = ctx.measureText(label).width + 16;
      const tx = Math.min(x + 10, w - tw - 4);
      const ty = y - 28;
      ctx.fillStyle = "rgba(0,8,20,0.92)";
      ctx.strokeStyle = "rgba(0,212,255,0.5)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tw, 20, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#00d4ff";
      ctx.font = "bold 9px 'Space Grotesk', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(label, tx + 8, ty + 13);
    }
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];
const TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle";
const MAX_SATS = 300;
const REFRESH_MS = 2000;

export default function Tracker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const [tles, setTles] = useState<TLERecord[]>([]);
  const [positions, setPositions] = useState<SatPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selected, setSelected] = useState<SatPosition | null>(null);
  const posRef = useRef<SatPosition[]>([]);
  posRef.current = positions;

  // Fetch TLE data
  const fetchTLEs = useCallback(async () => {
    setLoading(true);
    setError(null);
    for (const proxy of CORS_PROXIES) {
      try {
        const res = await fetch(proxy(TLE_URL), { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const text = await res.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const records = parseTLE(lines).slice(0, MAX_SATS);
        if (records.length > 0) {
          setTles(records);
          setLoading(false);
          return;
        }
      } catch {
        // try next proxy
      }
    }
    // Fallback: generate demo data
    setError("Live data unavailable — showing simulated orbits");
    setTles(generateDemoTLEs());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTLEs();
  }, [fetchTLEs]);

  // Propagate positions
  useEffect(() => {
    if (tles.length === 0) return;
    const tick = () => {
      const now = new Date();
      const pos = tles.map((t) => propagate(t, now)).filter(Boolean) as SatPosition[];
      setPositions(pos);
      setLastUpdate(now);
    };
    tick();
    const id = setInterval(tick, REFRESH_MS);
    return () => clearInterval(id);
  }, [tles]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const render = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) drawMap(ctx, canvas.width, canvas.height, posRef.current, hovered);
      animRef.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [hovered]);

  // Mouse hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || positions.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const w = canvas.width;
      const h = canvas.height;
      let closest: number | null = null;
      let minD = 20;
      positions.forEach((sat, idx) => {
        const x = ((sat.lon + 180) / 360) * w;
        const y = ((90 - sat.lat) / 180) * h;
        const d = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
        if (d < minD) {
          minD = d;
          closest = idx;
        }
      });
      setHovered(closest);
    },
    [positions],
  );

  const handleClick = useCallback(() => {
    if (hovered !== null) setSelected(positions[hovered] ?? null);
  }, [hovered, positions]);

  const avgAlt = positions.length
    ? Math.round(positions.reduce((s, p) => s + p.alt, 0) / positions.length)
    : 0;
  const avgSpeed = positions.length
    ? Math.round((positions.reduce((s, p) => s + p.speed, 0) / positions.length) * 10) / 10
    : 0;

  return (
    <MainLayout>
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <div className="border-b border-white/8 bg-black/80 backdrop-blur-md px-6 py-4">
          <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Satellite className="w-5 h-5 text-primary" />
                <h1 className="text-sm font-black uppercase tracking-widest text-white">
                  Live Satellite Tracker
                </h1>
                <span className="text-[10px] bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Real-time Starlink constellation positions — updated every {REFRESH_MS / 1000}s
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <StatBadge icon={<Satellite className="w-3.5 h-3.5" />} label="Tracked" value={`${positions.length}`} />
              <StatBadge icon={<Globe className="w-3.5 h-3.5" />} label="Avg Altitude" value={`${avgAlt} km`} />
              <StatBadge icon={<Wifi className="w-3.5 h-3.5" />} label="Avg Speed" value={`${avgSpeed} km/s`} />
              <StatBadge
                icon={<Activity className="w-3.5 h-3.5" />}
                label="Updated"
                value={lastUpdate ? lastUpdate.toLocaleTimeString() : "—"}
              />
              <button
                onClick={fetchTLEs}
                disabled={loading}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-primary transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-2 text-xs text-yellow-400 text-center flex items-center justify-center gap-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Map area */}
        <div className="flex-1 relative" ref={containerRef} style={{ minHeight: 420 }}>
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-primary/50 animate-ping" style={{ animationDelay: "0.3s" }} />
                <Satellite className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
              </div>
              <p className="text-xs text-primary font-bold uppercase tracking-widest">Fetching orbital data...</p>
              <p className="text-xs text-gray-600 mt-1">Connecting to CelesTrak</p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHovered(null)}
            onClick={handleClick}
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-xs space-y-1.5">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Legend</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary/70 shrink-0" />
              <span className="text-gray-400">Starlink satellite</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0 ring-1 ring-white" />
              <span className="text-gray-400">Hovered / selected</span>
            </div>
            <div className="text-gray-600 text-[10px] mt-2">Click satellite to inspect</div>
          </div>

          {/* Selected satellite panel */}
          {selected && (
            <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-md border border-primary/30 rounded-lg p-4 w-56 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest font-black text-primary">Satellite Info</span>
                <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white text-xs">✕</button>
              </div>
              <p className="text-white font-black text-sm uppercase tracking-tight mb-3">{selected.name}</p>
              <div className="space-y-2">
                <InfoRow label="Latitude" value={`${selected.lat.toFixed(2)}°`} />
                <InfoRow label="Longitude" value={`${selected.lon.toFixed(2)}°`} />
                <InfoRow label="Altitude" value={`${selected.alt} km`} />
                <InfoRow label="Orbital Speed" value={`${selected.speed} km/s`} />
              </div>
            </div>
          )}
        </div>

        {/* Footer bar */}
        <div className="border-t border-white/5 bg-black px-6 py-3 text-[10px] text-gray-600 flex flex-wrap gap-4 items-center justify-between">
          <span>TLE data source: <span className="text-gray-500">CelesTrak (celestrak.org)</span></span>
          <span>Propagation: <span className="text-gray-500">Simplified Keplerian (circular approximation)</span></span>
          <span>Positions refresh every <span className="text-gray-500">{REFRESH_MS / 1000}s</span></span>
        </div>
      </div>
    </MainLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-primary">{icon}</span>
      <span className="text-gray-600 uppercase tracking-widest font-bold text-[10px]">{label}:</span>
      <span className="text-white font-black tabular-nums">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500 text-[10px] uppercase tracking-widest">{label}</span>
      <span className="text-white text-xs font-bold tabular-nums">{value}</span>
    </div>
  );
}

// ─── Demo TLE generator (fallback) ───────────────────────────────────────────

function generateDemoTLEs(): TLERecord[] {
  const demo: TLERecord[] = [];
  const now = new Date();
  const epochYear = String(now.getUTCFullYear()).slice(2);
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayOfYear = (now.getTime() - startOfYear.getTime()) / 86400000 + 1;
  const epochDay = dayOfYear.toFixed(8).padStart(12, " ");

  for (let i = 0; i < 200; i++) {
    const id = String(i + 1000).padStart(5, "0");
    const inc = (53 + Math.random() * 10).toFixed(4).padStart(8, " ");
    const raan = (Math.random() * 360).toFixed(4).padStart(8, " ");
    const ecc = "0000001";
    const argP = (Math.random() * 360).toFixed(4).padStart(8, " ");
    const M = (Math.random() * 360).toFixed(4).padStart(8, " ");
    // ~550 km altitude → mean motion ≈ 15.05 rev/day
    const mm = (15.05 + (Math.random() - 0.5) * 0.1).toFixed(8).padStart(11, " ");

    demo.push({
      name: `STARLINK-${1000 + i}`,
      line1: `1 ${id}U 20001A   ${epochYear}${epochDay}  .00000000  00000-0  00000-0 0  9990`,
      line2: `2 ${id} ${inc} ${raan} ${ecc} ${argP} ${M}${mm}000000`,
    });
  }
  return demo;
}
