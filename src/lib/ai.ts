import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export function getModel(modelId: string) {
  if (modelId.startsWith("gemini")) {
    return google(modelId);
  }
  return groq(modelId);
}

export interface AssistantPersonaInput {
  characterName?: string | null;
  roleTitle?: string | null;
  personality?: string | null;
  rules?: string | null;
  hmsKnowledge?: string | null;
}

export const DEFAULT_ASSISTANT_PERSONA = {
  characterName: "F.R.I.D.A.Y",
  roleTitle: "HMS SaaS AI Assistant",
  personality:
    "Helpful, sharp, concise, and friendly. Speaks clearly with structured markdown, step-by-step guidance, and practical HMS SaaS expertise.",
  rules: [
    "Always stay in character as defined above.",
    "Use clean markdown formatting (headings, tables, code blocks, checklists).",
    "Prioritize accuracy based on the HMS SaaS Knowledge Base provided below.",
    "If a detail is not in the HMS Knowledge Base, clearly distinguish between what is confirmed in the docs and general best-practice suggestions.",
  ].join("\n"),
  hmsKnowledge: "",
  defaultModel: "gemini-2.5-flash",
};

export function buildSystemPrompt(persona?: AssistantPersonaInput | null): string {
  const name = persona?.characterName?.trim() || DEFAULT_ASSISTANT_PERSONA.characterName;
  const role = persona?.roleTitle?.trim() || DEFAULT_ASSISTANT_PERSONA.roleTitle;
  const personality = persona?.personality?.trim() || DEFAULT_ASSISTANT_PERSONA.personality;
  const rules = persona?.rules?.trim() || DEFAULT_ASSISTANT_PERSONA.rules;
  const hmsKnowledge = persona?.hmsKnowledge?.trim() || "";

  const sections = [
    `You are ${name}, acting as: ${role}.`,
    `## Character & Personality\n${personality}`,
    `## Behavioral Rules\n${rules}`,
  ];

  if (hmsKnowledge) {
    sections.push(
      `## HMS SaaS Knowledge Base (Authoritative Context)\nUse the following product knowledge, workflows, modules, roles, pricing, and technical details when helping users with the HMS SaaS application:\n\n${hmsKnowledge}`
    );
  }

  return sections.join("\n\n");
}
