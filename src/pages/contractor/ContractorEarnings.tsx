import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Clock, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { paymentService, type PaymentRecord } from "@/api/payment";
import { toast } from "sonner";

const ContractorEarnings = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState({ totalEarned: 0, totalPending: 0, totalFees: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (p: number) => {
    try {
      setLoading(true);
      const data = await paymentService.getContractorEarnings(p, 15);
      setPayments(data.payments);
      setSummary(data.summary);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch {
      toast.error("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const kpis = [
    { label: "Total Earned", value: `$${summary.totalEarned.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending", value: `$${summary.totalPending.toLocaleString()}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Platform Fees", value: `$${summary.totalFees.toLocaleString()}`, icon: ArrowDown, color: "text-red-500", bg: "bg-red-50" },
    { label: "Net Earnings", value: `$${(summary.totalEarned - summary.totalFees).toLocaleString()}`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-sm text-neutral-500 mt-1">Track your milestone payouts and fees.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <span className="text-sm text-neutral-500">{label}</span>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                )}
              </div>
              <div className={`${bg} rounded-xl p-3 shrink-0`}>
                <Icon size={22} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Milestone</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                    No earnings yet. Complete milestones to receive payouts.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const project = typeof p.projectId === "object" ? p.projectId : null;
                  const milestone = typeof p.milestoneId === "object" ? p.milestoneId : null;
                  return (
                    <tr key={p._id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-sm font-medium text-neutral-800 whitespace-nowrap">
                        {project?.title ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 whitespace-nowrap">
                        {milestone?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-600 whitespace-nowrap">
                        ${p.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={p.status === "succeeded" ? "success" : p.status === "pending" ? "warning" : "error"}
                          className="capitalize text-[11px]"
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500 whitespace-nowrap">
                        {p.completedAt
                          ? new Date(p.completedAt).toLocaleDateString()
                          : new Date(p._id.substring(0, 8)).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorEarnings;
