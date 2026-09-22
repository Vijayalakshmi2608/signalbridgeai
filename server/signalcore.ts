export type RawAlertInput = {
  alertId: string;
  hazardType: string;
  severity: "advisory" | "watch" | "warning" | "critical";
  source: string;
  sourceStatus: "official" | "connected" | "simulated";
  affectedArea: string;
  issueTime: string;
  validFrom: string;
  expiryTime: string;
  warningText: string;
  recommendedPrecautions: string;
};

export type StructuredAlert = {
  alertId: string;
  hazard: string;
  severity: RawAlertInput["severity"];
  affectedZones: string[];
  timeWindow: { validFrom: string; expiryTime: string };
  source: string;
  sourceStatus: RawAlertInput["sourceStatus"];
  extractedInstructions: string[];
  confidence: number;
  timestamp: string;
  intelligenceStatus: "DEMO INTERPRETATION" | "SOURCE-CONNECTED INTERPRETATION";
};

function splitInstructions(text: string) {
  return text.split(/[\n.;]+/).map(item => item.trim()).filter(Boolean).slice(0, 8);
}

export function interpretAlert(input: RawAlertInput): StructuredAlert {
  const zoneParts = input.affectedArea.split(/[·,|]+/).map(item => item.trim()).filter(Boolean);
  const extractedInstructions = splitInstructions(input.recommendedPrecautions);
  const confidence = input.sourceStatus === "official" ? 96 : input.sourceStatus === "connected" ? 88 : 76;
  return {
    alertId: input.alertId,
    hazard: input.hazardType,
    severity: input.severity,
    affectedZones: zoneParts.length ? zoneParts : [input.affectedArea],
    timeWindow: { validFrom: input.validFrom, expiryTime: input.expiryTime },
    source: input.source,
    sourceStatus: input.sourceStatus,
    extractedInstructions,
    confidence,
    timestamp: new Date().toISOString(),
    intelligenceStatus: input.sourceStatus === "simulated" ? "DEMO INTERPRETATION" : "SOURCE-CONNECTED INTERPRETATION",
  };
}

export const DEMO_RAW_ALERT: RawAlertInput = {
  alertId: "CHN-FLD-2026-0922-001",
  hazardType: "Urban flooding",
  severity: "warning",
  source: "Greater Chennai Corporation + IMD",
  sourceStatus: "simulated",
  affectedArea: "Perambur · Purasawalkam · Basin Power",
  issueTime: "2026-09-22T05:45:00+05:30",
  validFrom: "2026-09-22T06:00:00+05:30",
  expiryTime: "2026-09-22T14:00:00+05:30",
  warningText: "Intense rainfall may create waterlogging on low-lying roads in North Chennai.",
  recommendedPrecautions: "Avoid underpasses. Do not drive or walk through moving water. Keep medication, water and a charged phone ready.",
};
