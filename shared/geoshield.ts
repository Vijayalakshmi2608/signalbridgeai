export type RiskState = "SAFE" | "WATCH" | "ACTION";

export type GeoPoint = { lat: number; lng: number };
export type GeoPolygon = { id: string; name: string; severity: "watch" | "action"; points: GeoPoint[]; description: string };

export const WARNING_ZONES: GeoPolygon[] = [
  {
    id: "north-chennai-flood-zone",
    name: "North Chennai low-lying corridor",
    severity: "action",
    points: [
      { lat: 13.137, lng: 80.222 }, { lat: 13.137, lng: 80.267 }, { lat: 13.108, lng: 80.282 },
      { lat: 13.080, lng: 80.266 }, { lat: 13.083, lng: 80.225 },
    ],
    description: "Simulated demonstration boundary around Perambur, Ayanavaram and adjacent low-lying corridors.",
  },
  {
    id: "purasawalkam-watch-zone",
    name: "Central Chennai monitoring zone",
    severity: "watch",
    points: [
      { lat: 13.083, lng: 80.225 }, { lat: 13.083, lng: 80.266 }, { lat: 13.050, lng: 80.286 },
      { lat: 13.034, lng: 80.250 }, { lat: 13.050, lng: 80.220 },
    ],
    description: "Simulated watch boundary around Purasawalkam, Egmore and central access routes.",
  },
];

export const SHELTERS = [
  { id: "shelter-1", name: "Perambur Community Hall", address: "Paper Mills Road, Perambur", point: { lat: 13.115, lng: 80.238 }, status: "Open", spaces: 86 },
  { id: "shelter-2", name: "Ayanavaram Relief Centre", address: "New Avadi Road, Ayanavaram", point: { lat: 13.088, lng: 80.245 }, status: "Limited", spaces: 32 },
  { id: "shelter-3", name: "Egmore Civic Centre", address: "Poonamallee High Road, Egmore", point: { lat: 13.073, lng: 80.260 }, status: "Open", spaces: 120 },
];

export const IMPORTANT_ROADS = [
  { id: "road-1", name: "New Avadi Road", points: [{ lat: 13.115, lng: 80.210 }, { lat: 13.102, lng: 80.230 }, { lat: 13.082, lng: 80.252 }, { lat: 13.060, lng: 80.270 }] as GeoPoint[], status: "Preferred reference route" },
  { id: "road-2", name: "Basin Power underpass", points: [{ lat: 13.119, lng: 80.238 }, { lat: 13.104, lng: 80.244 }] as GeoPoint[], status: "Avoid in demo warning" },
];

export const SAFE_REFERENCE_AREAS = [
  { id: "safe-1", name: "Egmore reference area", point: { lat: 13.055, lng: 80.280 }, description: "Reference area outside the simulated action polygon." },
  { id: "safe-2", name: "Anna Nagar reference area", point: { lat: 13.085, lng: 80.210 }, description: "Reference area outside the simulated warning polygons." },
];

export const DEFAULT_USER_LOCATION: GeoPoint = { lat: 13.111, lng: 80.244 };
