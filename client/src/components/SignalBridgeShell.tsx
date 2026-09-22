import * as React from "react";
import { ReactNode, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Accessibility, Bell, ClipboardCheck, CloudRain, FileCheck2, Gauge, MapPinned, Menu, RadioTower, Settings, ShieldCheck, Users, Wifi, WifiOff, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoPoint, IMPORTANT_ROADS, SAFE_REFERENCE_AREAS, SHELTERS, WARNING_ZONES } from "@shared/geoshield";

const navGroups = [
  { label: "Command", items: [{ href: "/dashboard", label: "Emergency dashboard", icon: Gauge }, { href: "/alerts", label: "Alert center", icon: Bell }, { href: "/risk-map", label: "Risk map", icon: MapPinned }] },
  { label: "Response", items: [{ href: "/action-plans", label: "Action plans", icon: ClipboardCheck }, { href: "/evidence", label: "Evidence center", icon: FileCheck2 }, { href: "/citizen", label: "Citizen intelligence", icon: Users }] },
  { label: "Personal", items: [{ href: "/profile", label: "Emergency profile", icon: ShieldCheck }, { href: "/accessibility", label: "AccessBridge", icon: Accessibility }, { href: "/safety", label: "Safety status", icon: RadioTower }, { href: "/offline", label: "Offline mode", icon: WifiOff }] },
];

export function SignalBridgeShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const activeLabel = navGroups.flatMap(group => group.items).find(item => item.href === location)?.label ?? "Emergency dashboard";
  return (
    <div className="min-h-screen bg-[#f4f7f9] text-[#152536]">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[246px] flex-col border-r border-[#d8e1e8] bg-[#0d1b2a] px-4 py-5 text-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-2"><Link href="/" className="sb-focus flex items-center gap-3 rounded-lg"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7ee2de] text-xs font-bold text-[#0d1b2a]">SB</span><span className="font-display text-base font-bold tracking-[-.03em]">SIGNAL<span className="text-[#7ee2de]">BRIDGE</span></span></Link><button className="sb-focus rounded-lg p-2 text-[#9cb5bf] hover:bg-[#173448] lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
        <div className="mt-8 flex items-center gap-2 rounded-lg border border-[#315365] bg-[#153449] px-3 py-2.5"><span className="h-2 w-2 rounded-full bg-[#7ee2de] shadow-[0_0_0_4px_rgba(126,226,222,.12)]" /><div><div className="font-mono text-[9px] uppercase tracking-[.17em] text-[#7ee2de]">Active environment</div><div className="mt-0.5 text-xs font-medium text-[#d5e4e8]">Chennai / flood demo</div></div></div>
        <nav className="sb-scroll mt-8 flex-1 overflow-y-auto pr-1">{navGroups.map(group => <div key={group.label} className="mb-7"><div className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[.18em] text-[#6e8996]">{group.label}</div><div className="space-y-1">{group.items.map(item => { const Icon = item.icon; const active = location === item.href; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`sb-focus flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-[#1c5264] font-semibold text-white shadow-[inset_3px_0_0_#7ee2de]" : "text-[#9cb5bf] hover:bg-[#153449] hover:text-white"}`}><Icon size={17} strokeWidth={active ? 2.2 : 1.8} /><span>{item.label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#7ee2de]" />}</Link> })}</div></div>)}</nav>
        <div className="rounded-xl border border-[#284b5b] bg-[#122b3b] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-[#d5e4e8]"><Wifi size={14} className="text-[#7ee2de]" /> Connection stable</div><div className="mt-1.5 text-[11px] leading-4 text-[#86a1ad]">Last sync 06:32 IST · Data is simulated</div></div>
        <Link href="/settings" onClick={() => setMobileOpen(false)} className="sb-focus mt-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#9cb5bf] transition hover:bg-[#153449] hover:text-white"><Settings size={17} /> Settings</Link>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-40 bg-[#07131f]/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}
      <div className="lg:pl-[246px]"><header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#d8e1e8] bg-[#f4f7f9]/95 px-5 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button className="sb-focus rounded-lg border border-[#cbd9df] bg-white p-2 text-[#27445b] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={18} /></button><div><div className="font-mono text-[10px] uppercase tracking-[.15em] text-[#81919a]">SignalBridge / {activeLabel}</div><div className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-[#27445b]"><span className="h-1.5 w-1.5 rounded-full bg-[#2e8b70]" /> Monitoring active</div></div></div><div className="flex items-center gap-3 text-xs text-[#71818b]"><Link href="/accessibility" className="sb-focus inline-flex items-center gap-1.5 rounded-full border border-[#2e8b91] bg-[#d9f1f0] px-2.5 py-1.5 font-semibold text-[#0d5960] hover:bg-[#c7e9e8]"><Accessibility size={14} /> Emergency access</Link><div className="hidden items-center gap-3 sm:flex"><span className="font-mono">22 SEP 2026 · 06:32 IST</span><span className="h-4 w-px bg-[#cbd9df]" /><span className="flex items-center gap-1.5"><CloudRain size={14} className="text-[#2e8b91]" /> Urban flooding</span></div></div></header><main>{children}</main></div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-5 border-b border-[#d8e1e8] pb-7 md:flex-row md:items-end"><div><div className="font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#2e8b91]">{eyebrow}</div><h1 className="mt-2 font-display text-3xl font-semibold tracking-[-.045em] text-[#0d1b2a] md:text-[38px]">{title}</h1><p className="mt-2 max-w-[720px] text-sm leading-6 text-[#5c6d79]">{description}</p></div>{action}</div>;
}

export function DemoLabel({ children = "Demo simulation" }: { children?: ReactNode }) { return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ead9ae] bg-[#fff8e8] px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[.11em] text-[#86601d]"><span className="h-1.5 w-1.5 rounded-full bg-[#dd9c30]" />{children}</span>; }
export function StatusPill({ tone = "amber", children }: { tone?: "amber" | "red" | "green" | "cyan" | "slate"; children: ReactNode }) { const styles = { amber: "bg-[#fff2d4] text-[#7d5411]", red: "bg-[#fde5e3] text-[#8d3636]", green: "bg-[#daf0e8] text-[#21684f]", cyan: "bg-[#d9f1f0] text-[#0d5960]", slate: "bg-[#e8eef4] text-[#27445b]" }; return <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[.08em] ${styles[tone]}`}>{children}</span>; }
export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) { return <div className="mb-4 flex items-center justify-between gap-3"><div>{eyebrow && <div className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#84949d]">{eyebrow}</div>}<h2 className="font-display text-lg font-semibold tracking-[-.025em] text-[#0d1b2a]">{title}</h2></div>{action}</div>; }
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`rounded-xl border border-[#d8e1e8] bg-white shadow-[0_8px_24px_rgba(37,62,76,.045)] ${className}`}>{children}</section>; }
export function ProgressBar({ value, color = "#38b8bd" }: { value: number; color?: string }) { return <div className="h-2 overflow-hidden rounded-full bg-[#e7eef1]"><div className="h-full rounded-full transition-all duration-300" style={{ width: `${value}%`, background: color }} /></div>; }

export function SignalMap({ compact = false, selectedPoint, onSelectPoint }: { compact?: boolean; selectedPoint?: GeoPoint; onSelectPoint?: (point: GeoPoint) => void }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const selectedMarkerRef = useRef<L.CircleMarker | null>(null);
  const onSelectPointRef = useRef(onSelectPoint);
  onSelectPointRef.current = onSelectPoint;

  useEffect(() => {
    if (!mapRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true, minZoom: 11, maxZoom: 16 }).setView([13.105, 80.235], compact ? 11.6 : 12.5);
    mapInstanceRef.current = map;
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap contributors" }).addTo(map);
    WARNING_ZONES.forEach(zone => {
      const polygon = zone.points.map(point => [point.lat, point.lng] as [number, number]);
      L.polygon(polygon, { color: zone.severity === "action" ? "#c75252" : "#dd9c30", fillColor: zone.severity === "action" ? "#c75252" : "#dd9c30", fillOpacity: .18, weight: 2 }).addTo(map).bindTooltip(`${zone.name} · ${zone.severity.toUpperCase()}`, { direction: "top", opacity: .95 });
    });
    IMPORTANT_ROADS.forEach(road => L.polyline(road.points.map(point => [point.lat, point.lng] as [number, number]), { color: road.id === "road-2" ? "#c75252" : "#2e8b91", weight: road.id === "road-2" ? 4 : 3, dashArray: road.id === "road-2" ? "3 6" : "8 8", opacity: .9 }).addTo(map).bindTooltip(`${road.name} · ${road.status}`, { direction: "top" }));
    SHELTERS.forEach(shelter => L.circleMarker([shelter.point.lat, shelter.point.lng], { radius: 6, color: "#fff", weight: 2, fillColor: "#2e8b70", fillOpacity: 1 }).addTo(map).bindTooltip(`${shelter.name} · ${shelter.status}`, { direction: "top" }));
    SAFE_REFERENCE_AREAS.forEach(area => L.circleMarker([area.point.lat, area.point.lng], { radius: 5, color: "#fff", weight: 2, fillColor: "#5c6d79", fillOpacity: 1 }).addTo(map).bindTooltip(`${area.name} · reference only`, { direction: "top" }));
    map.on("click", event => onSelectPointRef.current?.({ lat: Number(event.latlng.lat.toFixed(5)), lng: Number(event.latlng.lng.toFixed(5)) }));
    return () => { map.remove(); mapInstanceRef.current = null; selectedMarkerRef.current = null; };
  }, [compact]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPoint) return;
    selectedMarkerRef.current?.remove();
    selectedMarkerRef.current = L.circleMarker([selectedPoint.lat, selectedPoint.lng], { radius: 9, color: "#0d3448", weight: 3, fillColor: "#7ee2de", fillOpacity: 1 }).addTo(mapInstanceRef.current).bindTooltip("Selected user location", { direction: "top", permanent: false });
  }, [selectedPoint]);

  return <div className={`relative overflow-hidden rounded-xl border border-[#cbd9df] bg-[#dfeaec] ${compact ? "h-[230px]" : "h-[480px]"}`}><div ref={mapRef} className="h-full w-full cursor-crosshair" /><div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/70 bg-white/95 px-3 py-2 shadow-sm"><div className="font-mono text-[9px] font-semibold uppercase tracking-[.14em] text-[#27445b]">OpenStreetMap · GeoShield</div><div className="mt-1 text-[11px] text-[#71818b]">Click anywhere to assess this location</div></div></div>;
}
