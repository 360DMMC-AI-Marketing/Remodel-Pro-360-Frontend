import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Skeleton } from "@/components/atoms/Skeleton";
import {
  adminService,
  type AdminStats,
  type AdminUser,
  type DisputedMilestone,
} from "@/api/admin";

const USERS_PER_PAGE = 10;

const AdminDashboard = () => {
  // --- Stats ---
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // --- Users ---
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersPage, setUsersPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // --- Disputes ---
  const [disputes, setDisputes] = useState<DisputedMilestone[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Fetch stats
  useEffect(() => {
    setStatsLoading(true);
    adminService
      .getStats()
      .then(setStats)
      .catch(() => toast.error("Failed to load dashboard stats"))
      .finally(() => setStatsLoading(false));
  }, []);

  // Fetch users
  const fetchUsers = useCallback(() => {
    setUsersLoading(true);
    adminService
      .getUsers({
        role: roleFilter || undefined,
        search: search || undefined,
        page: usersPage,
        limit: USERS_PER_PAGE,
      })
      .then((data) => {
        setUsers(data.users);
        setUsersTotal(data.total);
      })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setUsersLoading(false));
  }, [roleFilter, search, usersPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch disputes
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

  // Search handler (debounced on Enter / button)
  const handleSearch = () => {
    setSearch(searchInput);
    setUsersPage(1);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setUsersPage(1);
  };

  const handleResolveDispute = async (
    id: string,
    resolution: "approved" | "in_progress",
  ) => {
    setResolvingId(id);
    try {
      await adminService.resolveDispute(id, resolution);
      toast.success(
        resolution === "approved"
          ? "Milestone approved successfully"
          : "Milestone sent back for rework",
      );
      setDisputes((prev) => prev.filter((d) => d._id !== id));
      // Refresh stats to update disputed count
      adminService.getStats().then(setStats).catch(() => {});
    } catch {
      toast.error("Failed to resolve dispute");
    } finally {
      setResolvingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(usersTotal / USERS_PER_PAGE));

  // --- Stat card config ---
  const statCards: { label: string; key: keyof AdminStats }[] = [
    { label: "Total Users", key: "totalUsers" },
    { label: "Contractors", key: "totalContractors" },
    { label: "Homeowners", key: "totalHomeowners" },
    { label: "Projects", key: "totalProjects" },
    { label: "Pending Vetting", key: "pendingVetting" },
    { label: "Disputed Milestones", key: "disputedMilestones" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(({ label, key }) => (
          <div
            key={key}
            className="rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-1"
          >
            <span className="text-sm text-gray-500">{label}</span>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-2xl font-semibold text-indigo-600">
                {stats?.[key] ?? 0}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ===== Pending Vetting Banner ===== */}
      <div className="flex items-center justify-between rounded-xl border bg-indigo-50 p-4">
        <div className="flex items-center gap-3">
          <span className="font-medium text-indigo-800">
            Contractor Vetting Queue
          </span>
          {stats && stats.pendingVetting > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
              {stats.pendingVetting}
            </span>
          )}
        </div>
        <Link to="/admin/contractor-vetting">
          <Button variant="primary" size="sm">
            Review Requests
          </Button>
        </Link>
      </div>

      {/* ===== Users Table ===== */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Users</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={roleFilter}
            onChange={handleRoleChange}
            className="input w-full sm:w-44"
          >
            <option value="">All Roles</option>
            <option value="homeowner">Homeowner</option>
            <option value="contractor">Contractor</option>
            <option value="admin">Admin</option>
          </select>

          <div className="flex gap-2 flex-1">
            <Input
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button variant="outline" size="md" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Verified
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {user.role === "contractor" ? (
                        user.contractor?.isVerified ? (
                          <span className="text-green-600 font-medium">
                            Yes
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">No</span>
                        )
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!usersLoading && usersTotal > USERS_PER_PAGE && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(usersPage - 1) * USERS_PER_PAGE + 1}–
              {Math.min(usersPage * USERS_PER_PAGE, usersTotal)} of{" "}
              {usersTotal}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={usersPage <= 1}
                onClick={() => setUsersPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={usersPage >= totalPages}
                onClick={() => setUsersPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ===== Disputes ===== */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Disputed Milestones</h2>

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
                  <p className="font-medium text-gray-900">
                    {d.project?.title ?? "Unknown Project"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Milestone: {d.name}
                  </p>
                  <p className="text-sm font-semibold text-indigo-600">
                    ${d.paymentAmount.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
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
    </div>
  );
};

export default AdminDashboard;
