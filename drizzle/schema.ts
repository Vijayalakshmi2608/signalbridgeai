import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const warningSources = mysqlTable("warning_sources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  agency: varchar("agency", { length: 160 }).notNull(),
  sourceType: varchar("sourceType", { length: 80 }).notNull(),
  trustLevel: mysqlEnum("trustLevel", ["official", "partner", "community"]).default("official").notNull(),
  url: text("url"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const warnings = mysqlTable("warnings", {
  id: int("id").autoincrement().primaryKey(),
  alertId: varchar("alertId", { length: 120 }).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  hazardType: varchar("hazardType", { length: 80 }).notNull(),
  severity: mysqlEnum("severity", ["advisory", "watch", "warning", "critical"]).notNull(),
  status: mysqlEnum("status", ["active", "monitoring", "expired"]).default("active").notNull(),
  sourceStatus: mysqlEnum("sourceStatus", ["official", "connected", "simulated"]).default("simulated").notNull(),
  area: varchar("area", { length: 180 }).notNull(),
  summary: text("summary").notNull(),
  warningText: text("warningText").notNull(),
  recommendedPrecautions: text("recommendedPrecautions").notNull(),
  issuedAt: timestamp("issuedAt").notNull(),
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil"),
  sourceLabel: varchar("sourceLabel", { length: 180 }).notNull(),
});

export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  displayName: varchar("displayName", { length: 140 }).notNull(),
  homeArea: varchar("homeArea", { length: 180 }).notNull(),
  householdSize: int("householdSize").default(1).notNull(),
  mobilityNeeds: varchar("mobilityNeeds", { length: 180 }),
  preferredLanguage: varchar("preferredLanguage", { length: 80 }).default("English").notNull(),
  emergencyContact: varchar("emergencyContact", { length: 180 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const locations = mysqlTable("locations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  district: varchar("district", { length: 140 }).notNull(),
  latitude: varchar("latitude", { length: 24 }).notNull(),
  longitude: varchar("longitude", { length: 24 }).notNull(),
  riskBand: mysqlEnum("riskBand", ["low", "moderate", "high", "severe"]).notNull(),
  description: text("description"),
});

export const shelters = mysqlTable("shelters", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  address: text("address").notNull(),
  latitude: varchar("latitude", { length: 24 }).notNull(),
  longitude: varchar("longitude", { length: 24 }).notNull(),
  capacity: int("capacity").notNull(),
  availableSpaces: int("availableSpaces").notNull(),
  status: mysqlEnum("status", ["open", "limited", "closed"]).default("open").notNull(),
});

export const citizenReports = mysqlTable("citizen_reports", {
  id: int("id").autoincrement().primaryKey(),
  locationName: varchar("locationName", { length: 180 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  severity: mysqlEnum("severity", ["low", "moderate", "high", "severe"]).notNull(),
  summary: text("summary").notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "triaged", "corroborated"]).default("unverified").notNull(),
  reportedAt: timestamp("reportedAt").notNull(),
  upvotes: int("upvotes").default(0).notNull(),
});

export const evidenceItems = mysqlTable("evidence_items", {
  id: int("id").autoincrement().primaryKey(),
  warningId: int("warningId"),
  sourceId: int("sourceId"),
  evidenceType: varchar("evidenceType", { length: 100 }).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  publisher: varchar("publisher", { length: 180 }).notNull(),
  publishedAt: timestamp("publishedAt").notNull(),
  url: text("url"),
  confidence: int("confidence").default(0).notNull(),
  summary: text("summary").notNull(),
});

export const actionPlans = mysqlTable("action_plans", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  stepOrder: int("stepOrder").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["now", "next", "ready"]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "complete"]).default("pending").notNull(),
  dueBy: varchar("dueBy", { length: 120 }),
});

export const actionRecommendations = mysqlTable("action_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["immediate", "preparation", "avoidance", "escalation"]).notNull(),
  priority: mysqlEnum("priority", ["now", "next", "ready"]).notNull(),
  action: text("action").notNull(),
  reason: text("reason").notNull(),
  supportingEvidence: text("supportingEvidence").notNull(),
  source: varchar("source", { length: 180 }).notNull(),
  evidenceCategory: mysqlEnum("evidenceCategory", ["verified", "supported", "unverified", "conflicting", "unknown"]).notNull(),
  confidence: int("confidence").notNull(),
  uncertainty: text("uncertainty").notNull(),
});

export const evidenceGraphLinks = mysqlTable("evidence_graph_links", {
  id: int("id").autoincrement().primaryKey(),
  fromType: varchar("fromType", { length: 80 }).notNull(),
  fromLabel: varchar("fromLabel", { length: 220 }).notNull(),
  toType: varchar("toType", { length: 80 }).notNull(),
  toLabel: varchar("toLabel", { length: 220 }).notNull(),
  relationship: varchar("relationship", { length: 120 }).notNull(),
  evidenceCategory: mysqlEnum("evidenceCategory", ["verified", "supported", "unverified", "conflicting", "unknown"]).notNull(),
  relevance: int("relevance").notNull(),
  confidence: int("confidence").notNull(),
  uncertainty: text("uncertainty").notNull(),
});

export const safetyStatus = mysqlTable("safety_status", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  state: mysqlEnum("state", ["safe", "needs_check_in", "assistance_requested", "unknown"]).notNull(),
  lastCheckIn: timestamp("lastCheckIn"),
  message: text("message").notNull(),
  nextCheckIn: varchar("nextCheckIn", { length: 120 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Warning = typeof warnings.$inferSelect;
export type EvidenceItem = typeof evidenceItems.$inferSelect;
export type ActionPlan = typeof actionPlans.$inferSelect;
export type CitizenReport = typeof citizenReports.$inferSelect;
export type ActionRecommendation = typeof actionRecommendations.$inferSelect;
export type EvidenceGraphLink = typeof evidenceGraphLinks.$inferSelect;
