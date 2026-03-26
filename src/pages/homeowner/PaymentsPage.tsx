import { useEffect, useState } from "react";
import { DollarSign, ArrowUpRight, Clock, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { paymentService, type PaymentRecord, type PaymentSummary } from "@/api/payment";
import { Card } from "@/components/molecules/Card";
import { Badge } from "@/components/atoms/Badge";
import { Skeleton } from "@/components/atoms/Skeleton";
import { toast } from "sonner";

const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const typeLabel: Record<string, string> = {
  escrow_deposit: "Escrow Deposit",
  escrow_release: "Escrow Release",
  milestone_payout: "Milestone Payout",
  fee: "Platform Fee",
};

const statusVariant = (status: string): "success" | "warning" | "error" | "draft" => {
  switch (status) {
    case "succeeded": return "success";
    case "pending": return "warning";
    case "failed": return "error";
    default: return "draft";
  }
};

const getProjectTitle = (projectId: PaymentRecord["projectId"]) => {
  if (!projectId) return "—";
  if (typeof projectId === "string") return projectId;
  return projectId.title ?? "Untitled";
};

const getMilestoneName = (milestoneId: PaymentRecord["milestoneId"]) => {
  if (!milestoneId) return null;
  if (typeof milestoneId === "string") return null;
  return milestoneId.name ?? null;
};

const PaymentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({ totalPaid: 0, totalPending: 0, totalInEscrow: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (p: number) => {
    try {
      setLoading(true);
      const result = await paymentService.getMyPayments(p, 10);
      setPayments(result.payments);
      setSummary(result.summary);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch {
      toast.error("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
  }, []);

  const kpis = [
    { label: "Total Paid", value: formatCurrency(summary.totalPaid), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending", value: formatCurrency(summary.totalPending), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "In Escrow", value: formatCurrency(summary.totalInEscrow), icon: Shield, color: "text-primary-600", bg: "bg-primary-50" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <h2 className="text-lg font-semibold text-neutral-800">Payments</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="flex items-center gap-4">
            <div className={`flex size-11 items-center justify-center rounded-xl ${kpi.bg} shrink-0`}>
              <kpi.icon size={20} className={kpi.color} />
            </div>
            <div>
              <p className="text-xs text-neutral-500">{kpi.label}</p>
              {loading ? (
                <Skeleton className="h-6 w-24 mt-0.5" />
              ) : (
                <p className="text-lg font-semibold text-neutral-800">{kpi.value}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Transactions table */}
      <Card>
        <h3 className="text-sm font-semibold text-neutral-700 mb-4">Recent Transactions</h3>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-neutral-400">
            <DollarSign size={40} className="mb-2" />
            <p className="text-sm">No transactions yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Project</th>
                    <th className="pb-2 font-medium">Milestone</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50">
                      <td className="py-3 text-neutral-600">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-neutral-700">
                          <ArrowUpRight size={13} className="text-neutral-400" />
                          {typeLabel[p.type] ?? p.type}
                        </span>
                      </td>
                      <td className="py-3 text-neutral-600 max-w-40 truncate">
                        {getProjectTitle(p.projectId)}
                      </td>
                      <td className="py-3 text-neutral-500 max-w-32 truncate">
                        {getMilestoneName(p.milestoneId) ?? "—"}
                      </td>
                      <td className="py-3 text-right font-medium text-neutral-800">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {payments.map((p) => (
                <div key={p._id} className="rounded-xl border border-neutral-100 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-700">
                        {typeLabel[p.type] ?? p.type}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {getProjectTitle(p.projectId)}
                        {getMilestoneName(p.milestoneId) ? ` · ${getMilestoneName(p.milestoneId)}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-neutral-800 shrink-0 ml-3">
                      {formatCurrency(p.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4">
                <p className="text-xs text-neutral-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => void load(page - 1)}
                    className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => void load(page + 1)}
                    className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default PaymentsPage;
