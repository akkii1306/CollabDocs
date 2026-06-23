import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash('password123', 10);

  // Users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Cooper',
      password,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Builder',
      password,
    },
  });

  // Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Alice's Workspace",
      members: {
        create: [
          { userId: user1.id, role: 'OWNER' },
          { userId: user2.id, role: 'EDITOR' },
        ],
      },
      documents: {
        create: [
          {
            title: 'Project Proposal',
            content: '<p>This is the initial project proposal.</p>',
            authorId: user1.id,
          },
          {
            title: 'Meeting Notes',
            content: '<p>Discussed the real-time sync architecture.</p>',
            authorId: user2.id,
          }
        ]
      }
    }
  });

  console.log(`Created workspace: ${workspace.name} with 2 documents.`);
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
