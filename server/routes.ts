import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertClientSchema, insertDocumentSchema, insertAppointmentSchema, insertTeamMemberSchema, insertKanbanTaskSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth, requireAuth } from "./auth";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper function to check if user has admin privileges
function hasAdminAccess(userRole: string): boolean {
  return userRole === 'admin' || userRole === 'super_admin';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Client routes
  app.get("/api/clients", requireAuth, async (req: any, res) => {
    try {
      // Admin and super admin can see all clients, regular users see only their own
      const userId = hasAdminAccess(req.user.role) ? undefined : req.user.id;
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", requireAuth, async (req: any, res) => {
    try {
      console.log("Creating client with data:", req.body);
      const result = insertClientSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Validation errors:", result.error.issues);
        return res.status(400).json({ message: "Invalid client data", errors: result.error.issues });
      }
      const clientData = { ...result.data, userId: req.user.id };
      console.log("Processed client data:", clientData);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Client creation error:", error);
      res.status(500).json({ message: "Failed to create client", error: error.message });
    }
  });

  app.put("/api/clients/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Updating client with ID:", id);
      console.log("Update data received:", req.body);
      
      const result = insertClientSchema.partial().safeParse(req.body);
      if (!result.success) {
        console.log("Validation errors:", result.error.issues);
        return res.status(400).json({ message: "Invalid client data", errors: result.error.issues });
      }
      
      console.log("Validated data:", result.data);
      const client = await storage.updateClient(id, result.data);
      if (!client) {
        console.log("Client not found with ID:", id);
        return res.status(404).json({ message: "Client not found" });
      }
      
      console.log("Client updated successfully:", client);
      res.json(client);
    } catch (error) {
      console.error("Client update error:", error);
      res.status(500).json({ message: "Failed to update client", error: error.message });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Document routes
  app.get("/api/documents", requireAuth, async (req: any, res) => {
    try {
      // Admin and super admin can see all documents, regular users see only their own
      const userId = hasAdminAccess(req.user.role) ? undefined : req.user.id;
      const documents = await storage.getDocuments(userId, req.user.role);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/client/:clientId", requireAuth, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const documents = await storage.getDocumentsByClient(clientId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", requireAuth, upload.single("file"), async (req: MulterRequest & any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const clientId = req.body.clientId ? parseInt(req.body.clientId) : null;
      
      const documentData = {
        name: req.file.filename || req.file.originalname,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        clientId,
        userId: req.user.id,
      };

      const result = insertDocumentSchema.safeParse(documentData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid document data", errors: result.error.issues });
      }

      const document = await storage.createDocument(result.data);
      res.status(201).json(document);
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get("/api/documents/:id/download", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const filePath = path.join(process.cwd(), "uploads", document.name);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.download(filePath, document.originalName);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  app.delete("/api/documents/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDocument(id);
      if (!success) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Profile picture routes
  app.post("/api/profile-picture", requireAuth, upload.single("file"), async (req: MulterRequest & any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check if file is an image
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: "Only image files are allowed" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Update user profile with image URL
      const updatedUser = await storage.updateUser(req.user.id, {
        profileImageUrl: imageUrl
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ 
        imageUrl,
        message: "Profile picture updated successfully" 
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  });

  app.delete("/api/profile-picture/:userId", requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user can delete this profile picture
      if (req.user.id !== userId && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const updatedUser = await storage.updateUser(userId, {
        profileImageUrl: null
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "Profile picture deleted successfully" });
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      res.status(500).json({ error: "Failed to delete profile picture" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", requireAuth, async (req: any, res) => {
    try {
      // Admin and super admin can see all appointments, regular users see only their own
      const userId = hasAdminAccess(req.user.role) ? undefined : req.user.id;
      const appointments = await storage.getAppointments(userId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/client/:clientId", requireAuth, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const appointments = await storage.getAppointmentsByClient(clientId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", requireAuth, async (req: any, res) => {
    try {
      const result = insertAppointmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid appointment data", errors: result.error.issues });
      }
      const appointmentData = { ...result.data, userId: req.user.id };
      const appointment = await storage.createAppointment(appointmentData);
      
      // Send notification to assigned user if different from creator
      if (appointment.assignedToId && appointment.assignedToId !== req.user.id) {
        const assignedUser = await storage.getUser(appointment.assignedToId);
        if (assignedUser) {
          // Broadcast appointment notification via WebSocket
          wss.clients.forEach((client: WebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'appointment_notification',
                data: {
                  id: `appointment_${appointment.id}`,
                  title: 'New Appointment Assigned',
                  body: `You have been assigned to: ${appointment.title}`,
                  timestamp: Date.now(),
                  type: 'appointment',
                  read: false,
                  url: `/appointments`,
                  appointmentId: appointment.id,
                  assignedToId: appointment.assignedToId,
                  createdBy: req.user.username
                }
              }));
            }
          });
        }
      }
      
      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertAppointmentSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid appointment data", errors: result.error.issues });
      }
      const appointment = await storage.updateAppointment(id, result.data);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAppointment(id);
      if (!success) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Users endpoint (replaces team members)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user (super admin only)
  app.put("/api/users/:id", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can edit users" });
      }

      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      // Remove password from update if empty
      if (updateData.password === '') {
        delete updateData.password;
      }
      
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user (super admin only)
  app.delete("/api/users/:id", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can delete users" });
      }

      const id = parseInt(req.params.id);
      
      // Prevent deleting self
      if (id === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Keep team-members endpoint for backward compatibility
  app.get("/api/team-members", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Stats route
  app.get("/api/stats", requireAuth, async (req: any, res) => {
    try {
      // Admin and super admin can see all stats, regular users see only their own
      const userId = hasAdminAccess(req.user.role) ? undefined : req.user.id;
      const stats = await storage.getStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Kanban Boards
  app.get("/api/kanban/boards", requireAuth, async (req: any, res) => {
    try {
      // Admin and super admin can see all boards, regular users see only their own
      const userId = hasAdminAccess(req.user.role) ? undefined : req.user.id;
      const boards = await storage.getKanbanBoards(userId);
      res.json(boards);
    } catch (error) {
      console.error("Error fetching kanban boards:", error);
      res.status(500).json({ error: "Failed to fetch kanban boards" });
    }
  });

  app.get("/api/kanban/boards/:id", requireAuth, async (req, res) => {
    try {
      const board = await storage.getKanbanBoard(parseInt(req.params.id));
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }
      res.json(board);
    } catch (error) {
      console.error("Error fetching kanban board:", error);
      res.status(500).json({ error: "Failed to fetch kanban board" });
    }
  });

  app.post("/api/kanban/boards", requireAuth, async (req: any, res) => {
    try {
      const boardData = { ...req.body, userId: req.user.id };
      const board = await storage.createKanbanBoard(boardData);
      res.status(201).json(board);
    } catch (error) {
      console.error("Error creating kanban board:", error);
      res.status(500).json({ error: "Failed to create kanban board" });
    }
  });

  app.put("/api/kanban/boards/:id", requireAuth, async (req, res) => {
    try {
      const board = await storage.updateKanbanBoard(parseInt(req.params.id), req.body);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }
      res.json(board);
    } catch (error) {
      console.error("Error updating kanban board:", error);
      res.status(500).json({ error: "Failed to update kanban board" });
    }
  });

  app.delete("/api/kanban/boards/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteKanbanBoard(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Board not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting kanban board:", error);
      res.status(500).json({ error: "Failed to delete kanban board" });
    }
  });

  // Kanban Columns
  app.get("/api/kanban/boards/:boardId/columns", requireAuth, async (req, res) => {
    try {
      const boardId = parseInt(req.params.boardId);
      if (isNaN(boardId)) {
        return res.status(400).json({ error: "Invalid board ID" });
      }
      const columns = await storage.getKanbanColumns(boardId);
      res.json(columns);
    } catch (error) {
      console.error("Error fetching kanban columns:", error);
      res.status(500).json({ error: "Failed to fetch kanban columns" });
    }
  });

  app.post("/api/kanban/columns", requireAuth, async (req, res) => {
    try {
      const column = await storage.createKanbanColumn(req.body);
      res.status(201).json(column);
    } catch (error) {
      console.error("Error creating kanban column:", error);
      res.status(500).json({ error: "Failed to create kanban column" });
    }
  });

  app.put("/api/kanban/columns/:id", requireAuth, async (req, res) => {
    try {
      const column = await storage.updateKanbanColumn(parseInt(req.params.id), req.body);
      if (!column) {
        return res.status(404).json({ error: "Column not found" });
      }
      res.json(column);
    } catch (error) {
      console.error("Error updating kanban column:", error);
      res.status(500).json({ error: "Failed to update kanban column" });
    }
  });

  app.delete("/api/kanban/columns/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteKanbanColumn(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Column not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting kanban column:", error);
      res.status(500).json({ error: "Failed to delete kanban column" });
    }
  });

  // Kanban Cards
  app.get("/api/kanban/columns/:columnId/cards", requireAuth, async (req, res) => {
    try {
      const cards = await storage.getKanbanCards(parseInt(req.params.columnId));
      res.json(cards);
    } catch (error) {
      console.error("Error fetching kanban cards:", error);
      res.status(500).json({ error: "Failed to fetch kanban cards" });
    }
  });

  app.post("/api/kanban/cards", requireAuth, async (req, res) => {
    try {
      const card = await storage.createKanbanCard(req.body);
      res.status(201).json(card);
    } catch (error) {
      console.error("Error creating kanban card:", error);
      res.status(500).json({ error: "Failed to create kanban card" });
    }
  });

  app.put("/api/kanban/cards/:id", requireAuth, async (req, res) => {
    try {
      const card = await storage.updateKanbanCard(parseInt(req.params.id), req.body);
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      console.error("Error updating kanban card:", error);
      res.status(500).json({ error: "Failed to update kanban card" });
    }
  });

  app.put("/api/kanban/cards/:id/move", requireAuth, async (req, res) => {
    try {
      const { columnId, position } = req.body;
      const card = await storage.moveKanbanCard(parseInt(req.params.id), columnId, position);
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      console.error("Error moving kanban card:", error);
      res.status(500).json({ error: "Failed to move kanban card" });
    }
  });

  app.delete("/api/kanban/cards/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteKanbanCard(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Card not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting kanban card:", error);
      res.status(500).json({ error: "Failed to delete kanban card" });
    }
  });

  // Kanban Tasks
  app.get("/api/kanban/cards/:cardId/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getKanbanTasks(parseInt(req.params.cardId));
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching kanban tasks:", error);
      res.status(500).json({ error: "Failed to fetch kanban tasks" });
    }
  });

  app.post("/api/kanban/tasks", requireAuth, async (req, res) => {
    try {
      const result = insertKanbanTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid task data", errors: result.error.issues });
      }
      const task = await storage.createKanbanTask(result.data);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating kanban task:", error);
      res.status(500).json({ error: "Failed to create kanban task" });
    }
  });

  app.put("/api/kanban/tasks/:id", requireAuth, async (req, res) => {
    try {
      console.log("Updating task with ID:", req.params.id);
      console.log("Request body:", req.body);
      
      const result = insertKanbanTaskSchema.partial().safeParse(req.body);
      if (!result.success) {
        console.error("Validation failed:", result.error.issues);
        return res.status(400).json({ message: "Invalid task data", errors: result.error.issues });
      }
      
      console.log("Parsed data:", result.data);
      
      const task = await storage.updateKanbanTask(parseInt(req.params.id), result.data);
      if (!task) {
        console.error("Task not found for ID:", req.params.id);
        return res.status(404).json({ error: "Task not found" });
      }
      
      console.log("Updated task:", task);
      res.json(task);
    } catch (error) {
      console.error("Error updating kanban task:", error);
      res.status(500).json({ error: "Failed to update kanban task" });
    }
  });

  app.delete("/api/kanban/tasks/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteKanbanTask(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting kanban task:", error);
      res.status(500).json({ error: "Failed to delete kanban task" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time presence tracking
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store user connections
  const userConnections = new Map<number, WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    let userId: number | null = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join' && data.userId) {
          userId = data.userId;
          userConnections.set(userId, ws);
          
          // Update user online status
          await storage.updateUser(userId, { isOnline: true, lastSeen: new Date() });
          
          // Broadcast user came online
          broadcastPresenceUpdate(userId, true);
          console.log(`User ${userId} connected via WebSocket`);
        } else if (data.type === 'heartbeat' && userId) {
          // Update last seen timestamp
          await storage.updateUser(userId, { lastSeen: new Date() });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', async () => {
      if (userId) {
        userConnections.delete(userId);
        
        // Add a small delay before marking offline to handle quick reconnections
        setTimeout(async () => {
          // Check if user has reconnected
          if (!userConnections.has(userId!)) {
            // Update user offline status
            await storage.updateUser(userId!, { isOnline: false, lastSeen: new Date() });
            
            // Broadcast user went offline
            broadcastPresenceUpdate(userId!, false);
            console.log(`User ${userId} marked as offline`);
          }
        }, 5000); // Wait 5 seconds before marking offline
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  function broadcastPresenceUpdate(userId: number, isOnline: boolean) {
    const message = JSON.stringify({
      type: 'presence_update',
      userId,
      isOnline,
      timestamp: new Date().toISOString()
    });
    
    userConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  
  // API endpoint to get all users with their online status
  app.get("/api/users/presence", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users presence:", error);
      res.status(500).json({ error: "Failed to fetch users presence" });
    }
  });
  
  return httpServer;
}