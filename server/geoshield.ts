import { DEFAULT_USER_LOCATION, GeoPoint, RiskState, SAFE_REFERENCE_AREAS, SHELTERS, WARNING_ZONES } from "@shared/geoshield";

const EARTH_RADIUS_KM = 6371;
const toRadians = (value: number) => (value * Math.PI) / 180;

export function pointInPolygon(point: GeoPoint, polygon: GeoPoint[]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects = ((currentPoint.lng > point.lng) !== (previousPoint.lng > point.lng)) &&
      (point.lat < (previousPoint.lat - currentPoint.lat) * (point.lng - currentPoint.lng) / (previousPoint.lng - currentPoint.lng) + currentPoint.lat);
    if (intersects) inside = !inside;
  }
  return inside;
}

function haversineKm(a: GeoPoint, b: GeoPoint) {
  const latDelta = toRadians(b.lat - a.lat);
  const lngDelta = toRadians(b.lng - a.lng);
  const value = Math.sin(latDelta / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(lngDelta / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function distanceToSegmentKm(point: GeoPoint, start: GeoPoint, end: GeoPoint) {
  const x = (point.lng - start.lng) * Math.cos(toRadians(point.lat));
  const y = point.lat - start.lat;
  const dx = (end.lng - start.lng) * Math.cos(toRadians(point.lat));
  const dy = end.lat - start.lat;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (x * dx + y * dy) / lengthSquared));
  return haversineKm(point, { lat: start.lat + projection * dy, lng: start.lng + projection * (end.lng - start.lng) });
}

function distanceToBoundaryKm(point: GeoPoint, polygon: GeoPoint[]) {
  return polygon.reduce((minimum, vertex, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return Math.min(minimum, distanceToSegmentKm(point, vertex, next));
  }, Number.POSITIVE_INFINITY);
}

export function assessRisk(point: GeoPoint = DEFAULT_USER_LOCATION) {
  const matches = WARNING_ZONES.filter(zone => pointInPolygon(point, zone.points));
  const primary = matches.sort((a, b) => (a.severity === "action" ? -1 : 1) - (b.severity === "action" ? -1 : 1))[0];
  const nearestShelter = SHELTERS.map(shelter => ({ ...shelter, distanceKm: haversineKm(point, shelter.point) })).sort((a, b) => a.distanceKm - b.distanceKm)[0];
  const boundaryDistanceKm = primary ? distanceToBoundaryKm(point, primary.points) : Math.min(...WARNING_ZONES.map(zone => distanceToBoundaryKm(point, zone.points)));
  const state: RiskState = primary?.severity === "action" ? "ACTION" : primary?.severity === "watch" ? "WATCH" : "SAFE";
  return {
    selectedLocation: point,
    state,
    hazard: state === "SAFE" ? "No simulated flood zone intersection" : "Urban flooding",
    warningSeverity: primary?.severity ?? "none",
    affectedZone: primary?.name ?? "Outside simulated warning polygons",
    affectedZoneRelationship: primary ? "Selected point intersects this simulated warning polygon." : "Selected point is outside the simulated warning polygons.",
    nearestShelter: { ...nearestShelter, distanceKm: Number(nearestShelter.distanceKm.toFixed(2)) },
    warningValidity: { validFrom: "2026-09-22T06:00:00+05:30", expiryTime: "2026-09-22T14:00:00+05:30" },
    distanceToAffectedBoundaryKm: Number(boundaryDistanceKm.toFixed(2)),
    matchedZoneIds: matches.map(zone => zone.id),
    isDemo: true,
    disclaimer: "Simulated hazard boundaries for product demonstration only. This is not a real-time emergency prediction system.",
    referenceAreas: SAFE_REFERENCE_AREAS,
  };
}
