import { db } from './db';
import { clients, appointments, users } from '@shared/schema';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  console.log('Seeding database with sample data...');
  
  try {
    // Check if data already exists
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log('Database already contains data, skipping seed');
      return;
    }

    // Create a demo user
    const demoUser = {
      username: "demo",
      email: "demo@crmhub.com",
      password: await hashPassword("demo123"),
      firstName: "Demo",
      lastName: "User",
    };

    const [insertedUser] = await db.insert(users).values(demoUser).returning();
    console.log(`Created demo user: ${insertedUser.username}`);
    const userId = insertedUser.id;

    // Sample clients for the demo user
    const sampleClients = [
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@techcorp.com",
        company: "TechCorp Solutions",
        phone: "+1 (555) 123-4567",
        role: "CTO",
        status: "active",
        value: 75000,
        userId: userId,
      },
      {
        name: "Michael Chen",
        email: "m.chen@innovatelab.com",
        company: "InnovateLab",
        phone: "+1 (555) 987-6543",
        role: "Product Manager",
        status: "prospect",
        value: 45000,
        userId: userId,
      },
      {
        name: "Emily Rodriguez",
        email: "emily.r@digitalwave.com",
        company: "Digital Wave",
        phone: "+1 (555) 456-7890",
        role: "CEO",
        status: "active",
        value: 120000,
        userId: userId,
      },
    ];

    // Insert clients
    const insertedClients = await db.insert(clients).values(sampleClients).returning();
    console.log(`Inserted ${insertedClients.length} clients`);

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
        clientId: insertedClients[0].id,
        userId: userId,
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
        clientId: insertedClients[1].id,
        userId: userId,
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
        clientId: insertedClients[2].id,
        userId: userId,
        date: nextWeek,
        startTime: "09:00",
        endTime: "10:30",
        type: "review",
        location: "Client Office",
        status: "scheduled",
      },
    ];

    // Insert appointments
    const insertedAppointments = await db.insert(appointments).values(sampleAppointments).returning();
    console.log(`Inserted ${insertedAppointments.length} appointments`);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}