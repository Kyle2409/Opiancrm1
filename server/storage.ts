import { clients, documents, appointments, users, type Client, type InsertClient, type Document, type InsertDocument, type Appointment, type InsertAppointment, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client methods
  getClients(userId?: number): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Document methods
  getDocuments(userId?: number): Promise<Document[]>;
  getDocumentsByClient(clientId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Appointment methods
  getAppointments(userId?: number): Promise<Appointment[]>;
  getAppointmentsByClient(clientId: number): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Stats methods
  getStats(userId?: number): Promise<{
    totalClients: number;
    activeProjects: number;
    upcomingMeetings: number;
    revenue: number;
  }>;
}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Client methods
  async getClients(userId?: number): Promise<Client[]> {
    if (userId) {
      return await db.select().from(clients).where(eq(clients.userId, userId));
    }
    return await db.select().from(clients);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values({
        name: insertClient.name,
        email: insertClient.email,
        company: insertClient.company,
        phone: insertClient.phone ?? null,
        role: insertClient.role ?? null,
        status: insertClient.status ?? "active",
        value: insertClient.value ?? null,
        userId: insertClient.userId ?? null,
      })
      .returning();
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({
        ...updateData,
        lastContact: new Date(),
      })
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Document methods
  async getDocuments(userId?: number): Promise<Document[]> {
    if (userId) {
      return await db.select().from(documents).where(eq(documents.userId, userId));
    }
    return await db.select().from(documents);
  }

  async getDocumentsByClient(clientId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.clientId, clientId));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values({
        name: insertDocument.name,
        originalName: insertDocument.originalName,
        size: insertDocument.size,
        type: insertDocument.type,
        clientId: insertDocument.clientId ?? null,
        userId: insertDocument.userId ?? null,
      })
      .returning();
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Appointment methods
  async getAppointments(userId?: number): Promise<Appointment[]> {
    if (userId) {
      return await db.select().from(appointments).where(eq(appointments.userId, userId));
    }
    return await db.select().from(appointments);
  }

  async getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.clientId, clientId));
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values({
        title: insertAppointment.title,
        description: insertAppointment.description ?? null,
        clientId: insertAppointment.clientId ?? null,
        userId: insertAppointment.userId ?? null,
        date: insertAppointment.date,
        startTime: insertAppointment.startTime,
        endTime: insertAppointment.endTime,
        type: insertAppointment.type,
        location: insertAppointment.location ?? null,
        status: insertAppointment.status ?? "scheduled",
      })
      .returning();
    return appointment;
  }

  async updateAppointment(id: number, updateData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();
    return appointment || undefined;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Stats methods
  async getStats(userId?: number): Promise<{
    totalClients: number;
    activeProjects: number;
    upcomingMeetings: number;
    revenue: number;
  }> {
    const clientQuery = userId ? 
      db.select().from(clients).where(eq(clients.userId, userId)) :
      db.select().from(clients);
    
    const appointmentQuery = userId ?
      db.select().from(appointments).where(eq(appointments.userId, userId)) :
      db.select().from(appointments);
    
    const [clientResults, appointmentResults] = await Promise.all([
      clientQuery,
      appointmentQuery
    ]);
    
    const now = new Date();
    const upcomingMeetings = appointmentResults.filter(apt => 
      new Date(apt.date) > now && apt.status === 'scheduled'
    ).length;

    const totalRevenue = clientResults.reduce((sum, client) => sum + (client.value || 0), 0);
    const activeProjects = clientResults.filter(client => client.status === 'active').length;

    return {
      totalClients: clientResults.length,
      activeProjects,
      upcomingMeetings,
      revenue: totalRevenue,
    };
  }
}

export const storage = new DatabaseStorage();
