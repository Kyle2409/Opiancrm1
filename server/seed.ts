import { db } from './db';
import { clients, appointments } from '@shared/schema';

export async function seedDatabase() {
  console.log('Seeding database with sample data...');
  
  try {
    // Check if data already exists
    const existingClients = await db.select().from(clients);
    if (existingClients.length > 0) {
      console.log('Database already contains data, skipping seed');
      return;
    }

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