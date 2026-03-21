import api from "@/api/interceptor";

export interface ContractorProfile {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  address?: {
    city?: string;
    state?: string;
  };
  contractor: {
    companyName: string;
    bio?: string;
    isVerified: boolean;
    specialties: string[];
    experienceYears?: number;
    averageRating?: number;
    reviewCount?: number;
    serviceArea?: { type: "Polygon"; coordinates: number[][][] };
  };
}

export interface ContractorSearchParams {
  search?: string;
  specialty?: string;
  verified?: boolean;
  minExperience?: number;
  page?: number;
  limit?: number;
}

export interface ContractorListResponse {
  contractors: ContractorProfile[];
  total: number;
  page: number;
  totalPages: number;
}

export const contractorsService = {
  getContractors: async (params: ContractorSearchParams = {}) => {
    const response = await api.get("/auth/contractors");
    let contractors: ContractorProfile[] = (
      response.data as { contractors: ContractorProfile[] }
    ).contractors ?? [];

    if (params.search) {
      const q = params.search.toLowerCase();
      contractors = contractors.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.contractor.companyName?.toLowerCase().includes(q) ||
          c.contractor.specialties.some((s) => s.toLowerCase().includes(q)),
      );
    }
    if (params.specialty) {
      contractors = contractors.filter((c) =>
        c.contractor.specialties.includes(params.specialty!),
      );
    }
    if (params.verified) {
      contractors = contractors.filter((c) => c.contractor.isVerified);
    }
    if (params.minExperience) {
      contractors = contractors.filter(
        (c) => (c.contractor.experienceYears ?? 0) >= params.minExperience!,
      );
    }

    const total = contractors.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 12;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paged = contractors.slice(start, start + limit);

    return { contractors: paged, total, page, totalPages } as ContractorListResponse;
  },

  getContractorById: async (id: string) => {
    const response = await api.get(`/contractors/${id}`);
    return response.data.contractor as ContractorProfile;
  },
};
