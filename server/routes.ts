import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertDocumentSchema, insertAppointmentSchema, insertTeamMemberSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { setupAuth, requireAuth } from "./auth";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Client routes
  app.get("/api/clients", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const result = insertClientSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid client data", errors: result.error.issues });
      }
      const clientData = { ...result.data, userId: req.user.id };
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertClientSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid client data", errors: result.error.issues });
      }
      const client = await storage.updateClient(id, result.data);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
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
      const userId = req.user.id;
      const documents = await storage.getDocuments(userId);
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

  // Appointment routes
  app.get("/api/appointments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Team member routes
  app.get("/api/team-members", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const teamMembers = await storage.getTeamMembers(userId);
      res.json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post("/api/team-members", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log("Creating team member for user:", userId);
      console.log("Request body:", req.body);
      
      const result = insertTeamMemberSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Validation failed:", result.error.errors);
        return res.status(400).json({ message: "Invalid team member data", errors: result.error.errors });
      }
      
      const teamMember = await storage.createTeamMember(result.data, userId);
      console.log("Team member created:", teamMember);
      res.status(201).json(teamMember);
    } catch (error) {
      console.error("Team member creation error:", error);
      res.status(500).json({ message: "Failed to create team member", error: String(error) });
    }
  });

  app.put("/api/team-members/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertTeamMemberSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid team member data", errors: result.error.errors });
      }
      
      const teamMember = await storage.updateTeamMember(id, result.data);
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(teamMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  app.delete("/api/team-members/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTeamMember(id);
      if (!success) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  // Stats route
  app.get("/api/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}