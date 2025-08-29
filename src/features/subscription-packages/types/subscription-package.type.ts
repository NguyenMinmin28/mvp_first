export interface SubscriptionPackage {
  id: string;
  name: string;
  priceUSD: number;
  projectsPerMonth: number;
  contactClicksPerProject: number;
  features: string[];
  isPopular: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionPackageData {
  name: string;
  priceUSD: number;
  projectsPerMonth: number;
  contactClicksPerProject: number;
  features: string[];
  isPopular?: boolean;
  active?: boolean;
}

export interface UpdateSubscriptionPackageData {
  name?: string;
  priceUSD?: number;
  projectsPerMonth?: number;
  contactClicksPerProject?: number;
  features?: string[];
  isPopular?: boolean;
  active?: boolean;
}

export interface SubscriptionPackageFilters {
  active?: boolean;
  isPopular?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface SubscriptionPackageSortOptions {
  field: 'name' | 'priceUSD' | 'projectsPerMonth' | 'createdAt';
  order: 'asc' | 'desc';
}
