import api from "@/api/interceptor";

export interface ReviewAuthor {
  _id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface CategoryRatings {
  quality: number;
  communication: number;
  timeliness: number;
  budget: number;
}

export interface Review {
  _id: string;
  projectId: string;
  contractorId: string;
  homeownerId: ReviewAuthor | string;
  rating: number;
  categoryRatings?: CategoryRatings;
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

  getProjectReview: async (projectId: string): Promise<Review | null> => {
    const response = await api.get(`/reviews/project/${projectId}`);
    return (response.data as { review: Review | null }).review;
  },

  createReview: async (payload: {
    projectId: string;
    categoryRatings: CategoryRatings;
    comment?: string;
  }): Promise<Review> => {
    const response = await api.post("/reviews", payload);
    return (response.data as { review: Review }).review;
  },
};
