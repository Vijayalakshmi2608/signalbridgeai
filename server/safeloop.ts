export const SAFE_LOOP_STATUSES = ["ACTION PENDING", "PREPARING", "EVACUATING", "SAFE", "ASSISTANCE NEEDED"] as const;
export type SafeLoopStatus = typeof SAFE_LOOP_STATUSES[number];
export type SafeLoopEventType = "WARNING RECEIVED" | "ACTION PLAN GENERATED" | "USER RESPONSE" | "SAFETY STATUS";
export type SafeLoopEvent = { id: string; type: SafeLoopEventType; label: string; detail: string; timestamp: Date; status?: SafeLoopStatus };

const seededAt = new Date("2026-09-22T06:32:00+05:30");
let currentStatus: SafeLoopStatus = "ACTION PENDING";
let lastUpdatedAt = new Date(seededAt);
let responseCount = 0;

const baseTimeline: SafeLoopEvent[] = [
  { id: "warning-received", type: "WARNING RECEIVED", label: "Urban flood warning received", detail: "Chennai / Perambur demo warning entered the SignalBridge pipeline.", timestamp: new Date("2026-09-22T05:55:00Z") },
  { id: "action-plan-generated", type: "ACTION PLAN GENERATED", label: "ActionForge plan generated", detail: "Four traceable actions compiled from supplied warning guidance.", timestamp: new Date("2026-09-22T06:02:00Z") },
];

export function getSafeLoopState() {
  const timeline = [...baseTimeline];
  if (responseCount > 0) timeline.push({ id: `user-response-${responseCount}`, type: "USER RESPONSE", label: "User status selected", detail: `The user selected ${currentStatus.toLowerCase()} for this monitoring window.`, timestamp: new Date(lastUpdatedAt), status: currentStatus });
  timeline.push({ id: "safety-status", type: "SAFETY STATUS", label: `Current safety state: ${currentStatus}`, detail: "Prototype status only; no responder dispatch is triggered automatically.", timestamp: new Date(lastUpdatedAt), status: currentStatus });
  return { currentStatus, updatedAt: new Date(lastUpdatedAt), timeline, statuses: SAFE_LOOP_STATUSES, disclaimer: "SafeLoop is a prototype status system. It does not automatically dispatch responders or guarantee that help has been notified." };
}

export function updateSafeLoopStatus(status: SafeLoopStatus) {
  currentStatus = status;
  lastUpdatedAt = new Date();
  responseCount += 1;
  return getSafeLoopState();
}
