import type { ActionRecommendation } from "./actionforge";

export type AccessLanguage = "English" | "Tamil" | "Simplified English";
export type AccessibilityPreferences = { language: AccessLanguage; largeText: boolean; simplified: boolean; voiceEnabled: boolean; screenReaderMode: boolean };

export type AccessibleAction = { id: string; category: ActionRecommendation["category"]; priority: ActionRecommendation["priority"]; standardEnglish: string; tamil: string; simplifiedEnglish: string; voiceText: string; source: string; evidenceCategory: ActionRecommendation["evidenceCategory"]; confidence: number; safetyMeaning: string };

const tamilById: Record<string, string> = {
  "immediate-01": "தண்ணீர் உயர்ந்து கொண்டிருந்தால் அல்லது வெளியேறும் வழி பாதுகாப்பாக இல்லாவிட்டால், உயரமான பாதுகாப்பான இடத்திற்குச் செல்லுங்கள்.",
  "preparation-01": "மருந்துகள், அடையாள ஆவணங்கள், தண்ணீர், டார்ச் மற்றும் சார்ஜ் செய்யப்பட்ட தொலைபேசியை தயார் வைத்திருங்கள்.",
  "avoidance-01": "ஓடும் வெள்ளநீருக்குள் செல்லாதீர்கள். Basin Power சுரங்கப்பாதையைத் தவிர்க்கவும்.",
  "escalation-01": "சிக்கிக் கொண்டால் அல்லது பாதுகாப்பாக வெளியேற முடியாவிட்டால், அதிகாரப்பூர்வ உதவியைப் பின்பற்றி உள்ளூர் அவசர சேவைகளைத் தொடர்பு கொள்ளுங்கள்.",
};

const simplifiedById: Record<string, string> = {
  "immediate-01": "If water is rising, move to a higher safe place now.",
  "preparation-01": "Keep medicine, ID, water, a torch and a charged phone ready.",
  "avoidance-01": "Do not walk or drive through moving water. Avoid the Basin Power underpass.",
  "escalation-01": "If you are trapped, use official help guidance and contact local emergency services.",
};

export function transformActionPlan(actions: ActionRecommendation[]): AccessibleAction[] {
  return actions.map(action => ({ id: action.id, category: action.category, priority: action.priority, standardEnglish: action.action, tamil: tamilById[action.id] ?? action.action, simplifiedEnglish: simplifiedById[action.id] ?? action.action, voiceText: `${action.priority === "now" ? "Immediate action." : "Prepare."} ${simplifiedById[action.id] ?? action.action} Reason: ${action.reason}`, source: action.source, evidenceCategory: action.evidenceCategory, confidence: action.confidence, safetyMeaning: "This is the same supplied safety meaning as the standard English recommendation; only language and format changed." }));
}

export function buildAccessBridgeBundle(actions: ActionRecommendation[]) {
  return { outputs: transformActionPlan(actions), supportedLanguages: ["English", "Tamil", "Simplified English"] as const, voice: { provider: "Browser SpeechSynthesis", status: typeof window === "undefined" ? "browser-only" : "available" }, disclaimer: "AccessBridge changes language, reading level, and delivery format. It does not create new emergency instructions or change ActionForge priority." };
}
