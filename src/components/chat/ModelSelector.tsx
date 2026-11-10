"use client";

import { useState } from "react";
import { ChevronDown, Zap, Brain, Sparkles, Crown } from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  provider: "google" | "groq";
  description: string;
  icon: React.ReactNode;
}

export const MODELS: ModelOption[] = [
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "google",
    description: "Fastest & smart (~1.5s, free tier default)",
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: "gemini-flash-lite-latest",
    name: "Gemini Flash Lite",
    provider: "google",
    description: "Ultra-fast lightweight (~1.5s)",
    icon: <Zap className="w-4 h-4 text-cyan-400" />,
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "google",
    description: "Newest Gemini 3.8 (auto-fallback if busy)",
    icon: <Sparkles className="w-4 h-4 text-blue-400" />,
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "google",
    description: "Advanced reasoning (requires Pro quota)",
    icon: <Crown className="w-4 h-4 text-purple-400" />,
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B (Groq)",
    provider: "groq",
    description: "Requires GROQ_API_KEY in .env.local",
    icon: <Brain className="w-4 h-4 text-yellow-400" />,
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const current = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <div className="relative z-40">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm text-gray-200 hover:text-white bg-gray-900 border border-emerald-500/30 rounded-xl hover:border-emerald-400/60 transition-colors"
      >
        {current.icon}
        <span className="font-medium">{current.name}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1.5 w-76 bg-gray-900 border border-emerald-500/40 rounded-xl overflow-hidden shadow-2xl z-50">
            {MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-800 transition-colors ${
                  selectedModel === model.id ? "bg-emerald-500/10" : ""
                }`}
              >
                {model.icon}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">
                    {model.name}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {model.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
