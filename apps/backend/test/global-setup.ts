import { execSync } from 'child_process';
import { config } from 'dotenv';
import path from 'path';

export default async function globalSetup() {
  config({ path: path.resolve(__dirname, '../.env.test') });

  const dbUrl = process.env.DATABASE_URL as string;
  const adminUrl = dbUrl.replace('/juntos_test', '/postgres');

  try {
    execSync(`psql "${adminUrl}" -c "CREATE DATABASE juntos_test"`, {
      stdio: 'pipe',
    });
  } catch {
    // database already exists — safe to continue
  }

  execSync('npx prisma db push --accept-data-loss', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit',
  });
}
