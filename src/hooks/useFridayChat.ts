"use client";

import { useState, useRef, useCallback } from "react";
import { generateId } from "@/lib/utils";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageData?: string | null;
}

interface UseFridayChatOptions {
  chatId: string | null;
  model: string;
  initialMessages?: ChatMessageItem[];
  onChatCreated?: (newChatId: string) => void;
}

export function useFridayChat({
  chatId,
  model,
  initialMessages = [],
  onChatCreated,
}: UseFridayChatOptions) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      options?: { imageData?: string | null; saveImage?: boolean }
    ) => {
      const trimmed = content.trim();
      const imageData = options?.imageData ?? null;
      const saveImage = options?.saveImage ?? true;

      if ((!trimmed && !imageData) || isLoading) return;

      setError(null);
      const userMsg: ChatMessageItem = {
        id: generateId(),
        role: "user",
        content: trimmed || "Analyze this image.",
        imageData,
      };
      const assistantId = generateId();

      const historyPayload = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
        imageData: m.imageData ?? null,
      }));

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setIsLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId,
            model,
            saveImage,
            messages: historyPayload,
          }),
          signal: controller.signal,
        });

        const returnedChatId = res.headers.get("X-Chat-Id");
        if (returnedChatId && !chatId) {
          onChatCreated?.(returnedChatId);
          window.dispatchEvent(new Event("friday:chats-updated"));
        }

        if (!res.ok) {
          let errText = "Failed to get AI response";
          try {
            const errJson = await res.json();
            if (errJson?.error) errText = errJson.error;
          } catch {
            const raw = await res.text();
            if (raw) errText = raw;
          }
          setError(errText);
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }

        if (!res.body) {
          throw new Error("Empty response stream");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const currentText = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: currentText } : m
            )
          );
        }

        window.dispatchEvent(new Event("friday:chats-updated"));
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(
            err instanceof Error ? err.message : "Network error while streaming"
          );
          setMessages((prev) =>
            prev.filter((m) => !(m.id === assistantId && !m.content))
          );
        }
      } finally {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    },
    [chatId, isLoading, messages, model, onChatCreated]
  );

  return {
    messages,
    setMessages,
    sendMessage,
    isLoading,
    error,
    stop,
  };
}
