export interface HomeownerProject {
  _id: string;
  title: string;
  roomType: string;
  description?: string;
  status?: string;
  currentDesignId?: string | {
    _id: string;
    style?: { id: string; prompt?: string };
    roomPhoto?: { url: string; signedUrl?: string };
    generatedImages?: { url: string; signedUrl?: string; resolution?: string }[];
    status?: string;
  };
  originalDesignId?: string;
  images?: {
    url: string;
    type: "before" | "progress" | "site_condition";
  }[];
  budgetRange?: {
    min: number;
    max: number;
  };
  budget?: {
    agreed: number;
    current: number;
  };
  customBudget?: number;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  startDate?: string;
  createdAt?: string;
  milestoneIds?: {
    _id: string;
    status: string;
    paymentAmount: number;
    percentOfTotal: number;
  }[];
}