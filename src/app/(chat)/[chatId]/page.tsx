import { use } from "react";
import ChatWorkspace from "@/components/chat/ChatWorkspace";

interface ChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { chatId } = use(params);
  return <ChatWorkspace initialChatId={chatId} />;
}
