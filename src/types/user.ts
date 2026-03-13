export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  authProvider: "local" | "google" | "apple";
  externalAuthId?: string;
  role: "homeowner" | "contractor" | "admin";
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: { type: "Point"; coordinates: [lng: number, lat: number] };
  };
  contractor?: {
    companyName: string;
    bio?: string;
    isVerified: boolean;
    verifiedAt?: Date;
    licenses: {
      number: string;
      expiry?: Date;
      fileKey: string;
    }[];
    insurances: {
      provider: string;
      expiry?: Date;
      fileKey: string;
    }[];
    specialties: string[];
    experienceYears?: number;
    serviceArea: { type: "Polygon"; coordinates: number[][][] };
    subscription: {
      tier: "free" | "professional" | "enterprise";
      startedAt?: Date;
      expiresAt?: Date;
      stripeSubscriptionId?: string;
    };
  };
  homeowner?: {
    creditBalance: number;
    savedDesigns: string[];
  };
  stripeCustomerId?: string;
  stripeConnectAccountId?: string;
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  emailVerificationToken: string | undefined;
  emailVerificationExpires: Date | undefined;
  emailVerifiedAt: Date;
  isVerified: boolean;
}