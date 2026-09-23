import { z } from "zod";
import { ENV } from "./_core/env";

const riskStatusSchema = z.enum(["SAFE", "WATCH", "ACTION"]);
const aiLanguageSchema = z.enum(["en", "ta", "simple"]);

export const aiInsightSchema = z.object({
  risk_status: riskStatusSchema,
  summary: z.string().min(10).max(500),
  do_now: z.array(z.string().min(1).max(240)).default([]),
  prepare_next: z.array(z.string().min(1).max(240)).default([]),
  avoid: z.array(z.string().min(1).max(240)).default([]),
  escalation: z.array(z.string().min(1).max(240)).default([]),
  evidence: z.array(z.string().min(1).max(240)).default([]),
  uncertainties: z.array(z.string().min(1).max(240)).default([]),
  language: aiLanguageSchema.default("en"),
  explanation: z.string().min(10).max(500).default("Based on the supplied warning, guidance, and local context."),
  generated_at: z.string().datetime().optional(),
  source_status: z.enum(["live", "demo", "fallback"]).default("demo"),
});

export type AiInsightResponse = z.infer<typeof aiInsightSchema>;

export type AiInsightInput = {
  warning: string;
  hazard: string;
  severity: string;
  location: string;
  guidance: string[];
  evidence: string[];
  userProfile?: { displayName?: string; preferredLanguage?: string; mobilityNeeds?: string | null; householdSize?: number };
  accessibility?: { preferredLanguage?: string; mobilityNeeds?: string | null };
};

export type AiInsightResult = {
  status: "live" | "demo";
  provider: "openrouter";
  model: string;
  response: AiInsightResponse;
  disclaimer: string;
  generatedAt: string;
};

export function validateAiResponse(input: unknown): { ok: true; data: AiInsightResponse } | { ok: false; errors: string[] } {
  const parsed = aiInsightSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(issue => `${issue.path.join(".") || "root"}: ${issue.message}`),
    };
  }

  return { ok: true, data: parsed.data };
}

function normalizeRiskStatus(severity: string, location: string) {
  const value = severity.toLowerCase();
  if (value === "critical" || /flood|evacu|storm|wave|danger|warning/.test(location.toLowerCase()) && value === "warning") {
    return "ACTION" as const;
  }
  if (value === "watch") {
    return "WATCH" as const;
  }
  return "SAFE" as const;
}

export function buildAiInsight(input: AiInsightInput, options: { providerAvailable?: boolean; reason?: string } = {}): AiInsightResult {
  const reason = options.reason ?? "OpenRouter unavailable";
  const demoSummary = `${input.warning} This is a verified demo interpretation for ${input.location}. AI unavailable — using verified demo guidance.`;
  const status = options.providerAvailable === false ? "demo" : "live";
  const riskStatus = input.severity.toLowerCase() === "critical" ? "ACTION" : normalizeRiskStatus(input.severity, input.location);
  const response: AiInsightResponse = {
    risk_status: riskStatus,
    summary: demoSummary,
    do_now: [
      input.guidance[0] ?? "Move to a safer, higher location if the current route becomes unsafe.",
      "Verify the latest local emergency instructions with official authorities before moving."
    ],
    prepare_next: [
      "Keep emergency supplies, identification, medication, and charging options ready.",
      `Prepare for the household profile in ${input.location}.`
    ],
    avoid: [
      "Do not walk or drive through moving water.",
      "Do not ignore official road closures or local notices."
    ],
    escalation: [
      "If trapped or unable to evacuate safely, follow the local official assistance guidance.",
      "Call local emergency services only if official instructions direct you to do so."
    ],
    evidence: input.evidence.length ? input.evidence : [
      input.warning,
      `Trusted guidance: ${input.guidance.join("; ") || "No additional guidance provided."}`,
    ],
    uncertainties: [
      "Water depth and local road conditions can change faster than this summary reflects.",
      "This demo response does not replace official emergency instructions."
    ],
    language: "en",
    explanation: `This interpretation only uses the supplied warning, trusted guidance, location context, and clearly labelled community information. ${reason}.`,
    generated_at: new Date().toISOString(),
    source_status: "demo",
  };

  return {
    status,
    provider: "openrouter",
    model: ENV.openRouterModel || "openai/gpt-4o-mini",
    response,
    disclaimer: "AI-assisted interpretation — verify critical instructions with official emergency authorities.",
    generatedAt: response.generated_at ?? new Date().toISOString(),
  };
}

function getOpenRouterModel() {
  return ENV.openRouterModel || "openai/gpt-4o-mini";
}

function getJsonSchema() {
  return {
    name: "signalbridge_emergency_insight",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "risk_status",
        "summary",
        "do_now",
        "prepare_next",
        "avoid",
        "escalation",
        "evidence",
        "uncertainties",
        "language",
        "explanation",
        "generated_at",
        "source_status",
      ],
      properties: {
        risk_status: { type: "string", enum: ["SAFE", "WATCH", "ACTION"] },
        summary: { type: "string", minLength: 10, maxLength: 500 },
        do_now: { type: "array", items: { type: "string", minLength: 1, maxLength: 240 } },
        prepare_next: { type: "array", items: { type: "string", minLength: 1, maxLength: 240 } },
        avoid: { type: "array", items: { type: "string", minLength: 1, maxLength: 240 } },
        escalation: { type: "array", items: { type: "string", minLength: 1, maxLength: 240 } },
        evidence: { type: "array", items: { type: "string", minLength: 1, maxLength: 240 } },
        uncertainties: { type: "array", items: { type: "string", minLength: 1, maxLength: 240 } },
        language: { type: "string", enum: ["en", "ta", "simple"] },
        explanation: { type: "string", minLength: 10, maxLength: 500 },
        generated_at: { type: "string" },
        source_status: { type: "string", enum: ["live", "demo", "fallback"] },
      },
    },
  } as const;
}

async function callOpenRouter(input: AiInsightInput): Promise<AiInsightResponse> {
  if (!ENV.openRouterApiKey || !ENV.openRouterApiKey.trim()) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const requestBody = {
    model: getOpenRouterModel(),
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: [
          "You are SignalBridge AI. You assist with emergency context interpretation using only the warning, trusted guidance, geographic context, and clearly labelled community information supplied by the user.",
          "Never claim to predict a disaster. Never invent emergency services, shelters, sources, evacuation orders, official instructions, or responder numbers.",
          "This output must be valid JSON matching the required schema. Do not include markdown code fences or free-form narration.",
          "Community reports are never official warnings. Label anything based on community reports as non-official context.",
          "When uncertain, keep the uncertainty list populated and do not guess."
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          warning: input.warning,
          hazard: input.hazard,
          severity: input.severity,
          location: input.location,
          guidance: input.guidance,
          evidence: input.evidence,
          user_profile: input.userProfile ?? {},
          accessibility: input.accessibility ?? {},
          rules: [
            "Return only JSON.",
            "Use risk_status SAFE | WATCH | ACTION.",
            "Keep summary concise and factual.",
            "Never claim a prediction or create new official instructions."
          ],
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: getJsonSchema(),
    },
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://signalbridge.local",
      "X-Title": "SignalBridge",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenRouter request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const message = payload.choices?.[0]?.message?.content;

  if (!message) {
    throw new Error("OpenRouter returned no JSON content.");
  }

  const parsed = JSON.parse(message);
  const validation = validateAiResponse(parsed);
  if (!validation.ok) {
    throw new Error(validation.errors.join("; "));
  }

  return validation.data;
}

export async function generateAiInsight(input: AiInsightInput): Promise<AiInsightResult> {
  const model = getOpenRouterModel();
  try {
    const response = await callOpenRouter(input);
    return {
      status: "live",
      provider: "openrouter",
      model,
      response: {
        ...response,
        source_status: response.source_status ?? "live",
        generated_at: response.generated_at ?? new Date().toISOString(),
      },
      disclaimer: "AI-assisted interpretation — verify critical instructions with official emergency authorities.",
      generatedAt: response.generated_at ?? new Date().toISOString(),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "OpenRouter unavailable";
    return buildAiInsight(input, { providerAvailable: false, reason });
  }
}

export async function aiHealthCheck(): Promise<{ ok: boolean; provider: "openrouter"; status: "ok" | "fallback"; model: string; checkedAt: string; message: string }> {
  const model = getOpenRouterModel();
  if (!ENV.openRouterApiKey || !ENV.openRouterApiKey.trim()) {
    return { ok: false, provider: "openrouter", status: "fallback", model, checkedAt: new Date().toISOString(), message: "OPENROUTER_API_KEY is not configured." };
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ENV.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://signalbridge.local",
        "X-Title": "SignalBridge",
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, provider: "openrouter", status: "fallback", model, checkedAt: new Date().toISOString(), message: `OpenRouter health check failed: ${detail.slice(0, 200)}` };
    }

    return { ok: true, provider: "openrouter", status: "ok", model, checkedAt: new Date().toISOString(), message: "OpenRouter connection verified." };
  } catch (error) {
    return { ok: false, provider: "openrouter", status: "fallback", model, checkedAt: new Date().toISOString(), message: error instanceof Error ? error.message : "OpenRouter connection unavailable." };
  }
}
