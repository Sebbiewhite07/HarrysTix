import { 
  userProfiles, 
  events, 
  tickets, 
  membershipApplications, 
  inviteCodes,
  type UserProfile, 
  type Event, 
  type Ticket, 
  type MembershipApplication, 
  type InviteCode,
  type InsertUserProfile, 
  type InsertEvent, 
  type InsertTicket, 
  type InsertMembershipApplication, 
  type InsertInviteCode,
  type User,
  type InsertUser 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User Profile methods
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  getUserProfileByEmail(email: string): Promise<UserProfile | undefined>;
  createUserProfile(user: InsertUserProfile & { id: string }): Promise<UserProfile>;
  updateUserProfile(id: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>): Promise<UserProfile | undefined>;
  
  // Event methods
  getAllEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent & { id: string }): Promise<Event>;
  updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined>;
  
  // Ticket methods
  getTicketsByUserId(userId: string): Promise<(Ticket & { event: Event })[]>;
  getTicketsByEventId(eventId: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket & { id: string }): Promise<Ticket>;
  
  // Membership Application methods
  getAllMembershipApplications(): Promise<MembershipApplication[]>;
  createMembershipApplication(application: InsertMembershipApplication & { id: string }): Promise<MembershipApplication>;
  updateMembershipApplicationStatus(id: string, status: 'approved' | 'rejected', inviteCode?: string): Promise<MembershipApplication | undefined>;
  
  // Invite Code methods
  getInviteCode(code: string): Promise<InviteCode | undefined>;
  createInviteCode(inviteCode: InsertInviteCode & { id: string }): Promise<InviteCode>;
  useInviteCode(code: string, userId: string): Promise<InviteCode | undefined>;
  
  // Legacy methods for backward compatibility
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User Profile methods
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.id, id));
    return result[0];
  }

  async getUserProfileByEmail(email: string): Promise<UserProfile | undefined> {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.email, email));
    return result[0];
  }

  async createUserProfile(user: InsertUserProfile & { id: string }): Promise<UserProfile> {
    const result = await db.insert(userProfiles).values(user).returning();
    return result[0];
  }

  async updateUserProfile(id: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>): Promise<UserProfile | undefined> {
    const result = await db.update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.id, id))
      .returning();
    return result[0];
  }

  // Event methods
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async createEvent(event: InsertEvent & { id: string }): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  // Ticket methods
  async getTicketsByUserId(userId: string): Promise<(Ticket & { event: Event })[]> {
    const result = await db
      .select()
      .from(tickets)
      .leftJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.userId, userId));
    
    return result.map(row => ({
      ...row.tickets,
      event: row.events!
    }));
  }

  async getTicketsByEventId(eventId: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.eventId, eventId));
  }

  async createTicket(ticket: InsertTicket & { id: string }): Promise<Ticket> {
    const result = await db.insert(tickets).values(ticket).returning();
    return result[0];
  }

  // Membership Application methods
  async getAllMembershipApplications(): Promise<MembershipApplication[]> {
    return await db.select().from(membershipApplications);
  }

  async createMembershipApplication(application: InsertMembershipApplication & { id: string }): Promise<MembershipApplication> {
    const result = await db.insert(membershipApplications).values(application).returning();
    return result[0];
  }

  async updateMembershipApplicationStatus(id: string, status: 'approved' | 'rejected', inviteCode?: string): Promise<MembershipApplication | undefined> {
    const result = await db.update(membershipApplications)
      .set({ status, inviteCode })
      .where(eq(membershipApplications.id, id))
      .returning();
    return result[0];
  }

  // Invite Code methods
  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    const result = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code));
    return result[0];
  }

  async createInviteCode(inviteCode: InsertInviteCode & { id: string }): Promise<InviteCode> {
    const result = await db.insert(inviteCodes).values(inviteCode).returning();
    return result[0];
  }

  async useInviteCode(code: string, userId: string): Promise<InviteCode | undefined> {
    const result = await db.update(inviteCodes)
      .set({ isUsed: true, usedBy: userId })
      .where(and(eq(inviteCodes.code, code), eq(inviteCodes.isUsed, false)))
      .returning();
    return result[0];
  }

  // Legacy methods for backward compatibility
  async getUser(id: number): Promise<User | undefined> {
    // Convert numeric id to string and search by id
    const result = await db.select().from(userProfiles).where(eq(userProfiles.id, id.toString()));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // In the new schema, we use email instead of username
    const result = await db.select().from(userProfiles).where(eq(userProfiles.email, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    // Generate a UUID for the new user
    const id = crypto.randomUUID();
    const result = await db.insert(userProfiles).values({
      id,
      email: user.email,
      name: user.name,
    }).returning();
    return result[0];
  }
}

export class MemStorage implements IStorage {
  private userProfiles: Map<string, UserProfile>;
  private events: Map<string, Event>;
  private tickets: Map<string, Ticket>;
  private membershipApplications: Map<string, MembershipApplication>;
  private inviteCodes: Map<string, InviteCode>;

  constructor() {
    this.userProfiles = new Map();
    this.events = new Map();
    this.tickets = new Map();
    this.membershipApplications = new Map();
    this.inviteCodes = new Map();
  }

  // User Profile methods
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    return this.userProfiles.get(id);
  }

  async getUserProfileByEmail(email: string): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values()).find(user => user.email === email);
  }

  async createUserProfile(user: InsertUserProfile & { id: string }): Promise<UserProfile> {
    const userProfile: UserProfile = {
      ...user,
      isMember: false,
      membershipExpiry: null,
      inviteCode: null,
      joinDate: new Date(),
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userProfiles.set(user.id, userProfile);
    return userProfile;
  }

  async updateUserProfile(id: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>): Promise<UserProfile | undefined> {
    const user = this.userProfiles.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.userProfiles.set(id, updatedUser);
    return updatedUser;
  }

  // Event methods
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(event: InsertEvent & { id: string }): Promise<Event> {
    const newEvent: Event = {
      ...event,
      soldTickets: 0,
      isLive: event.isLive ?? false,
      maxPerUser: event.maxPerUser ?? 4,
      memberMaxPerUser: event.memberMaxPerUser ?? 2,
      imageUrl: event.imageUrl ?? null,
      description: event.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.events.set(event.id, newEvent);
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...updates, updatedAt: new Date() };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  // Ticket methods
  async getTicketsByUserId(userId: string): Promise<(Ticket & { event: Event })[]> {
    const userTickets = Array.from(this.tickets.values()).filter(ticket => ticket.userId === userId);
    return userTickets.map(ticket => ({
      ...ticket,
      event: this.events.get(ticket.eventId)!
    }));
  }

  async getTicketsByEventId(eventId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(ticket => ticket.eventId === eventId);
  }

  async createTicket(ticket: InsertTicket & { id: string }): Promise<Ticket> {
    const newTicket: Ticket = {
      ...ticket,
      purchaseDate: new Date(),
      status: "confirmed",
      ticketCredentials: (ticket as any).ticketCredentials || null,
      createdAt: new Date(),
    };
    this.tickets.set(ticket.id, newTicket);
    return newTicket;
  }

  // Membership Application methods
  async getAllMembershipApplications(): Promise<MembershipApplication[]> {
    return Array.from(this.membershipApplications.values());
  }

  async createMembershipApplication(application: InsertMembershipApplication & { id: string }): Promise<MembershipApplication> {
    const newApplication: MembershipApplication = {
      ...application,
      status: "pending",
      appliedDate: new Date(),
      inviteCode: null,
      createdAt: new Date(),
    };
    this.membershipApplications.set(application.id, newApplication);
    return newApplication;
  }

  async updateMembershipApplicationStatus(id: string, status: 'approved' | 'rejected', inviteCode?: string): Promise<MembershipApplication | undefined> {
    const application = this.membershipApplications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, status, inviteCode: inviteCode || null };
    this.membershipApplications.set(id, updatedApplication);
    return updatedApplication;
  }

  // Invite Code methods
  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    return Array.from(this.inviteCodes.values()).find(invite => invite.code === code);
  }

  async createInviteCode(inviteCode: InsertInviteCode & { id: string }): Promise<InviteCode> {
    const newInviteCode: InviteCode = {
      ...inviteCode,
      usedBy: null,
      isUsed: false,
      createdDate: new Date(),
    };
    this.inviteCodes.set(inviteCode.id, newInviteCode);
    return newInviteCode;
  }

  async useInviteCode(code: string, userId: string): Promise<InviteCode | undefined> {
    const inviteCode = Array.from(this.inviteCodes.values()).find(invite => invite.code === code && !invite.isUsed);
    if (!inviteCode) return undefined;
    
    const updatedInviteCode = { ...inviteCode, isUsed: true, usedBy: userId };
    this.inviteCodes.set(inviteCode.id, updatedInviteCode);
    return updatedInviteCode;
  }

  // Legacy methods for backward compatibility
  async getUser(id: number): Promise<User | undefined> {
    return this.userProfiles.get(id.toString());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.getUserProfileByEmail(username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    return this.createUserProfile({ id, ...user });
  }
}

export const storage = new DatabaseStorage();
