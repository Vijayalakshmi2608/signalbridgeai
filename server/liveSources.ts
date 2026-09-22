import { ENV } from "./_core/env";
import type { GeoPoint } from "@shared/geoshield";

const OFFICIAL_HOSTS = ["imd.gov.in", "mausam.imd.gov.in", "api.imd.gov.in", "ndma.gov.in", "sachet.ndma.gov.in", "chennaicorporation.gov.in"];
const isOfficialHost = (url: string) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return OFFICIAL_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
  } catch { return false; }
};
const fetchWithTimeout = async (url: string, init: RequestInit = {}, timeoutMs = 6000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); }
};
const cleanXml = (value: string) => value.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const xmlValue = (block: string, tag: string) => { const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i")); return match ? cleanXml(match[1]) : ""; };

export async function fetchOfficialWarnings() {
  const configured = Boolean(ENV.liveWarningFeedUrl);
  const base = { provider: ENV.liveWarningFeedName, feedType: ENV.liveWarningFeedType, configured, verified: false, status: configured ? "checking" : "unconfigured", sourceUrl: ENV.liveWarningFeedUrl || "https://sachet.ndma.gov.in/CapFeed", warnings: [] as Array<{ alertId: string; title: string; source: string; sourceStatus: "official" | "connected" | "simulated"; issuedAt: string; validUntil: string | null; warningText: string; link: string | null }> };
  if (!configured) return { ...base, status: "unconfigured" as const, message: "No live official feed URL is configured. Demo warnings remain active and are labeled simulated." };
  if (!isOfficialHost(ENV.liveWarningFeedUrl)) return { ...base, status: "rejected" as const, message: "Feed rejected: the configured host is not on the verified government-domain allowlist." };
  try {
    const response = await fetchWithTimeout(ENV.liveWarningFeedUrl, { headers: { Accept: "application/rss+xml, application/xml, text/xml" } });
    if (!response.ok) return { ...base, status: "error" as const, message: `Official feed returned HTTP ${response.status}. Demo warnings remain active.` };
    const xml = await response.text();
    const blocks = Array.from(xml.matchAll(/<(?:item|entry)[^>]*>[\s\S]*?<\/(?:item|entry)>/gi)).map(match => match[0]).slice(0, 20);
    const warnings = blocks.map((block, index) => ({ alertId: xmlValue(block, "guid") || `LIVE-${index + 1}`, title: xmlValue(block, "title") || "Official warning", source: ENV.liveWarningFeedName, sourceStatus: "official" as const, issuedAt: xmlValue(block, "pubDate") || xmlValue(block, "updated") || new Date().toISOString(), validUntil: null, warningText: xmlValue(block, "description") || "Official warning content available in source feed.", link: xmlValue(block, "link") || null }));
    return { ...base, status: "connected" as const, verified: true, warnings, message: warnings.length ? `Connected to verified official feed; ${warnings.length} records received.` : "Verified official feed responded but contained no alert records." };
  } catch (error) {
    return { ...base, status: "error" as const, message: `Official feed request failed safely (${error instanceof Error ? error.name : "unknown error"}). Demo warnings remain active.` };
  }
}

export async function geocodeLocation(query: string) {
  const encoded = encodeURIComponent(query.trim());
  if (!encoded) throw new Error("A location is required");
  const url = `${ENV.geocoderUrl}?q=${encoded}&format=jsonv2&limit=1`;
  try {
    const response = await fetchWithTimeout(url, { headers: { Accept: "application/json", "User-Agent": "SignalBridge/1.0 emergency-intelligence-demo" } });
    if (!response.ok) throw new Error(`Geocoder returned HTTP ${response.status}`);
    const rows = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
    const first = rows[0];
    if (!first) return { status: "not_found" as const, query, result: null, source: ENV.geocoderUrl };
    return { status: "connected" as const, query, result: { lat: Number(first.lat), lng: Number(first.lon), label: first.display_name }, source: ENV.geocoderUrl };
  } catch (error) {
    return { status: "error" as const, query, result: null, source: ENV.geocoderUrl, message: error instanceof Error ? error.message : "Geocoder unavailable" };
  }
}

export async function routeDistance(from: GeoPoint, to: GeoPoint) {
  const url = `${ENV.routerUrl}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false&steps=false`;
  try {
    const response = await fetchWithTimeout(url, { headers: { Accept: "application/json", "User-Agent": "SignalBridge/1.0 emergency-intelligence-demo" } });
    if (!response.ok) throw new Error(`Router returned HTTP ${response.status}`);
    const data = await response.json() as { code?: string; routes?: Array<{ distance: number; duration: number }> };
    const route = data.routes?.[0];
    if (!route) return { status: "not_found" as const, distanceKm: null, durationMinutes: null, source: ENV.routerUrl };
    return { status: "connected" as const, distanceKm: Number((route.distance / 1000).toFixed(2)), durationMinutes: Math.round(route.duration / 60), source: ENV.routerUrl };
  } catch (error) {
    return { status: "error" as const, distanceKm: null, durationMinutes: null, source: ENV.routerUrl, message: error instanceof Error ? error.message : "Router unavailable" };
  }
}

export async function shelterAvailability(shelter: { name: string; capacity: number; availableSpaces: number; status: string }) {
  if (!ENV.shelterAvailabilityUrl) return { status: "demo" as const, shelter, source: "SignalBridge demo shelter registry", message: "No live shelter-capacity service is configured." };
  if (!isOfficialHost(ENV.shelterAvailabilityUrl)) return { status: "rejected" as const, shelter, source: ENV.shelterAvailabilityUrl, message: "Shelter service rejected: host is not on the verified government-domain allowlist." };
  try {
    const response = await fetchWithTimeout(`${ENV.shelterAvailabilityUrl}?name=${encodeURIComponent(shelter.name)}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Shelter service returned HTTP ${response.status}`);
    const live = await response.json();
    return { status: "connected" as const, shelter: live, source: ENV.shelterAvailabilityUrl };
  } catch (error) {
    return { status: "error" as const, shelter, source: ENV.shelterAvailabilityUrl, message: error instanceof Error ? error.message : "Shelter service unavailable" };
  }
}

export function liveIntegrationStatus() {
  return {
    officialWarnings: { configured: Boolean(ENV.liveWarningFeedUrl), provider: ENV.liveWarningFeedName, feedType: ENV.liveWarningFeedType, verification: ENV.liveWarningFeedUrl ? (isOfficialHost(ENV.liveWarningFeedUrl) ? "allowlisted host; connection checked on request" : "rejected host") : "not configured" },
    geocoder: { configured: Boolean(ENV.geocoderUrl), provider: ENV.geocoderUrl, verification: "public endpoint; response status shown per request" },
    routing: { configured: Boolean(ENV.routerUrl), provider: ENV.routerUrl, verification: "public endpoint; response status shown per request" },
    shelters: { configured: Boolean(ENV.shelterAvailabilityUrl), provider: ENV.shelterAvailabilityUrl || "SignalBridge demo registry", verification: ENV.shelterAvailabilityUrl ? "allowlisted host; connection checked on request" : "demo only" },
    disclaimer: "Live-source status is not authority. Always inspect source, timestamp, and uncertainty before acting.",
  };
}
