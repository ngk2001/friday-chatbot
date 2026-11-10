"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Stethoscope,
  SlidersHorizontal,
  ShieldCheck,
  Workflow,
  Loader2,
  AlertCircle,
  Terminal,
  Eye,
  Shield,
} from "lucide-react";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import ModelSelector, { MODELS } from "@/components/chat/ModelSelector";
import TrainerModal, {
  AssistantConfigData,
} from "@/components/chat/TrainerModal";
import CypherMatrixBg from "@/components/chat/CypherMatrixBg";
import CypherText from "@/components/chat/CypherText";
import { ChatMessageItem, useFridayChat } from "@/hooks/useFridayChat";

const DEFAULT_CONFIG: AssistantConfigData = {
  characterName: "F.R.I.D.A.Y",
  roleTitle: "HMS SaaS AI Assistant",
  personality:
    "Helpful, sharp, concise, and friendly. Speaks clearly with structured markdown, step-by-step guidance, and practical HMS SaaS expertise.",
  rules:
    "Always stay in character as defined above.\nUse clean markdown formatting.\nPrioritize accuracy based on the HMS SaaS Knowledge Base.",
  hmsKnowledge: "",
  defaultModel: MODELS[0].id,
};

const SUGGESTIONS = [
  {
    icon: <Stethoscope className="w-5 h-5 text-emerald-400" />,
    title: "HMS Patient / Guest Flow",
    prompt:
      "Explain the end-to-end onboarding and billing workflow in our HMS SaaS app",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />,
    title: "Role Permissions",
    prompt:
      "How should role-based access control (Admin, Staff, User) work in our HMS SaaS?",
  },
  {
    icon: <Workflow className="w-5 h-5 text-yellow-400" />,
    title: "Troubleshoot Issue",
    prompt:
      "Help a customer troubleshoot why an invoice or booking status did not update",
  },
  {
    icon: <Eye className="w-5 h-5 text-purple-400" />,
    title: "Image / UI Analysis",
    prompt:
      "I am going to upload a screenshot of our HMS screen — review the layout, bugs, and UX improvements.",
  },
];

interface ChatWorkspaceProps {
  initialChatId?: string | null;
}

export default function ChatWorkspace({
  initialChatId = null,
}: ChatWorkspaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);
  const [config, setConfig] = useState<AssistantConfigData>(DEFAULT_CONFIG);
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [cypherMode, setCypherMode] = useState(true);
  const [initialLoading, setInitialLoading] = useState(Boolean(initialChatId));

  const { messages, setMessages, sendMessage, isLoading, error, stop } =
    useFridayChat({
      chatId,
      model: selectedModel,
      onChatCreated: (newChatId) => {
        setChatId(newChatId);
        window.history.replaceState(null, "", `/${newChatId}`);
      },
    });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/assistant-config");
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
          if (data.defaultModel && MODELS.some((m) => m.id === data.defaultModel)) {
            setSelectedModel(data.defaultModel);
          } else {
            setSelectedModel(MODELS[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load assistant config:", err);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (!initialChatId) {
      setInitialLoading(false);
      return;
    }

    const loadChat = async () => {
      try {
        const res = await fetch(`/api/chats/${initialChatId}`);
        if (res.ok) {
          const data = await res.json();
          const loaded: ChatMessageItem[] = data.messages.map(
            (m: {
              id: string;
              role: string;
              content: string;
              imageData?: string | null;
            }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              imageData: m.imageData ?? null,
            })
          );
          setMessages(loaded);
        }
      } catch (err) {
        console.error("Failed to load chat:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadChat();
  }, [initialChatId, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const shortSessionId = chatId ? chatId.slice(-8).toUpperCase() : "NEW_LINK";

  return (
    <div
      className={`relative flex flex-col h-full overflow-hidden ${
        cypherMode ? "cypher-grid bg-[#02060d]" : "bg-gray-950"
      }`}
    >
      <CypherMatrixBg enabled={cypherMode} />
      {cypherMode && <div className="fixed inset-0 z-0 cypher-scanlines" />}

      {/* Header */}
      <header
        className={`relative z-30 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b backdrop-blur-xl ${
          cypherMode
            ? "border-emerald-500/20 bg-gray-950/85"
            : "border-gray-800 bg-gray-950/80"
        }`}
      >
        <div className="md:pl-0 pl-12 flex items-center gap-2.5 flex-wrap">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
          <span
            className={`hidden lg:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg border ${
              cypherMode
                ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                : "text-gray-400 bg-gray-900 border-gray-800"
            }`}
          >
            <Shield className="w-3 h-3 text-emerald-400" />
            SES:{shortSessionId}
            {config.hmsKnowledge ? " // HMS_LOADED" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCypherMode((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-xl border transition-colors ${
              cypherMode
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-gray-900 border-gray-700 text-gray-300 hover:text-white"
            }`}
            title="Toggle Cypher Terminal Effect"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {cypherMode ? "CYPHER:ON" : "CYPHER:OFF"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTrainerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-200 hover:text-white bg-gray-900 hover:bg-gray-800 border border-cyan-500/30 rounded-xl transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Character &amp; HMS Trainer</span>
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="relative z-10 mx-4 mt-3 max-w-3xl self-center w-full flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-2.5 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Messages area */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-8">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border ${
                cypherMode
                  ? "bg-emerald-500/10 border-emerald-400/50 text-emerald-400 cypher-glow"
                  : "bg-gradient-to-br from-blue-500 to-purple-600 border-transparent text-white shadow-lg"
              }`}
            >
              {cypherMode ? (
                <Terminal className="w-8 h-8" />
              ) : (
                <Sparkles className="w-8 h-8" />
              )}
            </div>

            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-400/90 mb-2">
              {cypherMode ? (
                <CypherText text="NEURAL_LINK // ENCRYPTED_SESSION_READY" />
              ) : (
                "AI WORKSPACE READY"
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
              {cypherMode ? (
                <CypherText
                  text={`${config.characterName} — ${config.roleTitle}`}
                />
              ) : (
                `${config.characterName} — ${config.roleTitle}`
              )}
            </h1>

            <p className="text-gray-400 mb-7 text-center max-w-lg text-sm">
              Gemini Multimodal &amp; Free AI Models. Upload or paste screenshots
              to analyze UI, errors, or documents with minimal compressed storage.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
              {SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(suggestion.prompt)}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left group ${
                    cypherMode
                      ? "bg-gray-900/80 border-emerald-500/20 hover:border-emerald-400/60 hover:bg-emerald-950/20"
                      : "bg-gray-900 border-gray-800 hover:border-gray-600 hover:bg-gray-800/50"
                  }`}
                >
                  <div className="mt-0.5">{suggestion.icon}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-200 group-hover:text-white">
                      {suggestion.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {suggestion.prompt}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                imageData={message.imageData}
                assistantName={config.characterName}
                cypherMode={cypherMode}
              />
            ))}
            {isLoading &&
              messages[messages.length - 1]?.role === "assistant" &&
              !messages[messages.length - 1]?.content && (
                <div className="py-2">
                  <div className="max-w-3xl mx-auto flex items-center gap-2 px-16 font-mono text-xs text-emerald-400">
                    <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                    <span>DECRYPTING_STREAM...</span>
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="relative z-10">
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          onStop={stop}
          cypherMode={cypherMode}
        />
      </div>

      {/* Character & HMS Knowledge Modal */}
      <TrainerModal
        isOpen={trainerOpen}
        onClose={() => setTrainerOpen(false)}
        config={config}
        onSaved={(updated) => {
          setConfig(updated);
          if (updated.defaultModel) {
            setSelectedModel(updated.defaultModel);
          }
        }}
      />
    </div>
  );
}
