import { pgTable, text, serial, integer, boolean, timestamp, decimal, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User profiles table (replacing Supabase user_profiles)
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  isMember: boolean("is_member").default(false),
  membershipExpiry: timestamp("membership_expiry"),
  inviteCode: text("invite_code"),
  joinDate: timestamp("join_date").defaultNow(),
  isAdmin: boolean("is_admin").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull(),
  venue: text("venue").notNull(),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  publicPrice: decimal("public_price", { precision: 10, scale: 2 }).notNull(),
  memberPrice: decimal("member_price", { precision: 10, scale: 2 }).notNull(),
  maxTickets: integer("max_tickets").notNull(),
  soldTickets: integer("sold_tickets").default(0),
  maxPerUser: integer("max_per_user").default(4),
  memberMaxPerUser: integer("member_max_per_user").default(2),
  dropTime: timestamp("drop_time").defaultNow(), // Legacy field, not used anymore
  isLive: boolean("is_live").default(false), // Legacy field, kept for compatibility
  status: text("status").notNull().default("draft"), // 'draft' | 'pre-order' | 'live'
  imageUrl: text("image_url"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id),
  userId: uuid("user_id").notNull().references(() => userProfiles.id),
  quantity: integer("quantity").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  confirmationCode: text("confirmation_code").notNull(),
  status: text("status").notNull().default("confirmed"), // 'confirmed' | 'cancelled' | 'refunded'
  ticketCredentials: text("ticket_credentials"), // For admin uploaded tickets in email:password format
  createdAt: timestamp("created_at").defaultNow(),
});

// Membership applications table
export const membershipApplications = pgTable("membership_applications", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => userProfiles.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  university: text("university").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  appliedDate: timestamp("applied_date").defaultNow(),
  inviteCode: text("invite_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invite codes table
export const inviteCodes = pgTable("invite_codes", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  createdBy: uuid("created_by").notNull().references(() => userProfiles.id),
  usedBy: uuid("used_by").references(() => userProfiles.id),
  isUsed: boolean("is_used").default(false),
  createdDate: timestamp("created_date").defaultNow(),
  expiryDate: timestamp("expiry_date").notNull(),
});

// Pre-orders table for member ticket pre-ordering
export const preOrders = pgTable("pre_orders", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").default(1).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, paid, failed, cancelled
  paymentMethodId: text("payment_method_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Memberships table for recurring subscription billing
export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").$type<'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'>().notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Schema definitions for forms and validation
export const insertUserProfileSchema = createInsertSchema(userProfiles).pick({
  email: true,
  name: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  venue: true,
  date: true,
  time: true,
  publicPrice: true,
  memberPrice: true,
  maxTickets: true,
  soldTickets: true,
  maxPerUser: true,
  memberMaxPerUser: true,

  isLive: true,
  imageUrl: true,
  description: true,
}).extend({
  date: z.string().transform((val) => new Date(val)),
  publicPrice: z.number().transform((val) => val.toString()),
  memberPrice: z.number().transform((val) => val.toString()),
});

export const insertTicketSchema = createInsertSchema(tickets).pick({
  eventId: true,
  userId: true,
  quantity: true,
  totalPrice: true,
  confirmationCode: true,
});

export const insertMembershipApplicationSchema = createInsertSchema(membershipApplications).pick({
  email: true,
  name: true,
  university: true,
  reason: true,
});

export const insertInviteCodeSchema = createInsertSchema(inviteCodes).pick({
  code: true,
  createdBy: true,
  expiryDate: true,
});

export const insertPreOrderSchema = createInsertSchema(preOrders).pick({
  userId: true,
  eventId: true,
  quantity: true,
  totalPrice: true,
  paymentMethodId: true,
  stripeCustomerId: true,
});

export const insertMembershipSchema = createInsertSchema(memberships).pick({
  userId: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  status: true,
  currentPeriodEnd: true,
  cancelAtPeriodEnd: true,
});

// Type exports
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export type InsertMembershipApplication = z.infer<typeof insertMembershipApplicationSchema>;
export type MembershipApplication = typeof membershipApplications.$inferSelect;

export type InsertInviteCode = z.infer<typeof insertInviteCodeSchema>;
export type InviteCode = typeof inviteCodes.$inferSelect;

export type InsertPreOrder = z.infer<typeof insertPreOrderSchema>;
export type PreOrder = typeof preOrders.$inferSelect;

export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof memberships.$inferSelect;

// Legacy exports for compatibility during migration
export const users = userProfiles;
export const insertUserSchema = insertUserProfileSchema;
export type InsertUser = InsertUserProfile;
export type User = UserProfile;
