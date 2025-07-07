import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import { randomUUID } from "crypto";
import { 
  insertUserProfileSchema, 
  insertEventSchema, 
  insertTicketSchema, 
  insertMembershipApplicationSchema,
  insertInviteCodeSchema,
  type UserProfile 
} from "@shared/schema";

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

  app.post('/api/tickets', requireAuth, async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticketId = randomUUID();
      
      // Generate confirmation code
      const confirmationCode = `HTX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const ticket = await storage.createTicket({
        id: ticketId,
        ...ticketData,
        userId: req.user.id,
        confirmationCode,
      });
      
      res.json(ticket);
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Membership application routes
  app.get('/api/membership-applications', requireAuth, requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getAllMembershipApplications();
      res.json(applications);
    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/membership-applications', async (req, res) => {
    try {
      const applicationData = insertMembershipApplicationSchema.parse(req.body);
      const applicationId = randomUUID();
      
      const application = await storage.createMembershipApplication({
        id: applicationId,
        ...applicationData,
      });
      
      res.json(application);
    } catch (error) {
      console.error('Create application error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/membership-applications/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status, inviteCode } = req.body;
      
      const application = await storage.updateMembershipApplicationStatus(
        req.params.id,
        status,
        inviteCode
      );
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }
      
      res.json(application);
    } catch (error) {
      console.error('Update application error:', error);
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

      // Check if user already has a pre-order this week
      const existingPreOrder = await storage.getUserWeeklyPreOrder(req.user.id);
      if (existingPreOrder) {
        return res.status(400).json({ error: "You already have a pre-order for this week" });
      }

      const { eventId, quantity } = req.body;
      
      if (!eventId || !quantity || quantity <= 0) {
        return res.status(400).json({ error: "Invalid pre-order data" });
      }

      // Get event to calculate price
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const totalPrice = (parseFloat(event.memberPrice) * quantity).toFixed(2);
      const preOrderId = randomUUID();

      const preOrder = await storage.createPreOrder({
        id: preOrderId,
        userId: req.user.id,
        eventId,
        quantity,
        totalPrice,
        paymentMethodId: null,
        stripeCustomerId: null,
      });

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

      res.json(application);
    } catch (error) {
      console.error("Error updating membership application:", error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
