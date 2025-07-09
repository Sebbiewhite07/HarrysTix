import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import { randomUUID } from "crypto";
import { processWeeklyPreOrders } from './scheduler';
import { sendTicketConfirmationEmail, sendPreOrderConfirmationEmail } from "./emailService";
import { 
  insertUserProfileSchema, 
  insertEventSchema, 
  insertTicketSchema, 
  insertMembershipApplicationSchema,
  insertInviteCodeSchema,
  insertPreOrderSchema,
  type UserProfile 
} from "@shared/schema";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Session configuration
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize demo data
  const initializeDemoData = async () => {
    try {
      // Create demo admin user
      const adminUser = await storage.getUserProfileByEmail('admin@example.com');
      if (!adminUser) {
        await storage.createUserProfile({
          id: randomUUID(),
          email: 'admin@example.com',
          name: 'Admin User',
        });
        
        // Update to make admin
        const createdAdmin = await storage.getUserProfileByEmail('admin@example.com');
        if (createdAdmin) {
          await storage.updateUserProfile(createdAdmin.id, {
            isMember: true,
            isAdmin: true,
            membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          });
        }
      }

      // Create demo member user
      const memberUser = await storage.getUserProfileByEmail('member@example.com');
      if (!memberUser) {
        await storage.createUserProfile({
          id: randomUUID(),
          email: 'member@example.com',
          name: 'Member User',
        });
        
        const createdMember = await storage.getUserProfileByEmail('member@example.com');
        if (createdMember) {
          await storage.updateUserProfile(createdMember.id, {
            isMember: true,
            membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          });
        }
      }

      // Create demo regular user
      const regularUser = await storage.getUserProfileByEmail('user@example.com');
      if (!regularUser) {
        await storage.createUserProfile({
          id: randomUUID(),
          email: 'user@example.com',
          name: 'Regular User',
        });
      }

      // Create demo events
      const existingEvents = await storage.getAllEvents();
      if (existingEvents.length === 0) {
        const events = [
          {
            id: randomUUID(),
            title: 'Warehouse Rave',
            venue: 'Ministry of Sound',
            date: new Date(Date.now() + 24 * 60 * 60 * 1000),
            time: '22:00',
            publicPrice: '15.00',
            memberPrice: '12.00',
            maxTickets: 500,
            maxPerUser: 4,
            memberMaxPerUser: 1,
            dropTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
            isLive: true,
            imageUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
            description: 'The biggest underground event of the term. Harry\'s bringing the heat!'
          },
          {
            id: randomUUID(),
            title: 'Freshers Finale',
            venue: 'Fabric',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            time: '23:00',
            publicPrice: '20.00',
            memberPrice: '16.00',
            maxTickets: 800,
            maxPerUser: 4,
            memberMaxPerUser: 2,
            dropTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
            isLive: false,
            imageUrl: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800',
            description: 'End your Freshers week with a bang. This is THE event everyone\'s talking about.'
          },
          {
            id: randomUUID(),
            title: 'Techno Thursday',
            venue: 'XOYO',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            time: '21:30',
            publicPrice: '12.00',
            memberPrice: '9.00',
            maxTickets: 300,
            maxPerUser: 2,
            memberMaxPerUser: 1,
            dropTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
            isLive: true,
            imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
            description: 'Sold out! But don\'t worry, Harry\'s got more coming...'
          }
        ];

        for (const event of events) {
          await storage.createEvent(event);
        }
      }
    } catch (error) {
      console.error('Error initializing demo data:', error);
    }
  };

  // Initialize demo data on startup
  setTimeout(initializeDemoData, 1000);

  // Auth middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await storage.getUserProfile(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  // Authentication routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, name } = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserProfileByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user profile
      const userId = randomUUID();
      const user = await storage.createUserProfile({
        id: userId,
        email,
        name,
      });

      // Set session
      req.session.userId = userId;
      
      res.json({ user });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserProfileByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // For demo purposes, accept any password for existing users
      // In production, you'd verify the hashed password
      
      req.session.userId = user.id;
      res.json({ user });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = await storage.getUserProfile(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({ user });
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      console.error('Get event error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/events', requireAuth, requireAdmin, async (req, res) => {
    try {
      // Manual transformation for now to handle validation
      const eventData = {
        title: req.body.title,
        venue: req.body.venue,
        date: new Date(req.body.date),
        time: req.body.time,
        publicPrice: req.body.publicPrice.toString(),
        memberPrice: req.body.memberPrice.toString(),
        maxTickets: req.body.maxTickets,
        soldTickets: req.body.soldTickets || 0,
        maxPerUser: req.body.maxPerUser,
        memberMaxPerUser: req.body.memberMaxPerUser,
        // dropTime field is now auto-generated with defaultNow()
        isLive: req.body.isLive, // Now determined by status field from frontend
        status: req.body.status || 'draft',
        imageUrl: req.body.imageUrl || null,
        description: req.body.description || null,
      };
      
      const eventId = randomUUID();
      
      const event = await storage.createEvent({
        id: eventId,
        ...eventData,
      });
      
      res.json(event);
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Upload tickets for an event (Admin only)
  app.post('/api/events/:id/tickets/upload', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id: eventId } = req.params;
      const { tickets } = req.body; // Array of email:password strings
      const currentUserId = req.user.id; // Use the authenticated user's ID
      
      if (!Array.isArray(tickets)) {
        return res.status(400).json({ error: 'Tickets must be an array' });
      }

      // Validate event exists
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Parse and validate tickets format (email:password)
      const parsedTickets = [];
      for (const ticket of tickets) {
        if (typeof ticket !== 'string' || !ticket.includes(':')) {
          return res.status(400).json({ error: 'Invalid ticket format. Expected email:password' });
        }
        
        const [email, password] = ticket.split(':');
        if (!email || !password) {
          return res.status(400).json({ error: 'Invalid ticket format. Email and password required' });
        }
        
        parsedTickets.push({ email: email.trim(), password: password.trim() });
      }

      // Create tickets in database
      const createdTickets = [];
      for (const ticketData of parsedTickets) {
        const ticket = await storage.createTicket({
          id: randomUUID(),
          eventId,
          userId: currentUserId, // Use admin user who uploaded the tickets
          quantity: 1,
          totalPrice: '0', // Admin uploaded tickets are free
          confirmationCode: `HTX-${event.title.substring(0, 3).toUpperCase()}-${Date.now()}`,
          status: 'confirmed',
          ticketCredentials: `${ticketData.email}:${ticketData.password}` // Store credentials
        });
        createdTickets.push(ticket);
      }

      res.json({
        message: `Successfully uploaded ${createdTickets.length} tickets`,
        tickets: createdTickets
      });
    } catch (error) {
      console.error('Upload tickets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all tickets for an event (Admin only)
  app.get('/api/events/:id/tickets', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id: eventId } = req.params;
      
      const tickets = await storage.getTicketsByEventId(eventId);
      res.json(tickets);
    } catch (error) {
      console.error('Get event tickets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Stripe payment intent for individual ticket purchases
  app.post('/api/create-payment-intent', requireAuth, async (req, res) => {
    try {
      const { eventId, quantity } = req.body;
      
      if (!eventId || !quantity) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const user = await storage.getUserProfile(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Calculate price based on membership status
      const unitPrice = user.isMember ? event.memberPrice : event.publicPrice;
      const totalAmount = unitPrice * quantity;
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to pence
        currency: 'gbp',
        metadata: {
          eventId,
          userId: user.id,
          quantity: quantity.toString(),
          unitPrice: unitPrice.toString()
        }
      });
      
      res.json({ 
        client_secret: paymentIntent.client_secret,
        amount: totalAmount
      });
    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  // Ticket routes
  app.get('/api/tickets', requireAuth, async (req, res) => {
    try {
      const tickets = await storage.getTicketsByUserId(req.user.id);
      res.json(tickets);
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create ticket after successful payment confirmation
  app.post('/api/tickets/confirm-payment', requireAuth, async (req, res) => {
    try {
      const { eventId, quantity, totalPrice } = req.body;
      
      if (!eventId || !quantity || !totalPrice) {
        return res.status(400).json({ 
          error: "Missing required fields", 
          required: ["eventId", "quantity", "totalPrice"] 
        });
      }
      
      const ticketId = randomUUID();
      const confirmationCode = `HTX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const ticket = await storage.createTicket({
        id: ticketId,
        eventId: eventId,
        userId: req.user.id,
        quantity: parseInt(quantity),
        totalPrice: totalPrice.toString(),
        confirmationCode,
        status: 'confirmed',
        purchaseDate: new Date(),
      });

      console.log(`✅ Direct ticket created after payment: ${confirmationCode} for user ${req.user.id}`);

      // Send ticket confirmation email asynchronously
      setImmediate(async () => {
        try {
          const user = await storage.getUserProfile(req.user.id);
          const event = await storage.getEvent(eventId);
          
          if (user && event) {
            const emailResult = await sendTicketConfirmationEmail(user, ticket, event);
            if (emailResult.success) {
              console.log(`✅ Direct ticket email sent to ${user.email} for ${ticket.confirmationCode}`);
            }
          }
        } catch (emailError) {
          console.error(`Error sending direct ticket email:`, emailError);
        }
      });
      
      res.json(ticket);
    } catch (error) {
      console.error('Confirm payment ticket error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Legacy ticket creation endpoint (for demo purposes)
  app.post('/api/tickets', requireAuth, async (req, res) => {
    try {
      const { eventId, quantity, totalPrice } = req.body;
      
      // Validate required fields manually
      if (!eventId || !quantity || !totalPrice) {
        return res.status(400).json({ 
          error: "Missing required fields", 
          required: ["eventId", "quantity", "totalPrice"] 
        });
      }
      
      const ticketId = randomUUID();
      const confirmationCode = `HTX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const ticket = await storage.createTicket({
        id: ticketId,
        eventId: eventId,
        userId: req.user.id,
        quantity: parseInt(quantity),
        totalPrice: totalPrice.toString(),
        confirmationCode,
      });

      // Send ticket confirmation email (but don't block the response)
      setImmediate(async () => {
        try {
          const user = await storage.getUserProfile(req.user.id);
          const event = await storage.getEvent(eventId);
          
          if (user && event) {
            const emailResult = await sendTicketConfirmationEmail(user, ticket, event);
            if (emailResult.success) {
              console.log(`✅ Ticket email sent to ${user.email} for ${ticket.confirmationCode}`);
            }
          }
        } catch (emailError) {
          console.error(`Error sending ticket email:`, emailError);
        }
      });
      
      res.json(ticket);
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Invite code routes
  app.post('/api/invite-codes', requireAuth, requireAdmin, async (req, res) => {
    try {
      const inviteData = insertInviteCodeSchema.parse(req.body);
      const inviteId = randomUUID();
      
      const inviteCode = await storage.createInviteCode({
        id: inviteId,
        ...inviteData,
        createdBy: req.user.id,
      });
      
      res.json(inviteCode);
    } catch (error) {
      console.error('Create invite code error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/invite-codes/:code/use', requireAuth, async (req, res) => {
    try {
      const inviteCode = await storage.useInviteCode(req.params.code, req.user.id);
      
      if (!inviteCode) {
        return res.status(404).json({ error: 'Invalid or already used invite code' });
      }
      
      // Update user to member status
      await storage.updateUserProfile(req.user.id, {
        isMember: true,
        membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        inviteCode: req.params.code,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Use invite code error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Pre-order endpoints
  app.get("/api/pre-orders", requireAuth, async (req, res) => {
    try {
      const preOrders = await storage.getPreOrdersByUserId(req.user.id);
      res.json(preOrders);
    } catch (error) {
      console.error("Error fetching pre-orders:", error);
      res.status(500).json({ error: "Failed to fetch pre-orders" });
    }
  });

  app.get("/api/pre-orders/weekly", requireAuth, async (req, res) => {
    try {
      const weeklyPreOrder = await storage.getUserWeeklyPreOrder(req.user.id);
      res.json(weeklyPreOrder || null);
    } catch (error) {
      console.error("Error fetching weekly pre-order:", error);
      res.status(500).json({ error: "Failed to fetch weekly pre-order" });
    }
  });

  app.post("/api/pre-orders", requireAuth, async (req, res) => {
    try {
      // Check if user is a member
      const user = await storage.getUserProfile(req.user.id);
      if (!user?.isMember) {
        return res.status(403).json({ error: "Only Harry's Club members can place pre-orders" });
      }

      const { eventId, quantity, paymentMethodId } = req.body;
      
      // Check if user already has a pre-order for this specific event
      const existingPreOrders = await storage.getPreOrdersByUserId(req.user.id);
      const hasPreOrderForEvent = existingPreOrders.some(po => 
        po.eventId === eventId && !['cancelled', 'failed', 'paid'].includes(po.status)
      );
      
      if (hasPreOrderForEvent) {
        return res.status(400).json({ 
          error: "You already have a pre-order for this event."
        });
      }
      
      if (!eventId || !quantity || quantity <= 0 || !paymentMethodId) {
        return res.status(400).json({ error: "Invalid pre-order data" });
      }

      // Get event to calculate price
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if event is available for pre-order
      if (event.status !== "pre-order") {
        return res.status(400).json({ error: "Event is not available for pre-order" });
      }

      const totalPrice = (parseFloat(event.memberPrice) * quantity).toFixed(2);

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id }
        });
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUserProfile(user.id, { stripeCustomerId });
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      const preOrderId = randomUUID();

      const preOrder = await storage.createPreOrder({
        id: preOrderId,
        userId: req.user.id,
        eventId,
        quantity,
        totalPrice,
        paymentMethodId,
        stripeCustomerId,
      });

      // Send pre-order confirmation email
      try {
        const event = await storage.getEvent(eventId);
        if (event) {
          const emailResult = await sendPreOrderConfirmationEmail(user, event, preOrderId);
          if (emailResult.success) {
            console.log(`✅ Pre-order confirmation email sent to ${user.email}`);
          }
        }
      } catch (emailError) {
        console.error(`Error sending pre-order confirmation email:`, emailError);
      }

      res.json(preOrder);
    } catch (error) {
      console.error("Error creating pre-order:", error);
      res.status(500).json({ error: "Failed to create pre-order" });
    }
  });

  app.delete("/api/pre-orders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const cancelledPreOrder = await storage.cancelPreOrder(id, req.user.id);
      
      if (!cancelledPreOrder) {
        return res.status(404).json({ error: "Pre-order not found or cannot be cancelled" });
      }

      res.json(cancelledPreOrder);
    } catch (error) {
      console.error("Error cancelling pre-order:", error);
      res.status(500).json({ error: "Failed to cancel pre-order" });
    }
  });

  // Stripe endpoints
  app.post("/api/create-setup-intent", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserProfile(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id }
        });
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUserProfile(user.id, { stripeCustomerId });
      }

      // Create setup intent
      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        usage: 'off_session',
      });

      res.json({ client_secret: setupIntent.client_secret });
    } catch (error) {
      console.error("Error creating setup intent:", error);
      res.status(500).json({ error: "Failed to create setup intent" });
    }
  });

  // Admin endpoints for pre-order management
  app.get("/api/admin/pre-orders", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allPreOrders = await storage.getAllPreOrders();
      
      // Fetch additional details for each pre-order
      const preOrdersWithDetails = await Promise.all(
        allPreOrders.map(async (preOrder) => {
          const event = await storage.getEvent(preOrder.eventId);
          const user = await storage.getUserProfile(preOrder.userId);
          
          return {
            ...preOrder,
            event,
            user: user ? { name: user.name, email: user.email } : null
          };
        })
      );

      res.json(preOrdersWithDetails);
    } catch (error) {
      console.error("Error fetching admin pre-orders:", error);
      res.status(500).json({ error: "Failed to fetch pre-orders" });
    }
  });

  app.patch("/api/admin/pre-orders/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedPreOrder = await storage.updatePreOrderStatus(id, status, {
        approvedAt: status === 'approved' ? new Date() : undefined
      });

      if (!updatedPreOrder) {
        return res.status(404).json({ error: "Pre-order not found" });
      }

      res.json(updatedPreOrder);
    } catch (error) {
      console.error("Error updating pre-order:", error);
      res.status(500).json({ error: "Failed to update pre-order" });
    }
  });

  // Admin pre-order fulfillment endpoint
  app.post("/api/admin/fulfill-pre-orders", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { preOrderIds } = req.body;
      
      if (!Array.isArray(preOrderIds) || preOrderIds.length === 0) {
        return res.status(400).json({ error: "No pre-orders specified" });
      }

      const results = [];
      const allPreOrders = await storage.getAllPreOrders();

      for (const preOrderId of preOrderIds) {
        try {
          // Get pre-order details
          const preOrder = allPreOrders.find(po => po.id === preOrderId);
          
          if (!preOrder) {
            results.push({ preOrderId, status: "failed", error: "Pre-order not found" });
            continue;
          }
          
          if (preOrder.status !== "pending" && preOrder.status !== "approved") {
            results.push({ preOrderId, status: "failed", error: `Invalid status: ${preOrder.status}` });
            continue;
          }

          if (!preOrder.stripeCustomerId || !preOrder.paymentMethodId) {
            results.push({ preOrderId, status: "failed", error: "Missing payment information - user needs to complete pre-order setup" });
            continue;
          }

          // Create payment intent with off_session
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(preOrder.totalPrice) * 100), // Convert to cents
            currency: 'gbp',
            customer: preOrder.stripeCustomerId,
            payment_method: preOrder.paymentMethodId,
            off_session: true,
            confirm: true,
            metadata: {
              preOrderId: preOrder.id,
              eventId: preOrder.eventId,
              userId: preOrder.userId
            }
          });

          // Update pre-order with payment intent ID
          await storage.updatePreOrderStatus(preOrder.id, "processing", {
            stripePaymentIntentId: paymentIntent.id
          });

          results.push({ 
            preOrderId, 
            status: "processing", 
            paymentIntentId: paymentIntent.id 
          });

        } catch (error: any) {
          console.error(`Error processing pre-order ${preOrderId}:`, error);
          
          // Mark as failed
          await storage.updatePreOrderStatus(preOrderId, "failed", {
            failedAt: new Date()
          });

          results.push({ 
            preOrderId, 
            status: "failed", 
            error: error.message 
          });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Error fulfilling pre-orders:", error);
      res.status(500).json({ error: "Failed to fulfill pre-orders" });
    }
  });

  // Stripe webhook handler for payment confirmation
  app.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        const preOrderId = paymentIntent.metadata?.preOrderId;
        const eventId = paymentIntent.metadata?.eventId;
        const userId = paymentIntent.metadata?.userId;
        const quantity = paymentIntent.metadata?.quantity;
        
        if (preOrderId) {
          // Handle pre-order payment
          try {
            await storage.updatePreOrderStatus(preOrderId, "paid", {
              paidAt: new Date()
            });

            const preOrder = (await storage.getAllPreOrders()).find(po => po.id === preOrderId);
            if (preOrder) {
              const ticketId = randomUUID();
              const confirmationCode = `HTX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              
              await storage.createTicket({
                id: ticketId,
                eventId: preOrder.eventId,
                userId: preOrder.userId,
                quantity: preOrder.quantity,
                totalPrice: preOrder.totalPrice,
                confirmationCode,
                status: 'confirmed',
                purchaseDate: new Date(),
              });

              console.log(`Ticket created for pre-order ${preOrderId}: ${confirmationCode}`);
              
              // Send email notification asynchronously
              setImmediate(async () => {
                try {
                  const user = await storage.getUserProfile(preOrder.userId);
                  const event = await storage.getEvent(preOrder.eventId);
                  
                  if (user && event) {
                    const emailResult = await sendTicketConfirmationEmail(user, {
                      id: ticketId,
                      eventId: preOrder.eventId,
                      userId: preOrder.userId,
                      quantity: preOrder.quantity,
                      totalPrice: preOrder.totalPrice,
                      confirmationCode,
                      status: 'confirmed',
                      purchaseDate: new Date(),
                    }, event);
                    
                    if (emailResult.success) {
                      console.log(`✅ Pre-order ticket email sent to ${user.email} for ${confirmationCode}`);
                    }
                  }
                } catch (emailError) {
                  console.error(`Error sending pre-order ticket email:`, emailError);
                }
              });
            }
          } catch (error) {
            console.error(`Error processing pre-order payment ${preOrderId}:`, error);
          }
        } else if (eventId && userId && quantity) {
          // Handle direct ticket payment
          try {
            const ticketId = randomUUID();
            const confirmationCode = `HTX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const totalPrice = (paymentIntent.amount / 100).toString(); // Convert from pence
            
            const ticket = await storage.createTicket({
              id: ticketId,
              eventId,
              userId,
              quantity: parseInt(quantity),
              totalPrice,
              confirmationCode,
              status: 'confirmed',
              purchaseDate: new Date(),
            });
            
            console.log(`Direct ticket created: ${confirmationCode} for user ${userId}`);
            
            // Send email notification asynchronously
            setImmediate(async () => {
              try {
                const user = await storage.getUserProfile(userId);
                const event = await storage.getEvent(eventId);
                
                if (user && event) {
                  const emailResult = await sendTicketConfirmationEmail(user, ticket, event);
                  if (emailResult.success) {
                    console.log(`✅ Direct ticket email sent to ${user.email} for ${confirmationCode}`);
                  }
                }
              } catch (emailError) {
                console.error(`Error sending direct ticket email:`, emailError);
              }
            });
            
          } catch (error) {
            console.error(`Error processing direct ticket payment:`, error);
          }
        }
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        const failedPreOrderId = failedPayment.metadata?.preOrderId;
        if (failedPreOrderId) {
          try {
            await storage.updatePreOrderStatus(failedPreOrderId, "failed", {
              failedAt: new Date()
            });
            console.log(`Pre-order ${failedPreOrderId} marked as failed`);
          } catch (error) {
            console.error(`Error updating failed pre-order ${failedPreOrderId}:`, error);
          }
        }
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  });

  // Manual trigger for weekly pre-order processing (admin only)
  app.post("/api/admin/process-weekly-preorders", requireAuth, requireAdmin, async (req, res) => {
    try {
      console.log('Manual weekly pre-order processing triggered by admin');
      const results = await processWeeklyPreOrders();
      res.json({ 
        success: true, 
        message: 'Weekly pre-order processing completed',
        results 
      });
    } catch (error) {
      console.error('Error in manual weekly processing:', error);
      res.status(500).json({ error: 'Failed to process weekly pre-orders' });
    }
  });

  // Membership application routes
  app.post("/api/membership-applications", requireAuth, async (req, res) => {
    try {
      const { university, reason } = req.body;
      const user = await storage.getUserProfile(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const application = await storage.createMembershipApplication({
        id: randomUUID(),
        userId: req.user.id,
        email: user.email,
        name: user.name,
        university,
        reason,
        status: 'pending'
      });

      res.json(application);
    } catch (error) {
      console.error("Error creating membership application:", error);
      res.status(500).json({ error: "Failed to create application" });
    }
  });

  // Admin pre-order management
  app.get("/api/admin/pre-orders", requireAuth, requireAdmin, async (req, res) => {
    try {
      const preOrders = await storage.getAllPreOrders();
      res.json(preOrders);
    } catch (error) {
      console.error("Error fetching all pre-orders:", error);
      res.status(500).json({ error: "Failed to fetch pre-orders" });
    }
  });

  app.patch("/api/admin/pre-orders/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, ...additionalFields } = req.body;

      // Clean up additionalFields to only include valid database fields
      const cleanAdditionalFields: any = {};
      const validFields = ['paymentMethodId', 'stripeCustomerId', 'stripePaymentIntentId'];
      
      Object.keys(additionalFields).forEach(key => {
        if (validFields.includes(key)) {
          cleanAdditionalFields[key] = additionalFields[key];
        }
      });

      const updatedPreOrder = await storage.updatePreOrderStatus(id, status, cleanAdditionalFields);
      
      if (!updatedPreOrder) {
        return res.status(404).json({ error: "Pre-order not found" });
      }

      res.json(updatedPreOrder);
    } catch (error) {
      console.error("Error updating pre-order:", error);
      res.status(500).json({ error: "Failed to update pre-order" });
    }
  });

  // Admin membership applications
  app.get("/api/admin/membership-applications", requireAuth, requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getAllMembershipApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching membership applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.patch("/api/admin/membership-applications/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, inviteCode } = req.body;

      const application = await storage.updateMembershipApplicationStatus(id, status, inviteCode);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // If approved, grant membership to the user
      if (status === 'approved' && application.userId) {
        const membershipExpiry = new Date();
        membershipExpiry.setFullYear(membershipExpiry.getFullYear() + 1); // 1 year membership
        
        await storage.updateUserProfile(application.userId, {
          isMember: true,
          membershipExpiry: membershipExpiry
        });
      }

      res.json(application);
    } catch (error) {
      console.error("Error updating membership application:", error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // Harry's Club Subscription Management Routes

  // Create Stripe checkout session for subscription
  app.post("/api/create-subscription", requireAuth, async (req, res) => {
    try {
      const { priceId } = req.body;
      const userId = req.user.id;
      
      // Check if user already has an active subscription
      const existingMembership = await storage.getMembership(userId);
      if (existingMembership && existingMembership.status === 'active') {
        return res.status(400).json({ error: "User already has an active subscription" });
      }

      const user = await storage.getUserProfile(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price: priceId || 'price_1QGvpDAuY5bChKhPqVFJjQgn', // Default Harry's Club price
          quantity: 1
        }],
        customer_email: user.email,
        success_url: `${req.protocol}://${req.get('host')}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/membership/cancelled`,
        metadata: {
          userId: userId
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Get user's membership status
  app.get("/api/membership", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const membership = await storage.getMembership(userId);
      
      if (!membership) {
        return res.json({ hasSubscription: false });
      }

      // Check if membership is active and not expired
      const isActive = membership.status === 'active' && 
                     (!membership.currentPeriodEnd || new Date() < membership.currentPeriodEnd);

      res.json({
        hasSubscription: true,
        membership: {
          ...membership,
          isActive
        }
      });
    } catch (error: any) {
      console.error('Get membership error:', error);
      res.status(500).json({ error: "Failed to get membership status" });
    }
  });

  // Cancel subscription
  app.post("/api/cancel-subscription", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const membership = await storage.getMembership(userId);
      
      if (!membership || !membership.stripeSubscriptionId) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      // Cancel subscription at period end
      await stripe.subscriptions.update(membership.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update membership record
      await storage.updateMembership(membership.id, {
        cancelAtPeriodEnd: true
      });

      res.json({ success: true, message: "Subscription will be cancelled at the end of the current period" });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Stripe webhook endpoint
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        // Subscription Events for Harry's Club
        case 'checkout.session.completed':
          const session = event.data.object;
          if (session.mode === 'subscription') {
            const userId = session.metadata?.userId;
            const customerId = session.customer;
            const subscriptionId = session.subscription;
            
            if (userId && customerId && subscriptionId) {
              // Create membership record
              const membershipId = randomUUID();
              await storage.createMembership({
                id: membershipId,
                userId,
                stripeCustomerId: customerId as string,
                stripeSubscriptionId: subscriptionId as string,
                status: 'active',
                currentPeriodEnd: null, // Will be updated by invoice.paid event
                cancelAtPeriodEnd: false
              });

              // Update user profile to grant membership
              await storage.updateUserProfile(userId, {
                isMember: true,
                stripeCustomerId: customerId as string
              });

              console.log(`✅ Subscription created for user ${userId}: ${subscriptionId}`);
            }
          }
          break;

        case 'invoice.paid':
          const invoice = event.data.object;
          if (invoice.subscription) {
            const membership = await storage.getUserMembershipByStripeId(invoice.subscription as string);
            if (membership) {
              const periodEnd = new Date(invoice.period_end * 1000);
              await storage.updateMembership(membership.id, {
                status: 'active',
                currentPeriodEnd: periodEnd
              });
              console.log(`✅ Subscription renewed for user ${membership.userId} until ${periodEnd}`);
            }
          }
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          if (failedInvoice.subscription) {
            const membership = await storage.getUserMembershipByStripeId(failedInvoice.subscription as string);
            if (membership) {
              await storage.updateMembership(membership.id, {
                status: 'past_due'
              });
              console.log(`❌ Payment failed for subscription ${failedInvoice.subscription}`);
            }
          }
          break;

        case 'customer.subscription.updated':
          const subscription = event.data.object;
          const membership = await storage.getUserMembershipByStripeId(subscription.id);
          if (membership) {
            await storage.updateMembership(membership.id, {
              status: subscription.status as any,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            });
            console.log(`📝 Subscription updated: ${subscription.id} - ${subscription.status}`);
          }
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object;
          const deletedMembership = await storage.getUserMembershipByStripeId(deletedSubscription.id);
          if (deletedMembership) {
            await storage.updateMembership(deletedMembership.id, {
              status: 'canceled'
            });
            
            // Remove membership from user profile
            await storage.updateUserProfile(deletedMembership.userId, {
              isMember: false,
              membershipExpiry: new Date() // Set to current date to expire immediately
            });
            
            console.log(`🚫 Subscription cancelled: ${deletedSubscription.id}`);
          }
          break;

        // Pre-order Payment Events
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const preOrderId = paymentIntent.metadata.preOrderId;
          const eventId = paymentIntent.metadata.eventId;
          const userId = paymentIntent.metadata.userId;

          if (preOrderId && eventId && userId) {
            // Get pre-order details
            const allPreOrders = await storage.getAllPreOrders();
            const preOrder = allPreOrders.find(po => po.id === preOrderId);
            
            if (preOrder) {
              // Create ticket for the user
              const ticketId = randomUUID();
              const confirmationCode = `TIX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
              
              const ticket = await storage.createTicket({
                id: ticketId,
                eventId,
                userId,
                quantity: preOrder.quantity,
                totalPrice: preOrder.totalPrice,
                confirmationCode,
              });

              // Update pre-order status to paid
              await storage.updatePreOrderStatus(preOrderId, "paid", {
                paidAt: new Date(),
                ticketId: ticket.id
              });

              console.log(`✅ Pre-order ${preOrderId} fulfilled successfully - Ticket ${ticketId} created`);
            }
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          const failedPreOrderId = failedPaymentIntent.metadata.preOrderId;

          if (failedPreOrderId) {
            await storage.updatePreOrderStatus(failedPreOrderId, "failed", {
              failedAt: new Date()
            });
            console.log(`❌ Pre-order ${failedPreOrderId} payment failed`);
          }
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
