import { clients, documents, appointments, type Client, type InsertClient, type Document, type InsertDocument, type Appointment, type InsertAppointment } from "@shared/schema";

export interface IStorage {
  // Client methods
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Document methods
  getDocuments(): Promise<Document[]>;
  getDocumentsByClient(clientId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Appointment methods
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByClient(clientId: number): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Stats methods
  getStats(): Promise<{
    totalClients: number;
    activeProjects: number;
    upcomingMeetings: number;
    revenue: number;
  }>;
}

export class MemStorage implements IStorage {
  private clients: Map<number, Client>;
  private documents: Map<number, Document>;
  private appointments: Map<number, Appointment>;
  private currentClientId: number;
  private currentDocumentId: number;
  private currentAppointmentId: number;

  constructor() {
    this.clients = new Map();
    this.documents = new Map();
    this.appointments = new Map();
    this.currentClientId = 4; // Start after sample data
    this.currentDocumentId = 1;
    this.currentAppointmentId = 4; // Start after sample data
    
    // Add sample data for demo purposes
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample clients
    const sampleClients = [
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@techcorp.com",
        company: "TechCorp Solutions",
        phone: "+1 (555) 123-4567",
        role: "CTO",
        status: "active",
        value: 75000,
      },
      {
        name: "Michael Chen",
        email: "m.chen@innovatelab.com",
        company: "InnovateLab",
        phone: "+1 (555) 987-6543",
        role: "Product Manager",
        status: "prospect",
        value: 45000,
      },
      {
        name: "Emily Rodriguez",
        email: "emily.r@digitalwave.com",
        company: "Digital Wave",
        phone: "+1 (555) 456-7890",
        role: "CEO",
        status: "active",
        value: 120000,
      },
    ];

    sampleClients.forEach((clientData, index) => {
      const id = index + 1;
      const client = {
        id,
        name: clientData.name,
        email: clientData.email,
        company: clientData.company,
        phone: clientData.phone,
        role: clientData.role,
        status: clientData.status,
        value: clientData.value,
        lastContact: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      };
      this.clients.set(id, client);
    });

    // Sample appointments
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const sampleAppointments = [
      {
        title: "Product Demo Meeting",
        description: "Showcase our latest features and discuss integration options",
        clientId: 1,
        date: tomorrow,
        startTime: "10:00",
        endTime: "11:00",
        type: "meeting",
        location: "Conference Room A",
        status: "scheduled",
      },
      {
        title: "Weekly Check-in Call",
        description: "Regular project update and planning session",
        clientId: 2,
        date: today,
        startTime: "14:30",
        endTime: "15:00",
        type: "call",
        location: "",
        status: "scheduled",
      },
      {
        title: "Contract Review",
        description: "Review and finalize the service agreement",
        clientId: 3,
        date: nextWeek,
        startTime: "09:00",
        endTime: "10:30",
        type: "review",
        location: "Client Office",
        status: "scheduled",
      },
    ];

    sampleAppointments.forEach(aptData => {
      const id = this.currentAppointmentId++;
      const appointment = {
        id,
        title: aptData.title,
        description: aptData.description,
        clientId: aptData.clientId,
        date: aptData.date,
        startTime: aptData.startTime,
        endTime: aptData.endTime,
        type: aptData.type,
        location: aptData.location || null,
        status: aptData.status,
        createdAt: new Date(),
      };
      this.appointments.set(id, appointment);
    });
  }

  // Client methods
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = {
      id,
      name: insertClient.name,
      email: insertClient.email,
      company: insertClient.company,
      phone: insertClient.phone ?? null,
      role: insertClient.role ?? null,
      status: insertClient.status ?? "active",
      value: insertClient.value ?? null,
      lastContact: new Date(),
      createdAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;

    const updatedClient: Client = {
      ...client,
      ...updateData,
      lastContact: new Date(),
    };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Document methods
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentsByClient(clientId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.clientId === clientId);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = {
      id,
      name: insertDocument.name,
      originalName: insertDocument.originalName,
      size: insertDocument.size,
      type: insertDocument.type,
      clientId: insertDocument.clientId ?? null,
      uploadedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Appointment methods
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => apt.clientId === clientId);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const appointment: Appointment = {
      id,
      title: insertAppointment.title,
      description: insertAppointment.description ?? null,
      clientId: insertAppointment.clientId ?? null,
      date: insertAppointment.date,
      startTime: insertAppointment.startTime,
      endTime: insertAppointment.endTime,
      type: insertAppointment.type,
      location: insertAppointment.location ?? null,
      status: insertAppointment.status ?? "scheduled",
      createdAt: new Date(),
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, updateData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;

    const updatedAppointment: Appointment = {
      ...appointment,
      ...updateData,
    };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Stats methods
  async getStats(): Promise<{
    totalClients: number;
    activeProjects: number;
    upcomingMeetings: number;
    revenue: number;
  }> {
    const clients = Array.from(this.clients.values());
    const appointments = Array.from(this.appointments.values());
    
    const now = new Date();
    const upcomingMeetings = appointments.filter(apt => 
      new Date(apt.date) > now && apt.status === 'scheduled'
    ).length;

    const totalRevenue = clients.reduce((sum, client) => sum + (client.value || 0), 0);
    const activeProjects = clients.filter(client => client.status === 'active').length;

    return {
      totalClients: clients.length,
      activeProjects,
      upcomingMeetings,
      revenue: totalRevenue,
    };
  }
}

export const storage = new MemStorage();
