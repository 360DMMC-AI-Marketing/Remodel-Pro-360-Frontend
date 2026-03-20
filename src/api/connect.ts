import api from "@/api/interceptor";

export interface ContractorConnectStatus {
  accountId: string | null;
  onboardingComplete: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    pendingVerification: string[];
    disabledReason: string | null;
  };
}

export const connectService = {
  getMyStatus: async () => {
    const response = await api.get("/connect/contractor/me/status");
    return response.data.data as ContractorConnectStatus;
  },

  createOnboardingLink: async () => {
    const response = await api.post("/connect/contractor/me/onboarding-link");
    return response.data.data as { url: string; expiresAt: number };
  },

  createDashboardLink: async () => {
    const response = await api.post("/connect/contractor/me/dashboard-link");
    return response.data.data as { url: string };
  },
};
