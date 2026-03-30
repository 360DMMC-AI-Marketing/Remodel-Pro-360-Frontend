import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/atoms/Button";
import { Skeleton } from "@/components/atoms/Skeleton";
import {
  adminService,
  type AdminStats,
  type ChartData,
  type DisputedMilestone,
} from "@/api/admin";
import {
  Users,
  HardHat,
  Home,
  FolderKanban,
  ClipboardCheck,
  AlertTriangle,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const STAT_CARDS: {
  label: string;
  key: keyof AdminStats;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  { label: "Total Users", key: "totalUsers", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Contractors", key: "totalContractors", icon: HardHat, color: "text-teal-600", bg: "bg-teal-50" },
  { label: "Homeowners", key: "totalHomeowners", icon: Home, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Projects", key: "totalProjects", icon: FolderKanban, color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Pending Vetting", key: "pendingVetting", icon: ClipboardCheck, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Disputed", key: "disputedMilestones", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  published: "#6366f1",
  bidding: "#8b5cf6",
  in_progress: "#14b8a6",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

const PIE_COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#22c55e", "#ec4899"];

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [disputes, setDisputes] = useState<DisputedMilestone[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<DisputedMilestone | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    adminService
      .getStats()
      .then(setStats)
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setStatsLoading(false));

    adminService
      .getChartData()
      .then(setCharts)
      .catch(() => toast.error("Failed to load chart data"))
      .finally(() => setChartsLoading(false));
  }, []);

  const fetchDisputes = useCallback(() => {
    setDisputesLoading(true);
    adminService
      .getDisputes()
      .then(setDisputes)
      .catch(() => toast.error("Failed to load disputes"))
      .finally(() => setDisputesLoading(false));
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleResolveDispute = async (id: string, resolution: "approved" | "in_progress") => {
    setResolvingId(id);
    try {
      await adminService.resolveDispute(id, resolution);
      toast.success(resolution === "approved" ? "Milestone approved" : "Sent back for rework");
      setDisputes((prev) => prev.filter((d) => d._id !== id));
      adminService.getStats().then(setStats).catch(() => {});
    } catch {
      toast.error("Failed to resolve dispute");
    } finally {
      setResolvingId(null);
    }
  };

  const ChartCard = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${className}`}>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      {chartsLoading ? <Skeleton className="h-56 w-full rounded-lg" /> : children}
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_CARDS.map(({ label, key, icon: Icon, color, bg }) => (
          <div key={key} className="rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{label}</span>
              <div className={`${bg} rounded-lg p-1.5`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className={`text-2xl font-bold ${color}`}>{stats?.[key] ?? 0}</span>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Signups */}
        <ChartCard title="User Signups (Last 6 Months)">
          {charts && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={charts.signupSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="homeowners" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Homeowners" />
                <Bar dataKey="contractors" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Contractors" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Projects by Status */}
        <ChartCard title="Projects by Status">
          {charts && charts.projectsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={charts.projectsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ payload }: any) => `${payload?.status} (${payload?.count})`}
                  labelLine={false}
                >
                  {charts.projectsByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-gray-400 py-20">No project data yet</p>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <ChartCard title="Revenue & Platform Fees (Last 6 Months)">
          {charts && (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={charts.revenueSeries}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="platformFees" stroke="#14b8a6" fill="url(#colorFees)" name="Platform Fees" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Bid Activity */}
        <ChartCard title="Bid Activity (Last 6 Months)">
          {charts && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={charts.bidSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="submitted" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Submitted" />
                <Bar dataKey="accepted" fill="#22c55e" radius={[4, 4, 0, 0]} name="Accepted" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Projects by Room Type */}
      <ChartCard title="Projects by Room Type">
        {charts && charts.projectsByRoom.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.projectsByRoom} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis dataKey="roomType" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Projects" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-sm text-gray-400 py-20">No project data yet</p>
        )}
      </ChartCard>

      {/* Disputes */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Disputed Milestones</h2>

        {disputesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-400">
            No disputed milestones at the moment.
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <div
                key={d._id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{d.project?.title ?? "Unknown Project"}</p>
                  <p className="text-sm text-gray-500">Milestone: {d.name}</p>
                  <p className="text-sm font-semibold text-indigo-600">${d.paymentAmount.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDispute(d)}
                  >
                    <Eye size={14} className="mr-1" /> Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={resolvingId === d._id}
                    onClick={() => handleResolveDispute(d._id, "approved")}
                  >
                    {resolvingId === d._id ? "..." : "Approve"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={resolvingId === d._id}
                    onClick={() => handleResolveDispute(d._id, "in_progress")}
                  >
                    {resolvingId === d._id ? "..." : "Rework"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dispute Detail Dialog */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedDispute(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-lg">Dispute Details</h3>
              <button type="button" onClick={() => setSelectedDispute(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Project & Milestone Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase">Project</span>
                  <span className="text-sm font-medium">{selectedDispute.project?.title ?? "Unknown"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase">Milestone</span>
                  <span className="text-sm font-medium">{selectedDispute.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase">Amount</span>
                  <span className="text-sm font-semibold text-indigo-600">${selectedDispute.paymentAmount.toLocaleString()}</span>
                </div>
                {selectedDispute.project?.homeownerId && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">Homeowner</span>
                    <span className="text-sm">
                      {selectedDispute.project.homeownerId.firstName} {selectedDispute.project.homeownerId.lastName}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedDispute.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Milestone Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedDispute.description}</p>
                </div>
              )}

              {/* Dispute Reason */}
              {selectedDispute.disputeReason && (
                <div>
                  <p className="text-xs font-medium text-red-500 uppercase mb-1">Dispute Reason</p>
                  <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 border border-red-100">
                    {selectedDispute.disputeReason}
                  </p>
                </div>
              )}

              {/* Deliverables */}
              {selectedDispute.deliverables && selectedDispute.deliverables.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Deliverables</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDispute.deliverables.map((d, i) => (
                      <span key={i} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-600">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Proof Images */}
              {selectedDispute.proofImages && selectedDispute.proofImages.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Proof Images</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDispute.proofImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setLightboxImages(selectedDispute.proofImages!.map((p) => getImageUrl(p)));
                          setLightboxIdx(i);
                        }}
                        className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-indigo-400 transition-all"
                      >
                        <img loading="lazy" src={getImageUrl(img)} alt={`Proof ${i + 1}`} className="size-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-5 border-t flex justify-end gap-2">
              <Button
                variant="primary"
                size="sm"
                disabled={resolvingId === selectedDispute._id}
                onClick={() => {
                  handleResolveDispute(selectedDispute._id, "approved");
                  setSelectedDispute(null);
                }}
              >
                Approve Milestone
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={resolvingId === selectedDispute._id}
                onClick={() => {
                  handleResolveDispute(selectedDispute._id, "in_progress");
                  setSelectedDispute(null);
                }}
              >
                Send Back for Rework
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Image Lightbox */}
      {lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setLightboxImages([])}>
          <button
            type="button"
            onClick={() => setLightboxImages([])}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={28} />
          </button>
          {lightboxImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + lightboxImages.length) % lightboxImages.length); }}
                className="absolute left-4 text-white/80 hover:text-white"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % lightboxImages.length); }}
                className="absolute right-4 text-white/80 hover:text-white"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
          <img
            src={lightboxImages[lightboxIdx]}
            alt="Proof"
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-4 text-white/70 text-sm">
            {lightboxIdx + 1} / {lightboxImages.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
