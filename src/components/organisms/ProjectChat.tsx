import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { io, type Socket } from "socket.io-client";
import { Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { Textarea } from "@/components/atoms/Textarea";
import { messageService, type MessageRecord } from "@/api/message";
import { useAuth } from "@/stores/useAuth";

interface ProjectChatProps {
  projectId: string;
  receiverId?: string;
  title?: string;
  disabledReason?: string;
}

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

const getSenderDisplayName = (sender: MessageRecord["senderId"]) => {
  if (!sender || typeof sender === "string") return "User";
  const fullName = `${sender.firstName ?? ""} ${sender.lastName ?? ""}`.trim();
  return fullName || "User";
};

const getSenderId = (sender: MessageRecord["senderId"]) => {
  if (!sender) return "";
  if (typeof sender === "string") return sender;
  return sender._id ?? "";
};

const ProjectChat = ({
  projectId,
  receiverId,
  title = "Project Chat",
  disabledReason,
}: ProjectChatProps) => {
  const { token, user } = useAuth();
  const currentUserId = useMemo(() => {
    if (!user) return "";
    const candidate = user as unknown as { id?: string; _id?: string };
    return candidate.id ?? candidate._id ?? "";
  }, [user]);

  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const isDisabled = Boolean(disabledReason);

  const scrollToBottom = () => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  };

  const upsertMessage = (incoming: MessageRecord) => {
    setMessages((current) => {
      if (current.some((item) => item._id === incoming._id)) {
        return current;
      }
      const merged = [...current, incoming].sort((a, b) => {
        const aTime = new Date(a.createdAt ?? 0).getTime();
        const bTime = new Date(b.createdAt ?? 0).getTime();
        return aTime - bTime;
      });
      return merged;
    });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId || isDisabled) {
      setMessages([]);
      setLoading(false);
      return;
    }

    void loadMessages();
  }, [projectId, isDisabled]);

  useEffect(() => {
    if (!token || !projectId || isDisabled) return;

    const apiBase =
      (import.meta.env.VITE_API_URL as string | undefined) ||
      "http://localhost:3000/api";
    const socketUrl = apiBase.replace(/\/api\/?$/, "");

    const socket: Socket = io(socketUrl, {
      transports: ["websocket"],
      auth: { token },
    });

    const handleConnect = () => {
      socket.emit("join_project", projectId);
    };

    socket.on("connect", handleConnect);
    socket.on("new_message", (message: MessageRecord) => {
      if (String(message.projectId) !== String(projectId)) return;
      upsertMessage(message);
    });

    socket.on("connect_error", () => {
      // Keep REST polling as fallback if websocket fails.
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [token, projectId, isDisabled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    setFiles((current) => [...current, ...selected]);
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSend = async () => {
    if (isDisabled || !projectId) return;

    const trimmed = content.trim();
    if (!trimmed && files.length === 0) {
      toast.error("Write a message or add at least one file.");
      return;
    }

    try {
      setSending(true);
      const sent = await messageService.sendMessage(
        projectId,
        trimmed,
        receiverId,
        files,
      );
      upsertMessage(sent);
      setContent("");
      setFiles([]);
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h6>{title}</h6>
        <span className="text-xs text-neutral-500">Real-time</span>
      </div>

      {isDisabled && (
        <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
          {disabledReason}
        </p>
      )}

      {!isDisabled && (
        <>
          <div
            ref={listRef}
            className="max-h-[26rem] min-h-52 space-y-3 overflow-y-auto rounded-xl border border-neutral-200 p-3"
          >
            {loading ? (
              <p className="text-sm text-neutral-500">Loading chat...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-neutral-500">No messages yet. Start the conversation.</p>
            ) : (
              messages.map((message, index) => {
                const mine = getSenderId(message.senderId) === currentUserId;
                const showSep = shouldShowSeparator(message, messages[index - 1]);
                return (
                  <div key={message._id}>
                    {showSep && (
                      <div className="my-2 flex items-center gap-2">
                        <div className="h-px flex-1 bg-neutral-200" />
                        <span className="text-[11px] text-neutral-400">
                          {getDateLabel(new Date(message.createdAt ?? 0))}
                        </span>
                        <div className="h-px flex-1 bg-neutral-200" />
                      </div>
                    )}
                  <div
                    className={`max-w-[85%] rounded-xl border p-3 ${
                      mine
                        ? "ml-auto border-primary-200 bg-primary-50"
                        : "mr-auto border-neutral-200 bg-white"
                    }`}
                  >
                    <p className="text-xs font-medium text-neutral-500">
                      {mine ? "You" : getSenderDisplayName(message.senderId)}
                    </p>

                    {message.content ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">
                        {message.content}
                      </p>
                    ) : null}

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, idx) => (
                          <a
                            key={`${message._id}-attachment-${idx}`}
                            href={attachment}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-sm text-primary underline"
                          >
                            Attachment {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}

                    <p className="mt-2 text-right text-[11px] text-neutral-500">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                  </div>
                );
              })
            )}
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <button
                  key={`${file.name}-${idx}`}
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-700"
                >
                  {file.name} x
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <Textarea
              rows={3}
              placeholder="Type your message..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />

            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700">
                <Paperclip className="size-4" />
                Attach files
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <Button
                variant="primary"
                size="sm"
                disabled={sending}
                onClick={() => void handleSend()}
                className="inline-flex items-center gap-2"
              >
                <Send className="size-4" />
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default ProjectChat;
