import api from "@/api/interceptor";

export interface VettingFormData {
  licenseNumber: string;
  licenseExpiry: string;
  insuranceProvider: string;
  insuranceExpiry: string;
  files: File[];
}

export interface VettingRequestData {
  _id: string;
  contractorId: string;
  submittedData: {
    licenseNumber: string;
    licenseExpiry: string;
    insuranceProvider: string;
    insuranceExpiry: string;
    files: string[];
  };
  status: "pending" | "approved" | "rejected" | "more_info_needed";
  adminNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export const contractorService = {
  submitVettingRequest: async (data: VettingFormData) => {
    const formData = new FormData();
    formData.append("licenseNumber", data.licenseNumber);
    formData.append("licenseExpiry", data.licenseExpiry);
    formData.append("insuranceProvider", data.insuranceProvider);
    formData.append("insuranceExpiry", data.insuranceExpiry);
    for (const file of data.files) {
      formData.append("files", file);
    }
    const response = await api.post("/contractor/vetting", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data as { message: string; vettingRequestId: string };
  },

  getVettingStatus: async () => {
    const response = await api.get("/contractor/vetting/status");
    return response.data.vettingRequest as VettingRequestData | null;
  },
};
