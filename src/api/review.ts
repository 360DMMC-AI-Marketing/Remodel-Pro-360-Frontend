import api from "@/api/interceptor";

export interface ReviewAuthor {
  _id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface Review {
  _id: string;
  projectId: string;
  contractorId: string;
  homeownerId: ReviewAuthor | string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractorReviewsResponse {
  reviews: Review[];
  averageRating: number;
  count: number;
}

export const reviewService = {
  getContractorReviews: async (contractorId: string): Promise<ContractorReviewsResponse> => {
    const response = await api.get(`/reviews/contractor/${contractorId}`);
    return response.data as ContractorReviewsResponse;
  },
};
