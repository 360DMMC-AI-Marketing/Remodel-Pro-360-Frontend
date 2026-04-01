import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, HardHat, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/stores/useAuth";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { toast } from "sonner";
import logo from "@/assets/logo-transparent.png";

const roles = [
  {
    id: "homeowner" as const,
    title: "Homeowner",
    description: "I want to renovate my home and find qualified contractors.",
    icon: Home,
    color: "indigo",
    features: ["Post renovation projects", "Compare contractor bids", "Track milestones & payments", "AI design studio"],
  },
  {
    id: "contractor" as const,
    title: "Contractor",
    description: "I'm a professional contractor looking for renovation projects.",
    icon: HardHat,
    color: "teal",
    features: ["Browse & bid on projects", "Manage milestones & proof", "Receive secure payouts", "Build your portfolio"],
  },
];

const SelectRole = () => {
  const [selected, setSelected] = useState<"homeowner" | "contractor" | null>(null);
  const [loading, setLoading] = useState(false);
  const { selectRole, user } = useAuth();
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selected) return;
    try {
      setLoading(true);
      await selectRole(selected);
      toast.success(`Welcome, ${user?.firstName}! You're all set.`);
      navigate(`/${selected}/dashboard`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 px-4 py-8">
      <div className="w-full max-w-2xl text-center">
        <img src={logo} alt="RP360" className="w-40 mx-auto" />

        <div className="mt-4 mb-8">
          <h2 className="text-2xl font-bold text-neutral-900">How will you use RP360?</h2>
          <p className="text-sm text-neutral-500 mt-2">
            Choose your role to get started. This helps us personalize your experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((role) => {
            const isSelected = selected === role.id;
            const Icon = role.icon;
            const borderColor = isSelected
              ? role.color === "indigo" ? "border-indigo-500 ring-2 ring-indigo-200" : "border-teal-500 ring-2 ring-teal-200"
              : "border-neutral-200 hover:border-neutral-300";
            const iconBg = isSelected
              ? role.color === "indigo" ? "bg-indigo-100" : "bg-teal-100"
              : "bg-neutral-100";
            const iconColor = role.color === "indigo" ? "text-indigo-600" : "text-teal-600";

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role.id)}
                className={`relative rounded-2xl border-2 bg-white p-6 text-left transition-all ${borderColor}`}
              >
                {isSelected && (
                  <div className={`absolute top-3 right-3 size-5 rounded-full flex items-center justify-center ${
                    role.color === "indigo" ? "bg-indigo-500" : "bg-teal-500"
                  }`}>
                    <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <div className={`inline-flex rounded-xl p-3 ${iconBg}`}>
                  <Icon size={28} className={iconColor} />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-neutral-900">{role.title}</h3>
                <p className="mt-1 text-sm text-neutral-500">{role.description}</p>

                <ul className="mt-4 space-y-2">
                  {role.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-neutral-600">
                      <Sparkles size={12} className={iconColor} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <Button
          variant="primary"
          size="md"
          className="mt-8 w-full sm:w-auto sm:min-w-[200px]"
          disabled={!selected || loading}
          onClick={handleContinue}
        >
          {loading ? (
            <Spinner size="sm" />
          ) : (
            <>
              Continue as {selected ? roles.find((r) => r.id === selected)?.title : "..."}{" "}
              <ArrowRight size={16} className="ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SelectRole;
