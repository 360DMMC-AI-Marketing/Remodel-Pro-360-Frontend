import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  Search,
  Send,
  MessageSquare,
  EllipsisVertical,
  ChevronLeft,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/atoms/Input";
import { messageService, type MessageRecord } from "@/api/message";
import { getProjectById, getProjectsWithFilters } from "@/api/project";
import { bidService } from "@/api/bid";
import { useAuth } from "@/stores/useAuth";
import { getImageUrl } from "@/lib/utils";

type PersonSummary = {
  _id?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
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

type RawPerson = PersonSummary | string | null | undefined;

type RawProject = {
  _id: string;
  title?: string;
  status?: string;
  homeownerId?: RawPerson;
  contractorId?: RawPerson;
};

const toPerson = (value: RawPerson): PersonSummary | undefined => {
  if (!value || typeof value === "string") return undefined;
  return {
    _id: value._id,
    fullName: value.fullName,
    firstName: value.firstName,
    lastName: value.lastName,
    avatar: (value as PersonSummary).avatar,
  };
};

const toMessageProject = (project: RawProject): MessageProject => ({
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

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getDateLabel = (date: Date): string => {
  const now = new Date();
  if (isSameDay(date, now)) return formatTime(date.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return `Yesterday · ${formatTime(date.toISOString())}`;
  const sameYear = date.getFullYear() === now.getFullYear();
  const dateStr = date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `${dateStr} · ${formatTime(date.toISOString())}`;
};

const isEdited = (message: MessageRecord) => {
  if (!message.updatedAt || !message.createdAt) return false;
  return new Date(message.updatedAt).getTime() - new Date(message.createdAt).getTime() > 2000;
};

const TEN_MINUTES = 10 * 60 * 1000;

const shouldShowSeparator = (
  current: MessageRecord,
  previous: MessageRecord | undefined,
): boolean => {
  const currentDate = new Date(current.createdAt ?? 0);
  if (!previous) return true;
  const previousDate = new Date(previous.createdAt ?? 0);
  if (!isSameDay(currentDate, previousDate)) return true;
  return currentDate.getTime() - previousDate.getTime() > TEN_MINUTES;
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
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [filesTab, setFilesTab] = useState<"images" | "files">("images");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [unreadMap, setUnreadMap] = useState<Map<string, number>>(new Map());
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<"above" | "below">("below");

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

  const contactPerson = useMemo(() => {
    if (!selectedProject) return undefined;
    if (role === "homeowner") return selectedProject.contractor;
    if (role === "contractor") return selectedProject.homeowner;
    return undefined;
  }, [selectedProject, role]);

  const contactName = useMemo(() => getDisplayName(contactPerson), [contactPerson]);

  const sharedFiles = useMemo(() => {
    const files: { url: string; name: string; isImage: boolean; date: string }[] = [];
    for (const msg of messages) {
      for (const att of msg.attachments ?? []) {
        const urlPath = att.split("?")[0];
        const isImage = /\.(jpe?g|png|webp|gif)$/i.test(urlPath);
        const rawName = urlPath.split("/").pop() ?? "file";
        files.push({
          url: att,
          name: decodeURIComponent(rawName),
          isImage,
          date: msg.createdAt,
        });
      }
    }
    return files;
  }, [messages]);

  const sharedImages = useMemo(() => sharedFiles.filter((f) => f.isImage), [sharedFiles]);
  const sharedDocs = useMemo(() => sharedFiles.filter((f) => !f.isImage), [sharedFiles]);

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
    return (response.projects ?? [])
      .map((project: RawProject) => toMessageProject(project))
      .filter((project) => project.contractorId);
  };

  const loadContractorProjects = async () => {
    const bidList = await bidService.getMyBids();
    const acceptedBids = bidList.filter((bid) => bid.status === "accepted");

    const projectIds = Array.from(
      new Set(
        acceptedBids
          .map((bid) =>
            typeof bid.projectId === "string" ? bid.projectId : bid.projectId?._id,
          )
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const results = await Promise.allSettled(
      projectIds.map((projectId) => getProjectById(projectId)),
    );

    const projects: MessageProject[] = [];
    for (const result of results) {
      if (result.status === "fulfilled" && result.value?.project?._id) {
        projects.push(toMessageProject(result.value.project));
      }
    }

    return projects;
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

  const loadMessages = async (projectId: string, page = 1, prepend = false) => {
    try {
      if (prepend) setLoadingOlder(true);
      else setLoadingMessages(true);

      const result = await messageService.getProjectMessages(projectId, page, 30);
      const sorted = [...result.messages].sort((a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
      );

      if (prepend) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const newOnes = sorted.filter((m) => !existingIds.has(m._id));
          return [...newOnes, ...prev];
        });
      } else {
        setMessages(sorted);
      }

      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
    } catch {
      toast.error("Failed to load messages.");
    } finally {
      setLoadingMessages(false);
      setLoadingOlder(false);
    }
  };

  const handleLoadOlder = () => {
    if (!selectedProjectId || currentPage >= totalPages || loadingOlder) return;
    void loadMessages(selectedProjectId, currentPage + 1, true);
  };

  const loadUnreadCounts = async () => {
    try {
      const data = await messageService.getUnreadCounts();
      const map = new Map<string, number>();
      for (const item of data.counts) {
        map.set(item.projectId, item.count);
      }
      setUnreadMap(map);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    void loadProjects();
    void loadUnreadCounts();
  }, [role]);

  useEffect(() => {
    if (!selectedProjectId) {
      setMessages([]);
      setCurrentPage(1);
      setTotalPages(1);
      setShowFilesPanel(false);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024; // 10MB

    const valid = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`"${file.name}" exceeds 10 MB limit.`);
        return false;
      }
      return true;
    });

    setAttachedFiles((current) => {
      const combined = [...current, ...valid];
      if (combined.length > maxFiles) {
        toast.error(`You can attach up to ${maxFiles} files.`);
        return combined.slice(0, maxFiles);
      }
      return combined;
    });

    // Reset so the same file can be re-selected
    event.target.value = "";
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((current) => current.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!selectedProjectId || (!content && attachedFiles.length === 0)) return;
    if (!receiverId) {
      toast.error("Conversation is not available until both parties are assigned.");
      return;
    }

    try {
      setSending(true);
      const sent = await messageService.sendMessage(
        selectedProjectId,
        content,
        receiverId,
        attachedFiles.length > 0 ? attachedFiles : undefined,
      );
      upsertMessage(sent);
      setDraft("");
      setAttachedFiles([]);
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleStartEdit = (messageId: string) => {
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

    setEditingMessageId(messageId);
    setEditDraft(target.content ?? "");
    setOpenMessageMenuId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditDraft("");
  };

  const handleConfirmEdit = async () => {
    if (!editingMessageId) return;
    const content = editDraft.trim();
    if (!content) {
      toast.error("Message content cannot be empty.");
      return;
    }

    try {
      const updated = await messageService.editMessage(editingMessageId, content);
      setMessages((current) =>
        current.map((message) =>
          message._id === updated._id ? { ...message, ...updated } : message,
        ),
      );
    } catch {
      toast.error("Failed to edit message.");
    } finally {
      setEditingMessageId(null);
      setEditDraft("");
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setDeleteConfirmId(messageId);
    setOpenMessageMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await messageService.deleteMessage(deleteConfirmId);
      setMessages((current) =>
        current.filter((message) => message._id !== deleteConfirmId),
      );
    } catch {
      toast.error("Failed to delete message.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="grid h-full grid-cols-12 overflow-hidden">
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
              const person = role === "homeowner" ? project.contractor : project.homeowner;
              const name = getDisplayName(person);
              const avatarClass = getAvatarClass(project._id);
              const personAvatar = person?.avatar
                ? (person.avatar.startsWith("http") ? person.avatar : getImageUrl(person.avatar))
                : null;

              return (
                <button
                  key={project._id}
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(project._id);
                    setUnreadMap((prev) => { const next = new Map(prev); next.delete(project._id); return next; });
                  }}
                  className={`relative flex w-full items-center gap-3 border-b border-b-neutral-200 p-4 text-left cursor-pointer transition-colors ${
                    active ? "bg-neutral-100" : "hover:bg-neutral-100"
                  }`}
                >
                  {personAvatar ? (
                    <img src={personAvatar} alt={name} referrerPolicy="no-referrer" className="size-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={`size-10 rounded-full bg-linear-to-br ${avatarClass} flex items-center justify-center text-white font-semibold shrink-0`}>
                      {getInitials(name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h6 className="font-normal">{name}</h6>
                    <p className="truncate text-sm text-neutral-500">{project.title}</p>
                  </div>
                  {(unreadMap.get(project._id) ?? 0) > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[11px] font-semibold text-white shrink-0">
                      {unreadMap.get(project._id)}
                    </span>
                  )}
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
              {(() => {
                const av = contactPerson?.avatar
                  ? (contactPerson.avatar.startsWith("http") ? contactPerson.avatar : getImageUrl(contactPerson.avatar))
                  : null;
                return av ? (
                  <img src={av} alt={contactName} referrerPolicy="no-referrer" className="mr-4 size-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`mr-4 size-12 rounded-full bg-linear-to-br ${getAvatarClass(receiverId ?? selectedProject._id)} flex items-center justify-center text-white font-semibold shrink-0`}>
                    {getInitials(contactName)}
                  </div>
                );
              })()}
              <div className="min-w-0 flex-1">
                <h6 className="font-normal truncate">{contactName}</h6>
                <div className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-green-500" />
                  <span className="text-sm text-neutral-500">Online</span>
                </div>
              </div>
              {sharedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowFilesPanel((v) => !v)}
                  className="ml-auto shrink-0 flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  <Paperclip className="size-3.5" />
                  <span className="hidden sm:inline">Files</span>
                  <span className="text-neutral-400">({sharedFiles.length})</span>
                </button>
              )}
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto p-4 md:p-6">
              {loadingMessages ? (
                <p className="text-sm text-neutral-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-neutral-500">No messages yet. Start the conversation.</p>
              ) : (
                <>
                {currentPage < totalPages && (
                  <div className="flex justify-center mb-4">
                    <button
                      type="button"
                      onClick={handleLoadOlder}
                      disabled={loadingOlder}
                      className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      {loadingOlder ? "Loading..." : "Load older messages"}
                    </button>
                  </div>
                )}
                {messages.map((message, index) => {
                  const mine = getSenderId(message.senderId) === currentUserId;
                  const canEditMessage = canEditWithinTenMinutes(message.createdAt);
                  const isEditing = editingMessageId === message._id;
                  const showSep = shouldShowSeparator(message, messages[index - 1]);
                  return (
                    <div key={message._id}>
                      {showSep && (
                        <div className="my-3 flex items-center gap-3">
                          <div className="h-px flex-1 bg-neutral-200" />
                          <span className="text-[11px] text-neutral-400">
                            {getDateLabel(new Date(message.createdAt ?? 0))}
                          </span>
                          <div className="h-px flex-1 bg-neutral-200" />
                        </div>
                      )}
                    <div
                      key={`msg-${message._id}`}
                      className={`group mb-2 flex w-full ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex items-center gap-1">
                        {mine && !isEditing ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                const rect = event.currentTarget.getBoundingClientRect();
                                const containerRect = listRef.current?.getBoundingClientRect();
                                const containerBottom = containerRect?.bottom ?? window.innerHeight;
                                const spaceBelow = containerBottom - rect.bottom;
                                setMenuPosition(spaceBelow < 120 ? "above" : "below");
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
                                className={`absolute left-0 z-20 w-36 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg ${
                                  menuPosition === "above" ? "bottom-full mb-1" : "top-full mt-1"
                                }`}
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
                                  onClick={() => handleStartEdit(message._id)}
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

                        <div className="flex flex-col gap-0.5">
                          {isEdited(message) && (
                            <p className={`text-[10px] ${mine ? "text-right text-neutral-400" : "text-left text-neutral-400"}`}>
                              edited
                            </p>
                          )}
                        <div
                          className={`rounded-2xl px-4 py-3 text-base ${
                            mine
                              ? "rounded-tr-lg bg-linear-to-br from-primary-400 to-primary-600 text-white"
                              : "rounded-tl-lg bg-neutral-200 text-neutral-900"
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    void handleConfirmEdit();
                                  }
                                  if (e.key === "Escape") handleCancelEdit();
                                }}
                                autoFocus
                                className="w-full rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-sm text-white placeholder-white/60 outline-none focus:border-white/60"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="rounded px-2 py-1 text-xs text-white/80 hover:text-white hover:bg-white/10"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleConfirmEdit()}
                                  disabled={!editDraft.trim()}
                                  className="rounded bg-white/20 px-2 py-1 text-xs text-white hover:bg-white/30 disabled:opacity-50"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
                          )}
                          {message.attachments && message.attachments.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment, idx) => {
                                const urlPath = attachment.split("?")[0];
                                const isImage = /\.(jpe?g|png|webp|gif)$/i.test(urlPath);
                                const rawName = urlPath.split("/").pop() ?? `Attachment ${idx + 1}`;
                                const fileName = decodeURIComponent(rawName);
                                return isImage ? (
                                  <button
                                    key={`${message._id}-attachment-${idx}`}
                                    type="button"
                                    onClick={() => setPreviewImage(attachment)}
                                    className="block cursor-pointer"
                                  >
                                    <img
                                      src={attachment}
                                      alt={fileName}
                                      className="max-h-48 max-w-60 rounded-lg object-cover"
                                    />
                                  </button>
                                ) : (
                                  <a
                                    key={`${message._id}-attachment-${idx}`}
                                    href={attachment}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs max-w-48 sm:max-w-60 ${
                                      mine
                                        ? "border-white/30 text-white hover:bg-white/10"
                                        : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                                    }`}
                                  >
                                    <Download className="size-4 shrink-0" />
                                    <span className="truncate min-w-0">{fileName}</span>
                                  </a>
                                );
                              })}
                            </div>
                          ) : null}
                          <p className={`mt-1 text-right text-[11px] ${mine ? "text-white/80" : "text-neutral-500"}`}>
                            {mine ? "You" : getSenderDisplayName(message.senderId)} • {formatTime(message.createdAt)} • {getDeliveryLabel(message, mine)}
                          </p>
                        </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  );
                })}
                </>
              )}
            </div>

            <div className="border-t border-t-neutral-300 bg-white">
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-6 pt-3">
                  {attachedFiles.map((file, idx) => {
                    const isImage = file.type.startsWith("image/");
                    return (
                      <div
                        key={`${file.name}-${idx}`}
                        className="group/file relative flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs"
                      >
                        {isImage ? (
                          <ImageIcon className="size-4 shrink-0 text-primary-500" />
                        ) : (
                          <FileText className="size-4 shrink-0 text-neutral-500" />
                        )}
                        <span className="max-w-32 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachedFile(idx)}
                          className="ml-1 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex h-header gap-4 px-6 py-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-lg p-3 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                  title="Attach files"
                >
                  <Paperclip className="size-5" />
                </button>
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
                  disabled={sending || (!draft.trim() && attachedFiles.length === 0)}
                  className="cursor-pointer rounded-lg bg-primary-500 p-3 text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="size-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shared files sidebar */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${showFilesPanel ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-black/30" onClick={() => setShowFilesPanel(false)} />
        <div
          className={`absolute right-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${showFilesPanel ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 shrink-0">
            <h3 className="text-sm font-semibold text-neutral-800">Shared Media & Files</h3>
            <button type="button" onClick={() => setShowFilesPanel(false)} className="rounded-full p-1 hover:bg-neutral-100">
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-100 shrink-0">
            <button
              type="button"
              onClick={() => setFilesTab("images")}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                filesTab === "images"
                  ? "border-b-2 border-primary-500 text-primary-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Images ({sharedImages.length})
            </button>
            <button
              type="button"
              onClick={() => setFilesTab("files")}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                filesTab === "files"
                  ? "border-b-2 border-primary-500 text-primary-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Files ({sharedDocs.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {filesTab === "images" ? (
              sharedImages.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-10">No images shared yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {sharedImages.map((file, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreviewImage(file.url)}
                      className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-400 transition-all"
                    >
                      <img loading="lazy" src={file.url} alt={file.name} className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              )
            ) : (
              sharedDocs.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-10">No files shared yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {sharedDocs.map((file, i) => (
                    <a
                      key={i}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 rounded-lg border border-neutral-200 p-2.5 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex size-9 items-center justify-center rounded-lg bg-neutral-100 shrink-0">
                        <FileText size={16} className="text-neutral-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-neutral-700 truncate">{file.name}</p>
                        <p className="text-[10px] text-neutral-400">{new Date(file.date).toLocaleDateString()}</p>
                      </div>
                      <Download size={14} className="shrink-0 text-neutral-400" />
                    </a>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h6 className="mb-2 text-lg font-semibold text-neutral-900">Delete message</h6>
            <p className="mb-6 text-sm text-neutral-600">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="Close preview"
          >
            <X className="size-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={previewImage}
            download
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-white flex items-center gap-2"
          >
            <Download className="size-4" />
            Download
          </a>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
