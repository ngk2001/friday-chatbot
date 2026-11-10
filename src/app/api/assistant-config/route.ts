import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_ASSISTANT_PERSONA } from "@/lib/ai";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await prisma.assistantConfig.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json(config ?? DEFAULT_ASSISTANT_PERSONA);
  } catch (error) {
    console.error("Failed to fetch assistant config:", error);
    return NextResponse.json(
      { error: "Failed to load assistant configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const characterName =
      typeof body.characterName === "string" && body.characterName.trim()
        ? body.characterName.trim()
        : DEFAULT_ASSISTANT_PERSONA.characterName;
    const roleTitle =
      typeof body.roleTitle === "string" && body.roleTitle.trim()
        ? body.roleTitle.trim()
        : DEFAULT_ASSISTANT_PERSONA.roleTitle;
    const personality =
      typeof body.personality === "string" && body.personality.trim()
        ? body.personality.trim()
        : DEFAULT_ASSISTANT_PERSONA.personality;
    const rules =
      typeof body.rules === "string" && body.rules.trim()
        ? body.rules.trim()
        : DEFAULT_ASSISTANT_PERSONA.rules;
    const hmsKnowledge =
      typeof body.hmsKnowledge === "string" ? body.hmsKnowledge : "";
    const defaultModel =
      typeof body.defaultModel === "string" && body.defaultModel.trim()
        ? body.defaultModel.trim()
        : DEFAULT_ASSISTANT_PERSONA.defaultModel;

    const saved = await prisma.assistantConfig.upsert({
      where: { userId: session.user.id },
      update: {
        characterName,
        roleTitle,
        personality,
        rules,
        hmsKnowledge,
        defaultModel,
      },
      create: {
        userId: session.user.id,
        characterName,
        roleTitle,
        personality,
        rules,
        hmsKnowledge,
        defaultModel,
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Failed to save assistant config:", error);
    return NextResponse.json(
      { error: "Failed to save assistant configuration" },
      { status: 500 }
    );
  }
}

