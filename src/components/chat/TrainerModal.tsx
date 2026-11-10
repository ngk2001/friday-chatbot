"use client";

import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Upload, Save, Check, Building2, Stethoscope } from "lucide-react";
import { MODELS } from "./ModelSelector";

export interface AssistantConfigData {
  characterName: string;
  roleTitle: string;
  personality: string;
  rules: string;
  hmsKnowledge: string;
  defaultModel: string;
}

interface TrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AssistantConfigData;
  onSaved: (updated: AssistantConfigData) => void;
}

const PRESETS: Record<string, Partial<AssistantConfigData>> = {
  hospital: {
    characterName: "F.R.I.D.A.Y",
    roleTitle: "Hospital Management SaaS (HMS) Specialist",
    personality:
      "Empathetic, precise, HIPAA/privacy-aware, and structured. Explains clinical & billing workflows clearly for doctors, nurses, receptionists, and hospital admins.",
    rules:
      "- Stay in character as our Hospital HMS SaaS AI Assistant.\n- Never fabricate patient data or unsupported compliance certifications.\n- Answer step-by-step using the HMS SaaS Knowledge Base below.\n- Highlight role permissions (Admin, Doctor, Nurse, Billing, Lab) when relevant.",
    hmsKnowledge: `# HMS SaaS Product Overview (Hospital Management System)
- Modules: Patient Registration & OPD, IPD & Bed Management, Doctor Scheduling, EMR/EHR, Pharmacy & Inventory, Lab & Radiology (LIS/RIS), Insurance & Billing, Multi-Branch Admin.
- User Roles: Super Admin, Hospital Admin, Doctor, Nurse, Receptionist, Pharmacist, Lab Technician, Billing Clerk.
- Key Workflows:
  1. OPD Check-in -> Vitals -> Doctor Consultation -> e-Prescription -> Pharmacy/Lab -> Invoice.
  2. IPD Admission -> Ward/Bed Allocation -> Daily Nursing Notes -> Discharge Summary -> Final Settlement.
- Support Escalation: Direct critical billing or data-migration issues to support@your-hms-saas.com.`,
  },
  hotel: {
    characterName: "F.R.I.D.A.Y",
    roleTitle: "Hotel Management SaaS (HMS) Concierge & Ops AI",
    personality:
      "Warm, hospitality-focused, fast, and detail-oriented. Helps front-desk staff, revenue managers, and hotel owners get tasks done effortlessly.",
    rules:
      "- Stay in character as our Hotel HMS SaaS AI Assistant.\n- Use hospitality terminology (PMS, OTA channel manager, ADR, RevPAR, check-in/out).\n- Ground answers in the HMS SaaS Knowledge Base below.",
    hmsKnowledge: `# HMS SaaS Product Overview (Hotel Management System)
- Modules: Front Desk & Reservations (PMS), Channel Manager (Booking.com, Airbnb, Expedia), Housekeeping & Maintenance, POS & Room Service, Dynamic Pricing, Guest CRM & Billing.
- User Roles: Owner, General Manager, Front Desk Agent, Housekeeping Lead, Accountant.
- Key Workflows:
  1. Reservation Sync -> Guest Pre-Check-in -> Room Assignment -> Folio & Check-out -> Housekeeping Turnover.
- Support Escalation: Escalate OTA sync failures with Property ID to support@your-hms-saas.com.`,
  },
};

export default function TrainerModal({
  isOpen,
  onClose,
  config,
  onSaved,
}: TrainerModalProps) {
  const [form, setForm] = useState<AssistantConfigData>(config);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setForm((prev) => ({
        ...prev,
        hmsKnowledge: prev.hmsKnowledge
          ? `${prev.hmsKnowledge}\n\n--- Imported from ${file.name} ---\n${text}`
          : text,
      }));
    } catch {
      setError("Could not read that file. Use .txt, .md, .csv, or .json.");
    } finally {
      e.target.value = "";
    }
  };

  const applyPreset = (key: "hospital" | "hotel") => {
    const preset = PRESETS[key];
    setForm((prev) => ({
      ...prev,
      ...preset,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/assistant-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      const saved = await res.json();
      onSaved(saved);
      setSavedNotice(true);
      setTimeout(() => {
        setSavedNotice(false);
        onClose();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Character &amp; HMS SaaS Trainer
              </h2>
              <p className="text-xs text-gray-400">
                Customize your AI persona and inject your HMS SaaS docs into Gemini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Quick HMS Presets */}
          <div>
            <span className="block text-xs font-medium text-gray-400 mb-2">
              Quick HMS Templates
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset("hospital")}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg transition-colors"
              >
                <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
                Hospital Management SaaS
              </button>
              <button
                type="button"
                onClick={() => applyPreset("hotel")}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                Hotel Management SaaS
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Character Name
              </label>
              <input
                type="text"
                value={form.characterName}
                onChange={(e) =>
                  setForm({ ...form, characterName: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="F.R.I.D.A.Y"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Default Gemini / AI Model
              </label>
              <select
                value={form.defaultModel}
                onChange={(e) =>
                  setForm({ ...form, defaultModel: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Character Role / Title
            </label>
            <input
              type="text"
              value={form.roleTitle}
              onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="HMS SaaS AI Assistant"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Character Personality &amp; Speaking Style
            </label>
            <textarea
              rows={3}
              value={form.personality}
              onChange={(e) =>
                setForm({ ...form, personality: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe how the character speaks, tone, and attitude..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Character Rules &amp; Guardrails
            </label>
            <textarea
              rows={3}
              value={form.rules}
              onChange={(e) => setForm({ ...form, rules: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="- Always answer in character..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-300">
                HMS SaaS Knowledge Base (Modules, Pricing, Workflows, API Docs, FAQs)
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload .txt / .md / .json
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <textarea
              rows={7}
              value={form.hmsKnowledge}
              onChange={(e) =>
                setForm({ ...form, hmsKnowledge: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste your HMS SaaS documentation, features, user roles, pricing tiers, troubleshooting steps, or API details here..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Gemini 2.5 supports up to 1M tokens of context — everything here is injected automatically into every response.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Character & Knowledge"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

