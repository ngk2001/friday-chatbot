import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/chat/Sidebar";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
