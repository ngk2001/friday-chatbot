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
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Fast, smart & generous free tier (Default)",
    icon: <Sparkles className="w-4 h-4 text-blue-400" />,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    description: "Advanced reasoning & HMS architecture",
    icon: <Crown className="w-4 h-4 text-purple-400" />,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Ultra-fast Google Gemini",
    icon: <Zap className="w-4 h-4 text-cyan-400" />,
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B (Groq)",
    provider: "groq",
    description: "Blazing-fast free fallback",
    icon: <Zap className="w-4 h-4 text-yellow-400" />,
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 70B (Groq)",
    provider: "groq",
    description: "DeepSeek reasoning on Groq",
    icon: <Brain className="w-4 h-4 text-green-400" />,
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-900 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
      >
        {current.icon}
        <span className="font-medium">{current.name}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-72 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl z-20">
            {MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-800 transition-colors ${
                  selectedModel === model.id ? "bg-gray-800" : ""
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
