import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            imageData: true,
            createdAt: true,
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Failed to fetch chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const { title } = await req.json();

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const existing = await prisma.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data: { title: title.trim().slice(0, 100) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to rename chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    await prisma.chat.delete({
      where: { id: chatId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
