export interface HomeownerProject {
  _id: string;
  title: string;
  roomType: string;
  description?: string;
  status?: string;
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