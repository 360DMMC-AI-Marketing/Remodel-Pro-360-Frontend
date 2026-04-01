import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Mail,
  ShieldCheck,
  CreditCard,
  FileText,
  ChevronRight,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  done: boolean;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  actionLabel?: string;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
}

export const OnboardingChecklist = ({ steps }: OnboardingChecklistProps) => {
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);

  if (completed === total) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-900">Complete your setup</h3>
          <span className="text-xs font-medium text-neutral-500">
            {completed}/{total} done
          </span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-neutral-100">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                step.done ? "bg-neutral-50/50" : "hover:bg-neutral-50"
              }`}
            >
              {/* Status icon */}
              {step.done ? (
                <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              ) : (
                <Circle size={20} className="text-neutral-300 shrink-0" />
              )}

              {/* Step icon + text */}
              <div className={`rounded-lg p-1.5 ${step.done ? "bg-emerald-50" : "bg-neutral-100"}`}>
                <Icon size={16} className={step.done ? "text-emerald-500" : "text-neutral-400"} />
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? "text-neutral-400 line-through" : "text-neutral-800"}`}>
                  {step.label}
                </p>
                {!step.done && (
                  <p className="text-xs text-neutral-400 mt-0.5">{step.description}</p>
                )}
              </div>

              {/* Action */}
              {!step.done && (
                step.href ? (
                  <Link
                    to={step.href}
                    className="shrink-0 flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 transition-colors"
                  >
                    {step.actionLabel || "Complete"} <ChevronRight size={14} />
                  </Link>
                ) : step.action ? (
                  <button
                    type="button"
                    onClick={step.action}
                    className="shrink-0 flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 transition-colors"
                  >
                    {step.actionLabel || "Complete"} <ChevronRight size={14} />
                  </button>
                ) : null
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Build onboarding steps for a contractor */
export function buildContractorSteps(opts: {
  emailVerified: boolean;
  isLocal: boolean;
  hasLicense: boolean;
  hasInsurance: boolean;
  stripeComplete: boolean;
  onStripeSetup: () => void;
}) {
  const steps: OnboardingStep[] = [];

  if (opts.isLocal) {
    steps.push({
      id: "email",
      label: "Verify your email",
      description: "Check your inbox for the verification link",
      done: opts.emailVerified,
      icon: Mail,
      href: "/contractor/settings",
      actionLabel: "Verify",
    });
  }

  steps.push({
    id: "license",
    label: "Upload license",
    description: "Submit your contractor license for verification",
    done: opts.hasLicense,
    icon: FileText,
    href: "/contractor/profile",
    actionLabel: "Upload",
  });

  steps.push({
    id: "insurance",
    label: "Upload insurance",
    description: "Provide proof of insurance coverage",
    done: opts.hasInsurance,
    icon: ShieldCheck,
    href: "/contractor/profile",
    actionLabel: "Upload",
  });

  steps.push({
    id: "stripe",
    label: "Set up payments",
    description: "Connect Stripe to receive milestone payouts",
    done: opts.stripeComplete,
    icon: CreditCard,
    action: opts.onStripeSetup,
    actionLabel: "Set up",
  });

  return steps;
}

/** Build onboarding steps for a homeowner */
export function buildHomeownerSteps(opts: {
  emailVerified: boolean;
  isLocal: boolean;
}) {
  const steps: OnboardingStep[] = [];

  if (opts.isLocal) {
    steps.push({
      id: "email",
      label: "Verify your email",
      description: "Check your inbox for the verification link",
      done: opts.emailVerified,
      icon: Mail,
      href: "/homeowner/settings",
      actionLabel: "Verify",
    });
  }

  return steps;
}
