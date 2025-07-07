import { 
  userProfiles, 
  events, 
  tickets, 
  membershipApplications, 
  inviteCodes,
  preOrders,
  type UserProfile, 
  type Event, 
  type Ticket, 
  type MembershipApplication, 
  type InviteCode,
  type PreOrder,
  type InsertUserProfile, 
  type InsertEvent, 
  type InsertTicket, 
  type InsertMembershipApplication, 
  type InsertInviteCode,
  type InsertPreOrder,
  type User,
  type InsertUser 
} from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
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
  
  // Pre-Order methods
  getAllPreOrders(): Promise<PreOrder[]>;
  getPreOrdersByEventId(eventId: string): Promise<PreOrder[]>;
  getPreOrdersByUserId(userId: string): Promise<PreOrder[]>;
  getUserWeeklyPreOrder(userId: string): Promise<PreOrder | undefined>;
  createPreOrder(preOrder: InsertPreOrder & { id: string }): Promise<PreOrder>;
  updatePreOrderStatus(id: string, status: string, additionalFields?: Partial<PreOrder>): Promise<PreOrder | undefined>;
  cancelPreOrder(id: string, userId: string): Promise<PreOrder | undefined>;
  
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
    const updateData: any = { status, updatedAt: new Date() };
    if (inviteCode) {
      updateData.inviteCode = inviteCode;
    }

    const result = await db.update(membershipApplications)
      .set(updateData)
      .where(eq(membershipApplications.id, id))
      .returning();
      
    // If approved, automatically grant membership to the user
    if (status === 'approved' && result[0]) {
      const application = result[0];
      const membershipExpiry = new Date();
      membershipExpiry.setFullYear(membershipExpiry.getFullYear() + 1); // 1 year membership
      
      await db.update(userProfiles)
        .set({ 
          isMember: true, 
          membershipExpiry: membershipExpiry,
          updatedAt: new Date() 
        })
        .where(eq(userProfiles.id, application.userId));
    }
    
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

  // Pre-Order methods
  async getAllPreOrders(): Promise<PreOrder[]> {
    return await db.select().from(preOrders).orderBy(preOrders.createdAt);
  }

  async getPreOrdersByEventId(eventId: string): Promise<PreOrder[]> {
    return await db.select().from(preOrders).where(eq(preOrders.eventId, eventId)).orderBy(preOrders.createdAt);
  }

  async getPreOrdersByUserId(userId: string): Promise<PreOrder[]> {
    return await db.select().from(preOrders).where(eq(preOrders.userId, userId)).orderBy(preOrders.createdAt);
  }

  async getUserWeeklyPreOrder(userId: string): Promise<PreOrder | undefined> {
    // Get current week's pre-order (Monday to Sunday)
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const result = await db.select().from(preOrders)
      .where(
        and(
          eq(preOrders.userId, userId),
          gte(preOrders.createdAt, monday),
          lte(preOrders.createdAt, sunday)
        )
      )
      .orderBy(preOrders.createdAt);
    return result[0];
  }

  async createPreOrder(preOrder: InsertPreOrder & { id: string }): Promise<PreOrder> {
    const result = await db.insert(preOrders).values(preOrder).returning();
    return result[0];
  }

  async updatePreOrderStatus(id: string, status: string, additionalFields?: Partial<PreOrder>): Promise<PreOrder | undefined> {
    const updateData: any = { status, updatedAt: new Date(), ...additionalFields };
    
    // Handle timestamp fields properly
    if (status === 'approved' && !updateData.approvedAt) {
      updateData.approvedAt = new Date();
    }
    if (status === 'paid' && !updateData.paidAt) {
      updateData.paidAt = new Date();
    }
    if (status === 'failed' && !updateData.failedAt) {
      updateData.failedAt = new Date();
    }
    if (status === 'cancelled' && !updateData.cancelledAt) {
      updateData.cancelledAt = new Date();
    }

    const result = await db.update(preOrders)
      .set(updateData)
      .where(eq(preOrders.id, id))
      .returning();
    return result[0];
  }

  async cancelPreOrder(id: string, userId: string): Promise<PreOrder | undefined> {
    // First check if the pre-order exists and belongs to the user
    const existingPreOrder = await db.select().from(preOrders)
      .where(and(eq(preOrders.id, id), eq(preOrders.userId, userId)))
      .limit(1);
    
    if (existingPreOrder.length === 0) {
      return undefined;
    }

    const result = await db.update(preOrders)
      .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
      .where(and(eq(preOrders.id, id), eq(preOrders.userId, userId)))
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
  private preOrders: Map<string, PreOrder>;

  constructor() {
    this.userProfiles = new Map();
    this.events = new Map();
    this.tickets = new Map();
    this.membershipApplications = new Map();
    this.inviteCodes = new Map();
    this.preOrders = new Map();
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
      dropTime: new Date(), // Legacy field, auto-generated
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

  // Pre-Order methods
  async getAllPreOrders(): Promise<PreOrder[]> {
    return Array.from(this.preOrders.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getPreOrdersByEventId(eventId: string): Promise<PreOrder[]> {
    return Array.from(this.preOrders.values())
      .filter(preOrder => preOrder.eventId === eventId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getPreOrdersByUserId(userId: string): Promise<PreOrder[]> {
    return Array.from(this.preOrders.values())
      .filter(preOrder => preOrder.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getUserWeeklyPreOrder(userId: string): Promise<PreOrder | undefined> {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return Array.from(this.preOrders.values())
      .find(preOrder => 
        preOrder.userId === userId &&
        preOrder.createdAt >= monday &&
        preOrder.createdAt <= sunday
      );
  }

  async createPreOrder(preOrder: InsertPreOrder & { id: string }): Promise<PreOrder> {
    const newPreOrder: PreOrder = {
      id: preOrder.id,
      eventId: preOrder.eventId,
      userId: preOrder.userId,
      quantity: preOrder.quantity ?? 1,
      totalPrice: preOrder.totalPrice,
      paymentMethodId: preOrder.paymentMethodId || null,
      stripeCustomerId: preOrder.stripeCustomerId || null,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      stripePaymentIntentId: null,
      approvedAt: null,
      paidAt: null,
      failedAt: null,
      cancelledAt: null,
    };
    this.preOrders.set(preOrder.id, newPreOrder);
    return newPreOrder;
  }

  async updatePreOrderStatus(id: string, status: string, additionalFields?: Partial<PreOrder>): Promise<PreOrder | undefined> {
    const preOrder = this.preOrders.get(id);
    if (!preOrder) return undefined;
    
    const updatedPreOrder = { 
      ...preOrder, 
      status, 
      updatedAt: new Date(),
      ...additionalFields 
    };
    this.preOrders.set(id, updatedPreOrder);
    return updatedPreOrder;
  }

  async cancelPreOrder(id: string, userId: string): Promise<PreOrder | undefined> {
    const preOrder = this.preOrders.get(id);
    if (!preOrder || preOrder.userId !== userId) return undefined;
    
    const updatedPreOrder = { 
      ...preOrder, 
      status: 'cancelled', 
      cancelledAt: new Date(),
      updatedAt: new Date() 
    };
    this.preOrders.set(id, updatedPreOrder);
    return updatedPreOrder;
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
