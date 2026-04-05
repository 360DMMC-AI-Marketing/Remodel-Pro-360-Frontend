import { useEffect, useState } from "react";
import { adminService, type ContactMessageData } from "@/api/admin";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { toast } from "sonner";
import {
  Mail,
  MailOpen,
  Reply,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";

const statusConfig = {
  unread: { label: "Unread", variant: "primary" as const, icon: Mail },
  read: { label: "Read", variant: "draft" as const, icon: MailOpen },
  replied: { label: "Replied", variant: "success" as const, icon: Reply },
};

const TABS = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
  { label: "Replied", value: "replied" },
];

const ContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<ContactMessageData | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchMessages = async (status: string) => {
    setLoading(true);
    try {
      const data = await adminService.getContactMessages(status);
      setMessages(data.messages);
    } catch {
      toast.error("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(filter);
  }, [filter]);

  const handleMarkAs = async (id: string, status: "read" | "replied") => {
    setUpdating(true);
    try {
      await adminService.updateContactMessage(id, {
        status,
        ...(status === "replied" && adminNotes.trim() ? { adminNotes: adminNotes.trim() } : {}),
      });
      toast.success(`Marked as ${status}.`);
      setSelected(null);
      setAdminNotes("");
      fetchMessages(filter);
    } catch {
      toast.error("Failed to update.");
    } finally {
      setUpdating(false);
    }
  };

  const openMessage = async (msg: ContactMessageData) => {
    setSelected(msg);
    setAdminNotes(msg.adminNotes || "");
    // Auto-mark as read if unread
    if (msg.status === "unread") {
      try {
        await adminService.updateContactMessage(msg._id, { status: "read" });
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, status: "read" } : m)),
        );
      } catch { /* silent */ }
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-neutral-800">Contact Messages</h2>
        <p className="text-sm text-neutral-500">Messages from the contact form</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-200/60 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === tab.value
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 text-sm">
          No messages found.
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const cfg = statusConfig[msg.status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={msg._id}
                onClick={() => openMessage(msg)}
                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors hover:bg-neutral-50 ${
                  msg.status === "unread"
                    ? "border-primary-200 bg-primary-50/30"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <StatusIcon
                  size={18}
                  className={`shrink-0 mt-0.5 ${msg.status === "unread" ? "text-primary-500" : "text-neutral-400"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-medium ${msg.status === "unread" ? "text-neutral-900" : "text-neutral-700"}`}>
                      {msg.name}
                    </span>
                    <span className="text-[10px] text-neutral-400">&lt;{msg.email}&gt;</span>
                    <Badge variant={cfg.variant} className="ml-auto text-[10px]">
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className={`text-sm truncate ${msg.status === "unread" ? "font-medium text-neutral-800" : "text-neutral-600"}`}>
                    {msg.subject}
                  </p>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{msg.message}</p>
                </div>
                <span className="text-[10px] text-neutral-400 shrink-0 mt-0.5">
                  {new Date(msg.createdAt).toLocaleDateString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-start justify-between">
              <div>
                <h5 className="font-semibold text-neutral-900">{selected.subject}</h5>
                <p className="text-sm text-neutral-500 mt-0.5">
                  From <strong>{selected.name}</strong> &lt;{selected.email}&gt;
                </p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="p-1 rounded hover:bg-neutral-100">
                <X size={18} className="text-neutral-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Message body */}
              <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selected.message}</p>
              </div>

              {/* Admin notes */}
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-1">Admin Notes</label>
                <textarea
                  className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                  rows={3}
                  placeholder="Internal notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-between">
              <a
                href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                <Reply size={14} />
                Reply via Email
              </a>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)} disabled={updating}>
                  Close
                </Button>
                {selected.status !== "replied" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleMarkAs(selected._id, "replied")}
                    disabled={updating}
                  >
                    {updating ? "Saving..." : "Mark as Replied"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
