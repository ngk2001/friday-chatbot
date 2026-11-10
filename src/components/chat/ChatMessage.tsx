"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, Copy, Check, Terminal } from "lucide-react";
import { useState } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  imageData?: string | null;
  assistantName?: string;
  cypherMode?: boolean;
}

export default function ChatMessage({
  role,
  content,
  imageData,
  assistantName = "F.R.I.D.A.Y",
  cypherMode = true,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const isAssistant = role === "assistant";

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group py-5">
      <div className="max-w-3xl mx-auto flex gap-4 px-4">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
            isAssistant
              ? cypherMode
                ? "bg-emerald-500/15 border-emerald-400/50 text-emerald-400"
                : "bg-gradient-to-br from-blue-500 to-purple-600 border-transparent text-white"
              : cypherMode
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              : "bg-gray-700 border-transparent text-gray-300"
          }`}
        >
          {isAssistant ? (
            cypherMode ? (
              <Terminal className="w-4 h-4" />
            ) : (
              <Bot className="w-5 h-5" />
            )
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-semibold tracking-wide ${
                cypherMode ? "font-mono uppercase" : ""
              } ${
                isAssistant
                  ? cypherMode
                    ? "text-emerald-400"
                    : "text-gray-200"
                  : cypherMode
                  ? "text-cyan-300"
                  : "text-gray-300"
              }`}
            >
              {isAssistant
                ? cypherMode
                  ? `${assistantName} // RESPONSE`
                  : assistantName
                : cypherMode
                ? "OPERATOR // INPUT"
                : "You"}
            </span>
          </div>

          {imageData && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setZoomed(true)}
                className="group/img relative inline-block rounded-xl overflow-hidden border border-emerald-500/30 hover:border-emerald-400 transition-colors"
              >
                <img
                  src={imageData}
                  alt="Uploaded attachment"
                  className="max-h-64 max-w-full object-contain bg-black/40"
                />
                <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 text-[10px] font-mono bg-black/75 text-emerald-300 rounded">
                  VISION_INPUT
                </span>
              </button>
            </div>
          )}

          <div className="prose prose-invert prose-sm max-w-none text-gray-100">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match;

                  if (isInline) {
                    return (
                      <code
                        className="bg-gray-800/90 text-emerald-300 px-1.5 py-0.5 rounded text-sm border border-emerald-500/20"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return (
                    <div className="relative group/code my-3">
                      <div className="flex items-center justify-between bg-gray-900 border border-emerald-500/30 rounded-t-xl px-4 py-2">
                        <span className="text-xs font-mono text-emerald-400">
                          {match[1]}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              String(children).replace(/\n$/, "")
                            );
                          }}
                          className="text-xs font-mono text-gray-400 hover:text-emerald-300 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="bg-gray-950 border border-t-0 border-emerald-500/30 rounded-b-xl p-4 overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0 leading-7">{children}</p>;
                },
                ul({ children }) {
                  return (
                    <ul className="mb-3 list-disc pl-6 space-y-1">
                      {children}
                    </ul>
                  );
                },
                ol({ children }) {
                  return (
                    <ol className="mb-3 list-decimal pl-6 space-y-1">
                      {children}
                    </ol>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-3">
                      <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="bg-gray-800 px-4 py-2 text-left text-sm font-medium text-gray-300 border border-gray-700">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="px-4 py-2 text-sm border border-gray-700">
                      {children}
                    </td>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {isAssistant && content && (
            <button
              type="button"
              onClick={handleCopy}
              className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-emerald-300"
              title="Copy response"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {zoomed && imageData && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <img
            src={imageData}
            alt="Zoomed attachment"
            className="max-h-[90vh] max-w-[90vw] rounded-xl border border-emerald-500/40"
          />
        </div>
      )}
    </div>
  );
}
