import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { actionPlans, citizenReports, evidenceItems, InsertUser, safetyStatus, userProfiles, users, warnings } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

const demoSnapshot = {
  warnings: [
    {
      id: 1,
      title: "Urban flood warning for North Chennai",
      hazardType: "Urban flooding",
      severity: "warning",
      status: "active",
      area: "Perambur · Purasawalkam · Basin Power",
      summary: "Intense rainfall is expected to create waterlogging on low-lying roads. Avoid underpasses and do not drive through moving water.",
      issuedAt: new Date("2026-09-22T05:45:00Z"),
      validUntil: new Date("2026-09-22T14:00:00Z"),
      sourceLabel: "Greater Chennai Corporation + IMD",
    },
    {
      id: 2,
      title: "Advisory: keep emergency routes clear",
      hazardType: "Access disruption",
      severity: "advisory",
      status: "active",
      area: "Chennai metropolitan area",
      summary: "Move vehicles from marked drains, culverts and emergency access roads. Keep a torch and charged phone ready.",
      issuedAt: new Date("2026-09-22T04:30:00Z"),
      validUntil: new Date("2026-09-22T18:00:00Z"),
      sourceLabel: "Greater Chennai Corporation",
    },
  ],
  evidence: [
    {
      id: 1,
      warningId: 1,
      sourceId: 1,
      evidenceType: "Official bulletin",
      title: "District rainfall and flood preparedness bulletin",
      publisher: "Greater Chennai Corporation",
      publishedAt: new Date("2026-09-22T05:45:00Z"),
      url: "https://chennaicorporation.gov.in/",
      confidence: 96,
      summary: "Official city bulletin identifies waterlogging risk across several North Chennai corridors and advises avoiding low-lying routes.",
    },
    {
      id: 2,
      warningId: 1,
      sourceId: 2,
      evidenceType: "Weather observation",
      title: "Short-duration heavy rainfall watch",
      publisher: "India Meteorological Department",
      publishedAt: new Date("2026-09-22T05:15:00Z"),
      url: "https://mausam.imd.gov.in/",
      confidence: 91,
      summary: "IMD observation supports the warning window. This evidence is time-bound and will be rechecked as conditions change.",
    },
    {
      id: 3,
      warningId: 1,
      sourceId: 3,
      evidenceType: "Citizen signal",
      title: "Water level reports near Perambur flyover",
      publisher: "SignalBridge community reports",
      publishedAt: new Date("2026-09-22T06:25:00Z"),
      url: null,
      confidence: 74,
      summary: "Multiple nearby reports indicate ankle-to-knee deep water on service roads. Community signals remain under triage.",
    },
  ],
  actionPlans: [
    { id: 1, title: "Move to a higher floor or safer nearby building", stepOrder: 1, category: "Immediate", description: "Do not wait for water to enter the home. Take essential medication, IDs, water and a charged phone.", priority: "now", status: "in_progress", dueBy: "Within 30 min" },
    { id: 2, title: "Avoid the Basin Power underpass", stepOrder: 2, category: "Route", description: "Use the marked alternative corridor via New Avadi Road. Never walk or drive through moving water.", priority: "now", status: "pending", dueBy: "Before leaving" },
    { id: 3, title: "Check in with your emergency contact", stepOrder: 3, category: "People", description: "Send your location and expected destination to Priya Raman. Keep the message short if connectivity drops.", priority: "next", status: "pending", dueBy: "Within 60 min" },
    { id: 4, title: "Prepare an accessible go-bag", stepOrder: 4, category: "Preparedness", description: "Pack medication, torch, power bank, water, dry food and one change of clothes.", priority: "ready", status: "complete", dueBy: "Ready" },
  ],
  citizenReports: [
    { id: 1, locationName: "Perambur Flyover service road", category: "Water depth", severity: "high", summary: "Water is covering the service lane; two-wheelers are being turned back.", verificationStatus: "triaged", reportedAt: new Date("2026-09-22T06:25:00Z"), upvotes: 18 },
    { id: 2, locationName: "Ayanavaram bus stop", category: "Access", severity: "moderate", summary: "Bus shelter is open but the approach road is partially blocked by parked vehicles.", verificationStatus: "corroborated", reportedAt: new Date("2026-09-22T06:10:00Z"), upvotes: 12 },
    { id: 3, locationName: "Purasawalkam High Road", category: "Power", severity: "moderate", summary: "Street lighting is intermittent near the market junction. Treat the route as low visibility.", verificationStatus: "unverified", reportedAt: new Date("2026-09-22T05:52:00Z"), upvotes: 5 },
  ],
  profile: { id: 1, userId: 1, displayName: "Arjun Menon", homeArea: "Perambur, Chennai", householdSize: 3, mobilityNeeds: "One person prefers step-free routes", preferredLanguage: "English", emergencyContact: "Priya Raman · +91 90000 12345", updatedAt: new Date("2026-09-21T10:00:00Z") },
  safety: { id: 1, userId: 1, state: "needs_check_in", lastCheckIn: new Date("2026-09-22T05:55:00Z"), message: "Your last check-in was 42 minutes ago. Confirm that you are safe or request assistance.", nextCheckIn: "By 07:15 IST" },
};

export async function getSignalSnapshot() {
  const db = await getDb();
  if (!db) return demoSnapshot;
  try {
    const [warningRows, evidenceRows, planRows, reportRows, profileRows, safetyRows] = await Promise.all([
      db.select().from(warnings),
      db.select().from(evidenceItems),
      db.select().from(actionPlans),
      db.select().from(citizenReports),
      db.select().from(userProfiles).limit(1),
      db.select().from(safetyStatus).limit(1),
    ]);
    return {
      warnings: warningRows.length ? warningRows : demoSnapshot.warnings,
      evidence: evidenceRows.length ? evidenceRows : demoSnapshot.evidence,
      actionPlans: planRows.length ? planRows : demoSnapshot.actionPlans,
      citizenReports: reportRows.length ? reportRows : demoSnapshot.citizenReports,
      profile: profileRows[0] ?? demoSnapshot.profile,
      safety: safetyRows[0] ?? demoSnapshot.safety,
    };
  } catch (error) {
    console.warn("[Database] Returning demo snapshot after query failure:", error);
    return demoSnapshot;
  }
}
