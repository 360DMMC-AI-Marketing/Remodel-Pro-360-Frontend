import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  Search,
  Send,
  MessageSquare,
  EllipsisVertical,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/atoms/Input";
import { messageService, type MessageRecord } from "@/api/message";
import { getProjectById, getProjectsWithFilters } from "@/api/porject";
import { bidService } from "@/api/bid";
import { useAuth } from "@/stores/useAuth";

type PersonSummary = {
  _id?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
};

type MessageProject = {
  _id: string;
  title: string;
  status?: string;
  homeownerId?: string;
  homeowner?: PersonSummary;
  contractorId?: string;
  contractor?: PersonSummary;
};

const toPerson = (value: any): PersonSummary | undefined => {
  if (!value || typeof value === "string") return undefined;
  return {
    _id: value._id,
    fullName: value.fullName,
    firstName: value.firstName,
    lastName: value.lastName,
  };
};

const toMessageProject = (project: any): MessageProject => ({
  _id: project._id,
  title: project.title ?? "Untitled project",
  status: project.status,
  homeownerId:
    typeof project.homeownerId === "string"
      ? project.homeownerId
      : project.homeownerId?._id,
  homeowner: toPerson(project.homeownerId),
  contractorId:
    typeof project.contractorId === "string"
      ? project.contractorId
      : project.contractorId?._id,
  contractor: toPerson(project.contractorId),
});

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const canEditWithinTenMinutes = (createdAt?: string) => {
  if (!createdAt) return false;
  const createdAtMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtMs)) return false;
  const tenMinutesInMs = 10 * 60 * 1000;
  return Date.now() - createdAtMs < tenMinutesInMs;
};

const getSenderId = (sender: MessageRecord["senderId"]) => {
  if (!sender) return "";
  if (typeof sender === "string") return sender;
  return sender._id ?? "";
};

const getSenderDisplayName = (sender: MessageRecord["senderId"]) => {
  if (!sender || typeof sender === "string") return "User";
  const full = `${sender.firstName ?? ""} ${sender.lastName ?? ""}`.trim();
  return full || "User";
};

const getDeliveryLabel = (message: MessageRecord, mine: boolean) => {
  if (!mine) return "Received";
  return message.isRead ? "Seen" : "Sent";
};

type MessageReadEvent = {
  messageId: string;
  projectId: string;
  readBy: string;
  isRead: boolean;
};

type MessageDeletedEvent = {
  messageId: string;
  projectId: string;
  deletedBy: string;
};

const getDisplayName = (person?: PersonSummary) => {
  if (!person) return "Unknown";
  if (person.fullName) return person.fullName;
  const composed = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return composed || "Unknown";
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  return parts
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
};

const getAvatarClass = (seed: string) => {
  const variants = [
    "from-primary-400 to-primary-600",
    "from-indigo-400 to-indigo-600",
    "from-cyan-400 to-cyan-600",
    "from-emerald-400 to-emerald-600",
  ];
  const key = seed || "default";
  const index = key.charCodeAt(0) % variants.length;
  return variants[index];
};

const MessagesPage = () => {
  const { role, user, token } = useAuth();
  const [projects, setProjects] = useState<MessageProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const upsertMessage = (incoming: MessageRecord) => {
    setMessages((current) => {
      if (current.some((item) => item._id === incoming._id)) return current;
      return [...current, incoming].sort((a, b) => {
        const aTime = new Date(a.createdAt ?? 0).getTime();
        const bTime = new Date(b.createdAt ?? 0).getTime();
        return aTime - bTime;
      });
    });
  };

  const currentUserId = useMemo(() => {
    if (!user) return "";
    const candidate = user as unknown as { id?: string; _id?: string };
    return candidate.id ?? candidate._id ?? "";
  }, [user]);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const receiverId = useMemo(() => {
    if (!selectedProject) return undefined;
    if (role === "homeowner") return selectedProject.contractorId;
    if (role === "contractor") return selectedProject.homeownerId;
    return undefined;
  }, [role, selectedProject]);

  const contactName = useMemo(() => {
    if (!selectedProject) return "";
    if (role === "homeowner") return getDisplayName(selectedProject.contractor);
    if (role === "contractor") return getDisplayName(selectedProject.homeowner);
    return "Unknown";
  }, [selectedProject, role]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => {
      const name =
        role === "homeowner"
          ? getDisplayName(project.contractor)
          : getDisplayName(project.homeowner);
      return (
        name.toLowerCase().includes(query) ||
        project.title.toLowerCase().includes(query)
      );
    });
  }, [projects, role, searchQuery]);

  const loadHomeownerProjects = async () => {
    const response = await getProjectsWithFilters({ page: 1, limit: 100 });
    return (response.projects ?? []).map((project: any) => toMessageProject(project));
  };

  const loadContractorProjects = async () => {
    const [biddingProjects, bidList] = await Promise.all([
      bidService.getBiddingProjects(),
      bidService.getMyBids(),
    ]);

    const projectMap = new Map<string, MessageProject>(
      biddingProjects.map((project) => [project._id, toMessageProject(project)]),
    );

    const bidProjectIds = Array.from(
      new Set(
        bidList
          .map((bid) =>
            typeof bid.projectId === "string" ? bid.projectId : bid.projectId?._id,
          )
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const missingIds = bidProjectIds.filter((id) => !projectMap.has(id));
    const missingResults = await Promise.allSettled(
      missingIds.map((projectId) => getProjectById(projectId)),
    );

    for (const result of missingResults) {
      if (result.status === "fulfilled" && result.value?.project?._id) {
        projectMap.set(
          result.value.project._id,
          toMessageProject(result.value.project),
        );
      }
    }

    return Array.from(projectMap.values());
  };

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      let data: MessageProject[] = [];

      if (role === "homeowner") {
        data = await loadHomeownerProjects();
      } else if (role === "contractor") {
        data = await loadContractorProjects();
      }

      setProjects(data);
    } catch {
      toast.error("Failed to load conversations.");
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadMessages = async (projectId: string) => {
    try {
      setLoadingMessages(true);
      const data = await messageService.getProjectMessages(projectId, 1, 100);
      const sorted = [...data].sort((a, b) => {
        const aTime = new Date(a.createdAt ?? 0).getTime();
        const bTime = new Date(b.createdAt ?? 0).getTime();
        return aTime - bTime;
      });
      setMessages(sorted);
    } catch {
      toast.error("Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, [role]);

  useEffect(() => {
    if (!selectedProjectId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!token || !selectedProjectId) return;

    const apiBase =
      (import.meta.env.VITE_API_URL as string | undefined) ||
      "http://localhost:3000/api";
    const socketUrl = apiBase.replace(/\/api\/?$/, "");

    const socket: Socket = io(socketUrl, {
      transports: ["websocket"],
      auth: { token },
    });

    const handleConnect = () => {
      socket.emit("join_project", selectedProjectId);
    };

    socket.on("connect", handleConnect);
    socket.on("new_message", (incoming: MessageRecord) => {
      if (String(incoming.projectId) !== String(selectedProjectId)) return;
      upsertMessage(incoming);
    });

    socket.on("message_read", (event: MessageReadEvent) => {
      if (String(event.projectId) !== String(selectedProjectId)) return;
      setMessages((current) =>
        current.map((message) =>
          message._id === event.messageId
            ? { ...message, isRead: event.isRead }
            : message,
        ),
      );
    });

    socket.on("message_updated", (incoming: MessageRecord) => {
      if (String(incoming.projectId) !== String(selectedProjectId)) return;
      setMessages((current) =>
        current.map((message) =>
          message._id === incoming._id ? { ...message, ...incoming } : message,
        ),
      );
    });

    socket.on("message_deleted", (event: MessageDeletedEvent) => {
      if (String(event.projectId) !== String(selectedProjectId)) return;
      setMessages((current) =>
        current.filter((message) => message._id !== event.messageId),
      );
      setOpenMessageMenuId((current) =>
        current === event.messageId ? null : current,
      );
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [token, selectedProjectId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const handleWindowClick = () => setOpenMessageMenuId(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  useEffect(() => {
    const unreadIncoming = messages.filter((message) => {
      const mine = getSenderId(message.senderId) === currentUserId;
      return !mine && !message.isRead;
    });

    if (!unreadIncoming.length) return;

    const markIncomingAsRead = async () => {
      const ids = unreadIncoming.map((message) => message._id);
      await Promise.allSettled(ids.map((id) => messageService.markAsRead(id)));

      setMessages((current) =>
        current.map((message) =>
          ids.includes(message._id) ? { ...message, isRead: true } : message,
        ),
      );
    };

    void markIncomingAsRead();
  }, [messages, currentUserId]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!selectedProjectId || !content) return;
    if (!receiverId) {
      toast.error("Conversation is not available until both parties are assigned.");
      return;
    }

    try {
      setSending(true);
      const sent = await messageService.sendMessage(selectedProjectId, content, receiverId);
      upsertMessage(sent);
      setDraft("");
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = (messageId: string) => {
    const target = messages.find((message) => message._id === messageId);
    if (!target) {
      setOpenMessageMenuId(null);
      return;
    }

    if (!canEditWithinTenMinutes(target.createdAt)) {
      setOpenMessageMenuId(null);
      toast.error("You can only edit a message within 10 minutes.");
      return;
    }

    const nextValue = window.prompt("Edit your message", target.content ?? "");
    if (nextValue === null) {
      setOpenMessageMenuId(null);
      return;
    }

    const content = nextValue.trim();
    if (!content) {
      setOpenMessageMenuId(null);
      toast.error("Message content cannot be empty.");
      return;
    }

    void (async () => {
      try {
        const updated = await messageService.editMessage(messageId, content);
        setMessages((current) =>
          current.map((message) =>
            message._id === updated._id ? { ...message, ...updated } : message,
          ),
        );
      } catch {
        toast.error("Failed to edit message.");
      } finally {
        setOpenMessageMenuId(null);
      }
    })();
  };

  const handleDeleteMessage = (messageId: string) => {
    const confirmed = window.confirm("Delete this message?");
    if (!confirmed) {
      setOpenMessageMenuId(null);
      return;
    }

    void (async () => {
      try {
        await messageService.deleteMessage(messageId);
        setMessages((current) =>
          current.filter((message) => message._id !== messageId),
        );
      } catch {
        toast.error("Failed to delete message.");
      } finally {
        setOpenMessageMenuId(null);
      }
    })();
  };

  return (
    <div className="grid h-screen grid-cols-12 overflow-hidden">
      <div
        className={`col-span-12 h-full flex-col border-r border-r-neutral-300 bg-white md:col-span-4 md:flex lg:col-span-3 ${
          selectedProjectId ? "hidden" : "flex"
        }`}
      >
        <div className="border-b border-b-neutral-200 p-4">
          <h6>Messages</h6>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="bg-neutral-100 pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingProjects ? (
            <p className="p-4 text-sm text-neutral-500">Loading conversations...</p>
          ) : filteredProjects.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">
              {searchQuery ? "No conversations match your search." : "No conversations available yet."}
            </p>
          ) : (
            filteredProjects.map((project) => {
              const active = selectedProjectId === project._id;
              const name =
                role === "homeowner"
                  ? getDisplayName(project.contractor)
                  : getDisplayName(project.homeowner);
              const avatarClass = getAvatarClass(project._id);

              return (
                <button
                  key={project._id}
                  type="button"
                  onClick={() => setSelectedProjectId(project._id)}
                  className={`relative flex w-full items-center gap-3 border-b border-b-neutral-200 p-4 text-left transition-colors ${
                    active ? "bg-neutral-100" : "hover:bg-neutral-100"
                  }`}
                >
                  <div
                    className={`size-10 rounded-full bg-linear-to-br ${avatarClass} flex items-center justify-center text-white font-semibold`}
                  >
                    {getInitials(name)}
                  </div>
                  <div className="min-w-0">
                    <h6 className="font-normal">{name}</h6>
                    <p className="truncate text-sm text-neutral-500">{project.title}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div
        className={`col-span-12 h-full overflow-hidden bg-neutral-100 md:col-span-8 md:block lg:col-span-9 ${
          selectedProjectId ? "block" : "hidden"
        }`}
      >
        {!selectedProject ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center">
              <MessageSquare className="mx-auto mb-3 size-8 text-neutral-400" />
              <h6 className="mb-1">Your messages</h6>
              <p className="text-sm text-neutral-500">
                Select a conversation from the left to open the chat.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="flex h-header items-center border-b border-b-neutral-300 bg-white px-6">
              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="mr-2 rounded-full p-1 text-neutral-500 hover:bg-neutral-100 md:hidden"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div
                className={`mr-4 size-12 rounded-full bg-linear-to-br ${getAvatarClass(receiverId ?? selectedProject._id)} flex items-center justify-center text-white font-semibold`}
              >
                {getInitials(contactName)}
              </div>
              <div>
                <h6 className="font-normal">{contactName}</h6>
                <div className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-green-500" />
                  <span className="text-sm text-neutral-500">Online</span>
                </div>
              </div>
            </div>

            <div ref={listRef} className="h-[calc(100vh-8rem)] overflow-y-auto p-6">
              {loadingMessages ? (
                <p className="text-sm text-neutral-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-neutral-500">No messages yet. Start the conversation.</p>
              ) : (
                messages.map((message) => {
                  const mine = getSenderId(message.senderId) === currentUserId;
                  const canEditMessage = canEditWithinTenMinutes(message.createdAt);
                  return (
                    <div
                      key={message._id}
                      className={`group mb-2 flex w-full ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex items-center gap-1">
                        {mine ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenMessageMenuId((current) =>
                                  current === message._id ? null : message._id,
                                );
                              }}
                              className={`rounded-full p-1 text-neutral-500 transition-opacity hover:bg-neutral-200 ${
                                openMessageMenuId === message._id
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                              }`}
                              aria-label="Message options"
                            >
                              <EllipsisVertical className="size-4" />
                            </button>

                            {openMessageMenuId === message._id ? (
                              <div
                                className="absolute left-0 z-20 mt-1 w-36 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  disabled={!canEditMessage}
                                  title={
                                    canEditMessage
                                      ? "Edit message"
                                      : "Editing is available for 10 minutes only"
                                  }
                                  onClick={() => handleEditMessage(message._id)}
                                  className="w-full px-3 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(message._id)}
                                  className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        <div
                          className={`rounded-2xl px-4 py-3 text-base ${
                            mine
                              ? "rounded-tr-lg bg-linear-to-br from-primary-400 to-primary-600 text-white"
                              : "rounded-tl-lg bg-neutral-200 text-neutral-900"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          {message.attachments && message.attachments.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment, idx) => (
                                <a
                                  key={`${message._id}-attachment-${idx}`}
                                  href={attachment}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`block truncate text-xs underline ${mine ? "text-white" : "text-primary"}`}
                                >
                                  Attachment {idx + 1}
                                </a>
                              ))}
                            </div>
                          ) : null}
                          <p className={`mt-1 text-right text-[11px] ${mine ? "text-white/80" : "text-neutral-500"}`}>
                            {mine ? "You" : getSenderDisplayName(message.senderId)} • {formatTime(message.createdAt)} • {getDeliveryLabel(message, mine)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="h-header border-t border-t-neutral-300 bg-white">
              <div className="flex h-full gap-4 px-6 py-3">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  className="flex-1 bg-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || !draft.trim()}
                  className="cursor-pointer rounded-lg bg-primary-500 p-3 text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="size-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
