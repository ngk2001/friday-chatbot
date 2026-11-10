import { streamText, type ModelMessage } from "ai";
import { buildSystemPrompt, getModel } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";

export const maxDuration = 60;

const MAX_CONTEXT_MESSAGES = 20;
const MAX_IMAGE_CHARS = 1_500_000;
const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";
const FIRST_CHUNK_TIMEOUT_MS = 12_000;

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
  imageData?: string | null;
}

function normalizeModelId(requestedModel: string): string {
  // Replace deprecated model IDs automatically
  if (!requestedModel || requestedModel === "gemini-2.5-flash") {
    return DEFAULT_GEMINI_MODEL;
  }
  if (requestedModel === "gemini-2.0-flash") {
    return "gemini-flash-lite-latest";
  }
  if (requestedModel === "gemini-2.5-pro") {
    return "gemini-3.1-pro-preview";
  }
  return requestedModel;
}

function buildFallbackQueue(primaryModel: string, hasImage: boolean): string[] {
  const hasGemini = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const candidates: string[] = [];

  if (hasImage) {
    if (hasGemini) {
      if (primaryModel.startsWith("gemini")) candidates.push(primaryModel);
      for (const m of [DEFAULT_GEMINI_MODEL, "gemini-flash-lite-latest"]) {
        if (!candidates.includes(m)) candidates.push(m);
      }
    }
    return candidates;
  }

  if (primaryModel.startsWith("gemini")) {
    if (hasGemini) {
      candidates.push(primaryModel);
      for (const m of [DEFAULT_GEMINI_MODEL, "gemini-flash-lite-latest"]) {
        if (!candidates.includes(m)) candidates.push(m);
      }
    }
    if (hasGroq) candidates.push("llama-3.3-70b-versatile");
    return candidates;
  }

  if (hasGroq) candidates.push(primaryModel);
  if (hasGemini) {
    candidates.push(DEFAULT_GEMINI_MODEL, "gemini-flash-lite-latest");
  }
  return candidates;
}

async function openVerifiedStream(
  modelId: string,
  system: string,
  messages: ModelMessage[]
) {
  let streamError: unknown = null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIRST_CHUNK_TIMEOUT_MS);

  try {
    const result = streamText({
      model: getModel(modelId),
      system,
      messages,
      maxRetries: 0,
      abortSignal: controller.signal,
      onError: ({ error }) => {
        streamError = error;
      },
    });

    const iterator = result.textStream[Symbol.asyncIterator]();
    const first = await iterator.next();
    clearTimeout(timer);

    if (streamError) {
      throw streamError;
    }
    if (first.done) {
      throw new Error(`Model ${modelId} returned an empty response.`);
    }

    return { firstChunk: first.value, iterator };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const rate = checkRateLimit(`chat:${session.user.id}`, 20, 60_000);
    if (!rate.allowed) {
      return new Response(
        JSON.stringify({
          error: `Rate limit reached. Please wait ${rate.retryAfterSec}s before sending another message.`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rate.retryAfterSec),
          },
        }
      );
    }

    const {
      messages,
      chatId,
      model: rawModel = DEFAULT_GEMINI_MODEL,
      saveImage = true,
    }: {
      messages: IncomingMessage[];
      chatId?: string | null;
      model?: string;
      saveImage?: boolean;
    } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages are required", { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1];
    if (
      lastUserMessage.imageData &&
      lastUserMessage.imageData.length > MAX_IMAGE_CHARS
    ) {
      return new Response(
        JSON.stringify({
          error: "Attached image is too large. Please upload a smaller image.",
        }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
    const lastIndex = recentMessages.length - 1;
    const hasLatestImage = Boolean(recentMessages[lastIndex]?.imageData);
    const normalizedModel = normalizeModelId(rawModel);
    const candidates = buildFallbackQueue(normalizedModel, hasLatestImage);

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({
          error: hasLatestImage
            ? "Image analysis requires GOOGLE_GENERATIVE_AI_API_KEY in .env.local."
            : "No AI provider key configured. Add GOOGLE_GENERATIVE_AI_API_KEY or GROQ_API_KEY in .env.local.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const assistantConfig = await prisma.assistantConfig.findUnique({
      where: { userId: session.user.id },
    });

    let chat;
    if (chatId) {
      chat = await prisma.chat.findFirst({
        where: { id: chatId, userId: session.user.id },
      });

      if (!chat) {
        return new Response("Chat not found", { status: 404 });
      }
    } else {
      const baseTitle =
        String(lastUserMessage.content || "").trim() || "Image Analysis Session";
      chat = await prisma.chat.create({
        data: {
          title: baseTitle.substring(0, 100),
          userId: session.user.id,
        },
      });
    }

    const persistedImage =
      saveImage && lastUserMessage.imageData ? lastUserMessage.imageData : null;

    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "user",
        content: String(lastUserMessage.content || "Analyze this image."),
        imageData: persistedImage,
      },
    });

    await prisma.chat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() },
    });

    const formattedMessages: ModelMessage[] = recentMessages.map((m, idx) => {
      if (m.role === "user" && m.imageData && idx === lastIndex) {
        return {
          role: "user",
          content: [
            {
              type: "text",
              text: String(m.content || "Please analyze this image in detail."),
            },
            {
              type: "image",
              image: m.imageData,
            },
          ],
        };
      }

      if (m.role === "assistant") {
        return {
          role: "assistant",
          content: String(m.content || ""),
        };
      }

      return {
        role: "user",
        content: m.imageData
          ? `[Image was analyzed earlier] ${String(m.content || "")}`
          : String(m.content || ""),
      };
    });

    const systemPrompt = buildSystemPrompt(assistantConfig);

    // Try primary model then fallback models until first token succeeds
    let activeModelId = candidates[0];
    let opened: { firstChunk: string; iterator: AsyncIterator<string> } | null =
      null;
    let lastError: unknown = null;

    for (const candidate of candidates) {
      try {
        opened = await openVerifiedStream(
          candidate,
          systemPrompt,
          formattedMessages
        );
        activeModelId = candidate;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${candidate} failed, trying fallback:`, err);
      }
    }

    if (!opened) {
      const msg =
        lastError instanceof Error
          ? lastError.message
          : "All configured AI models failed to respond.";
      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const { firstChunk, iterator } = opened;
    let fullText = firstChunk;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(firstChunk));
          while (true) {
            const next = await iterator.next();
            if (next.done) break;
            if (next.value) {
              fullText += next.value;
              controller.enqueue(encoder.encode(next.value));
            }
          }
          if (fullText) {
            await prisma.message.create({
              data: {
                chatId: chat.id,
                role: "assistant",
                content: fullText,
              },
            });
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Chat-Id": chat.id,
        "X-Effective-Model": activeModelId,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to process chat request",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
