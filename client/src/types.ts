// Re-export all types from the shared schema
export type { 
  UserProfile, 
  Event, 
  Ticket, 
  PreOrder, 
  MembershipApplication, 
  InviteCode,
  InsertUserProfile,
  InsertEvent,
  InsertTicket,
  InsertPreOrder,
  InsertMembershipApplication,
  InsertInviteCode
} from '../../shared/schema';

// Additional frontend-specific types
export interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface EventWithUserData extends Event {
  userPreOrder?: PreOrder;
  userTicket?: Ticket;
}