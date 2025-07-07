import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
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
          id: crypto.randomUUID(),
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
          id: crypto.randomUUID(),
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
          id: crypto.randomUUID(),
          email: 'user@example.com',
          name: 'Regular User',
        });
      }

      // Create demo events
      const existingEvents = await storage.getAllEvents();
      if (existingEvents.length === 0) {
        const events = [
          {
            id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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
      const userId = crypto.randomUUID();
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
      const eventData = insertEventSchema.parse(req.body);
      const eventId = crypto.randomUUID();
      
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
      const ticketId = crypto.randomUUID();
      
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
      const applicationId = crypto.randomUUID();
      
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
      const inviteId = crypto.randomUUID();
      
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

  const httpServer = createServer(app);

  return httpServer;
}
