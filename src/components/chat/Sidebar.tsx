"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Plus,
  MessageSquare,
  Trash2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Search,
  Pencil,
  Check,
  Terminal,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ChatSessionItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = useState<ChatSessionItem[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  useEffect(() => {
    fetchChats();
    const onUpdated = () => fetchChats();
    window.addEventListener("friday:chats-updated", onUpdated);
    return () => window.removeEventListener("friday:chats-updated", onUpdated);
  }, [pathname]);

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (res.ok) {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (pathname === `/${chatId}`) {
          router.push("/");
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const startRename = (chat: ChatSessionItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(chat.id);
    setEditingTitle(chat.title);
  };

  const commitRename = async (chatId: string, e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        setChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, title: trimmed } : c))
        );
      }
    } catch (err) {
      console.error("Failed to rename session:", err);
    } finally {
      setEditingId(null);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const groupedChats = filteredChats.reduce<Record<string, ChatSessionItem[]>>(
    (acc, chat) => {
      const label = formatDate(chat.updatedAt);
      if (!acc[label]) acc[label] = [];
      acc[label].push(chat);
      return acc;
    },
    {}
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-3.5 left-4 z-50 p-2 bg-gray-900 border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-white"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-gray-950/95 border-r border-emerald-500/20 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Terminal Brand + New Session */}
        <div className="p-3 space-y-2.5 border-b border-emerald-500/15">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Terminal className="w-4 h-4" />
              <span className="font-semibold tracking-wider">
                F.R.I.D.A.Y // SESSIONS
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {chats.length}
            </span>
          </div>

          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono text-xs font-semibold tracking-wide transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ NEW_SESSION</span>
          </Link>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter sessions..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-900/80 border border-gray-800 focus:border-emerald-500/40 rounded-lg text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {Object.entries(groupedChats).map(([label, groupChats]) => (
            <div key={label}>
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-gray-500 px-2 mb-1.5">
                {label}
              </h3>
              <div className="space-y-1">
                {groupChats.map((chat) => {
                  const active = pathname === `/${chat.id}`;
                  const isEditing = editingId === chat.id;

                  return (
                    <div key={chat.id}>
                      {isEditing ? (
                        <form
                          onSubmit={(e) => commitRename(chat.id, e)}
                          className="flex items-center gap-1 px-2 py-1.5 bg-gray-900 border border-emerald-500/40 rounded-xl"
                        >
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => commitRename(chat.id)}
                            className="flex-1 bg-transparent text-xs text-white focus:outline-none min-w-0"
                          />
                          <button
                            type="submit"
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <Link
                          href={`/${chat.id}`}
                          onClick={() => setIsOpen(false)}
                          className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors ${
                            active
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                              : "border-transparent text-gray-400 hover:text-white hover:bg-gray-900/80"
                          }`}
                        >
                          <MessageSquare
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              active ? "text-emerald-400" : ""
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-xs font-medium">
                              {chat.title}
                            </div>
                            <div className="text-[10px] font-mono text-gray-600">
                              {chat._count?.messages ?? 0} msgs
                              {active ? " • LIVE" : ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => startRename(chat, e)}
                              title="Rename session"
                              className="p-1 hover:text-cyan-400"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => deleteChat(chat.id, e)}
                              title="Delete session"
                              className="p-1 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredChats.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-7 h-7 text-gray-700 mx-auto mb-2" />
              <p className="text-xs font-mono text-gray-600">
                {search ? "No matching sessions" : "No active sessions yet"}
              </p>
            </div>
          )}
        </div>

        {/* User section */}
        {session?.user && (
          <div className="p-3 border-t border-emerald-500/15">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-900 transition-colors"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full border border-emerald-500/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-xs font-mono font-bold">
                    {session.user.name?.[0] || session.user.email?.[0] || "?"}
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs font-medium text-gray-200 truncate">
                    {session.user.name || session.user.email}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400/80">
                    SESSION_AUTH // OK
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-900 border border-emerald-500/30 rounded-xl overflow-hidden shadow-xl">
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-mono text-gray-300 hover:bg-gray-800 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    DISCONNECT // SIGN OUT
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
