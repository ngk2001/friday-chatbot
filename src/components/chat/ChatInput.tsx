"use client";

import { useState, useRef, useEffect } from "react";
import {
  SendHorizontal,
  Square,
  ImagePlus,
  X,
  HardDrive,
} from "lucide-react";
import { compressImageFile, CompressedImage } from "@/lib/imageUtils";

interface ChatInputProps {
  onSend: (
    message: string,
    options?: { imageData?: string | null; saveImage?: boolean }
  ) => void;
  isLoading: boolean;
  onStop?: () => void;
  cypherMode?: boolean;
}

export default function ChatInput({
  onSend,
  isLoading,
  onStop,
  cypherMode = true,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<CompressedImage | null>(
    null
  );
  const [saveImageToHistory, setSaveImageToHistory] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setCompressing(true);
    try {
      const compressed = await compressImageFile(file);
      setAttachedImage(compressed);
    } catch (err) {
      console.error("Image compression failed:", err);
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading || compressing) return;
    onSend(input.trim() || "Analyze this image.", {
      imageData: attachedImage?.dataUrl ?? null,
      saveImage: saveImageToHistory,
    });
    setInput("");
    setAttachedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          void handleImageFile(file);
          break;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleImageFile(file);
  };

  return (
    <div
      className={`border-t p-4 backdrop-blur-xl ${
        cypherMode
          ? "border-emerald-500/20 bg-gray-950/85"
          : "border-gray-800 bg-gray-950/80"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className="max-w-3xl mx-auto"
      >
        {/* Image Preview */}
        {attachedImage && (
          <div className="mb-2.5 flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-gray-900/90 border border-emerald-500/30">
            <div className="relative">
              <img
                src={attachedImage.dataUrl}
                alt="Upload preview"
                className="w-16 h-16 object-cover rounded-lg border border-gray-700"
              />
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="absolute -top-2 -right-2 p-0.5 bg-gray-900 border border-gray-600 rounded-full text-gray-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-emerald-300 truncate">
                {attachedImage.name}
              </div>
              <div className="text-[11px] font-mono text-gray-400">
                Compressed: {attachedImage.sizeKb} KB (Gemini Vision ready)
              </div>
              <label className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveImageToHistory}
                  onChange={(e) => setSaveImageToHistory(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-0"
                />
                <HardDrive className="w-3 h-3 text-cyan-400" />
                {saveImageToHistory
                  ? `Save preview in chat history (${attachedImage.sizeKb} KB)`
                  : "Analyze only — 0 KB saved in database"}
              </label>
            </div>
          </div>
        )}

        <div
          className={`relative flex items-end rounded-2xl border transition-all ${
            isDragging
              ? "border-emerald-400 bg-emerald-950/20"
              : cypherMode
              ? "bg-gray-900/90 border-emerald-500/30 focus-within:border-emerald-400 cypher-glow"
              : "bg-gray-900 border-gray-700 focus-within:border-gray-500"
          }`}
        >
          {/* Image Upload Button */}
          <div className="flex items-center pl-3 pb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImageFile(f);
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload or paste image for Gemini Vision analysis"
              className={`p-1.5 rounded-lg transition-colors ${
                cypherMode
                  ? "text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <ImagePlus className="w-4 h-4" />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              compressing
                ? "Compressing image..."
                : cypherMode
                ? "> Enter command, query, or drop/paste screenshot..."
                : "Message F.R.I.D.A.Y (paste or upload image)..."
            }
            rows={1}
            className={`flex-1 bg-transparent text-white placeholder-gray-500 px-3 py-3.5 resize-none focus:outline-none max-h-[200px] ${
              cypherMode ? "font-mono text-sm" : ""
            }`}
          />

          <div className="flex items-center pr-3 pb-3">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-400 transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={(!input.trim() && !attachedImage) || compressing}
                className={`p-1.5 rounded-lg disabled:opacity-30 transition-colors ${
                  cypherMode
                    ? "bg-emerald-500 text-gray-950 hover:bg-emerald-400"
                    : "bg-white text-gray-900 hover:bg-gray-200"
                }`}
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-gray-500 text-center mt-2 font-mono">
          {cypherMode
            ? "[VISION: AUTO-COMPRESSED ~80KB] • Drag/drop or Ctrl+V images • Gemini 2.5 Multimodal"
            : "F.R.I.D.A.Y can analyze uploaded or pasted images with Gemini Vision."}
        </p>
      </form>
    </div>
  );
}
