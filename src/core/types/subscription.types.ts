// Core subscription types derived from Prisma schema

export type PaymentProvider = "paypal";

export type SubscriptionStatus = "active" | "past_due" | "canceled";

export type PaymentStatus = "created" | "authorized" | "captured" | "failed" | "refunded";

// Base Subscription type
export interface Subscription {
  id: string;
  clientId: string;
  packageId: string;
  provider: PaymentProvider;
  providerSubscriptionId: string;
  status: SubscriptionStatus;
  startAt: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription with related data
export interface SubscriptionWithPackage extends Subscription {
  package: {
    id: string;
    name: string;
    priceUSD: number;
    projectsPerMonth: number;
    contactClicksPerProject: number;
    features: string[];
    isPopular: boolean;
    active: boolean;
  };
}

export interface SubscriptionWithPayments extends Subscription {
  payments: Payment[];
}

export interface SubscriptionWithUsage extends Subscription {
  subscriptionUsages: SubscriptionUsage[];
}

// Full subscription with all relations
export interface SubscriptionFull extends Subscription {
  package: {
    id: string;
    name: string;
    priceUSD: number;
    projectsPerMonth: number;
    contactClicksPerProject: number;
    features: string[];
    isPopular: boolean;
    active: boolean;
  };
  payments: Payment[];
  subscriptionUsages: SubscriptionUsage[];
}

// Payment type
export interface Payment {
  id: string;
  subscriptionId: string;
  clientId: string;
  provider: PaymentProvider;
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
}

// Payment with subscription data
export interface PaymentWithSubscription extends Payment {
  subscription: Subscription;
}

// Subscription Usage type
export interface SubscriptionUsage {
  id: string;
  subscriptionId: string;
  periodStart: Date;
  periodEnd: Date;
  projectsPostedCount: number;
  contactClicksByProject: Record<string, number>; // Map<projectId, number>
}

// Usage tracking request
export interface UpdateUsageRequest {
  subscriptionId: string;
  periodStart: Date;
  periodEnd: Date;
  projectsPostedCount?: number;
  contactClicksByProject?: Record<string, number>;
}

// Usage with subscription data
export interface SubscriptionUsageWithSubscription extends SubscriptionUsage {
  subscription: Subscription;
}

// Package type (already exists in schema but adding for completeness)
export interface Package {
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

// API response types
export interface SubscriptionsResponse {
  subscriptions: SubscriptionWithPackage[];
}

export interface PaymentResponse {
  payment: Payment;
  success: boolean;
  message?: string;
}

export interface UsageResponse {
  usage: SubscriptionUsage;
  daysUntilEnd: number;
}

// Create subscription request
export interface CreateSubscriptionRequest {
  packageId: string;
  provider: PaymentProvider;
  paymentMethodId?: string; // Optional payment method identifier
}

// Update subscription request
export interface UpdateSubscriptionRequest {
  packageId?: string;
  status?: SubscriptionStatus;
}

// Create payment request
export interface CreatePaymentRequest {
  subscriptionId: string;
  clientId: string;
  provider: PaymentProvider;
  providerPaymentId: string;
  amount: number;
}


