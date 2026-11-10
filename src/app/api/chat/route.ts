import { streamText, type ModelMessage } from "ai";
import { buildSystemPrompt, getModel } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";

export const maxDuration = 60;

const MAX_CONTEXT_MESSAGES = 20;
const MAX_IMAGE_CHARS = 1_500_000; // ~1.1 MB decoded image ceiling

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
  imageData?: string | null;
}

function resolveAvailableModel(requestedModel: string, hasImage: boolean): {
  modelId: string | null;
  error?: string;
} {
  const hasGemini = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  const hasGroq = Boolean(process.env.GROQ_API_KEY);

  if (hasImage) {
    if (!hasGemini) {
      return {
        modelId: null,
        error:
          "Image analysis requires GOOGLE_GENERATIVE_AI_API_KEY in your environment variables.",
      };
    }
    return {
      modelId: requestedModel.startsWith("gemini")
        ? requestedModel
        : "gemini-2.5-flash",
    };
  }

  if (requestedModel.startsWith("gemini")) {
    if (hasGemini) return { modelId: requestedModel };
    if (hasGroq) return { modelId: "llama-3.3-70b-versatile" };
    return {
      modelId: null,
      error:
        "Missing GOOGLE_GENERATIVE_AI_API_KEY (or GROQ_API_KEY fallback) in environment variables.",
    };
  }

  if (hasGroq) return { modelId: requestedModel };
  if (hasGemini) return { modelId: "gemini-2.5-flash" };
  return {
    modelId: null,
    error:
      "Missing GROQ_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY fallback) in environment variables.",
  };
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
      model: requestedModel = "gemini-2.5-flash",
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

    // Keep context window lean (last 20 turns) and only attach image bytes from the latest turn
    const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
    const lastIndex = recentMessages.length - 1;
    const hasLatestImage = Boolean(recentMessages[lastIndex]?.imageData);

    const resolved = resolveAvailableModel(requestedModel, hasLatestImage);
    if (!resolved.modelId) {
      return new Response(JSON.stringify({ error: resolved.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
    let activeModelId = resolved.modelId;

    const runStream = (modelId: string) =>
      streamText({
        model: getModel(modelId),
        system: systemPrompt,
        messages: formattedMessages,
        onFinish: async ({ text }) => {
          if (text) {
            await prisma.message.create({
              data: {
                chatId: chat.id,
                role: "assistant",
                content: text,
              },
            });
          }
        },
      });

    let result;
    try {
      result = runStream(activeModelId);
    } catch (primaryErr) {
      // Automatic fallback from Gemini -> Groq (or vice versa) on text requests
      if (!hasLatestImage && activeModelId.startsWith("gemini") && process.env.GROQ_API_KEY) {
        activeModelId = "llama-3.3-70b-versatile";
        result = runStream(activeModelId);
      } else if (!hasLatestImage && !activeModelId.startsWith("gemini") && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        activeModelId = "gemini-2.5-flash";
        result = runStream(activeModelId);
      } else {
        throw primaryErr;
      }
    }

    return result.toTextStreamResponse({
      headers: {
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
