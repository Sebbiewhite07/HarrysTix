export interface User {
  id: string;
  email: string;
  name: string;
  isMember: boolean;
  membershipExpiry?: Date;
  inviteCode?: string;
  joinDate: Date;
  isAdmin?: boolean;
}

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    full_name?: string;
  };
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  is_member: boolean;
  membership_expiry?: string;
  invite_code?: string;
  join_date: string;
  is_admin?: boolean;
}

export interface Event {
  id: string;
  title: string;
  venue: string;
  date: Date;
  time: string;
  publicPrice: number;
  memberPrice: number;
  maxTickets: number;
  soldTickets: number;
  maxPerUser: number;
  memberMaxPerUser: number;
  dropTime: Date;
  isLive: boolean;
  imageUrl?: string;
  description?: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  quantity: number;
  totalPrice: number;
  purchaseDate: Date;
  confirmationCode: string;
  status: 'confirmed' | 'cancelled' | 'refunded';
  event: Event;
}

export interface MembershipApplication {
  id: string;
  email: string;
  name: string;
  university: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: Date;
  inviteCode?: string;
}

export interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  usedBy?: string;
  isUsed: boolean;
  createdDate: Date;
  expiryDate: Date;
}

export interface PreOrder {
  id: string;
  eventId: string;
  userId: string;
  quantity: number;
  totalPrice: string;
  status: string;
  paymentMethodId?: string;
  stripeCustomerId?: string;
  stripePaymentIntentId?: string;
  approvedAt?: Date;
  paidAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}