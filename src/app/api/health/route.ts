import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  let database = "error";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    database = "disconnected";
  }

  return NextResponse.json({
    status: database === "connected" ? "ok" : "degraded",
    database,
    providers: {
      gemini: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      googleOAuth: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
      githubOAuth: Boolean(
        process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ),
    },
  });
}

