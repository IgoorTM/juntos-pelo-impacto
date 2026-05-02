import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@juntos.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.SEED_ADMIN_NAME || 'Admin User';

  const passwordHash = await hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, passwordHash, role: UserRole.ADMIN },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Upserted admin: ${adminEmail}`);

  await prisma.appConfig.upsert({
    where: { id: 1 },
    update: { signUpEnabled: true },
    create: { id: 1, signUpEnabled: true },
  });
  console.log('AppConfig initialized (signUpEnabled = true)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
