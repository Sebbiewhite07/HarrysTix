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
  dropTime: timestamp("drop_time").notNull(),
  isLive: boolean("is_live").default(false),
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
  maxPerUser: true,
  memberMaxPerUser: true,
  dropTime: true,
  isLive: true,
  imageUrl: true,
  description: true,
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

// Legacy exports for compatibility during migration
export const users = userProfiles;
export const insertUserSchema = insertUserProfileSchema;
export type InsertUser = InsertUserProfile;
export type User = UserProfile;
