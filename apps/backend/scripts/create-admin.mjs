/**
 * Creates an ADMIN or COORDINATOR account directly via Prisma.
 * Requires direct access to the server — not exposed over HTTP.
 *
 * Usage:
 *   npm run create-admin -- --name="Ada Lovelace" --email=ada@juntos.com --password=secret123 --role=ADMIN
 *
 * Inside Docker:
 *   docker exec <backend-container> npm run create-admin -- --email=... --password=... --name=... --role=COORDINATOR
 */

import { parseArgs } from 'node:util';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const VALID_ROLES = ['ADMIN', 'COORDINATOR'];

const { values } = parseArgs({
  args: process.argv.slice(2).map((a) => a.trim()),
  options: {
    name: { type: 'string' },
    email: { type: 'string' },
    password: { type: 'string' },
    role: { type: 'string' },
  },
});

const missing = ['name', 'email', 'password', 'role'].filter((k) => !values[k]);
if (missing.length > 0) {
  console.error(`Missing required args: ${missing.map((k) => `--${k}`).join(', ')}`);
  process.exit(1);
}

const role = values.role.toUpperCase();
if (!VALID_ROLES.includes(role)) {
  console.error(`--role must be one of: ${VALID_ROLES.join(', ')} (got "${values.role}")`);
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const existing = await prisma.user.findUnique({ where: { email: values.email } });
  if (existing) {
    console.error(`Email already registered: ${values.email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(values.password, 10);

  const user = await prisma.user.create({
    data: { name: values.name, email: values.email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  console.log('Account created:');
  console.log(JSON.stringify(user, null, 2));
} finally {
  await prisma.$disconnect();
}
