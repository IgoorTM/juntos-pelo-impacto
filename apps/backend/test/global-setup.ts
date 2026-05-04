// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { config } = require('dotenv');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

module.exports = async function globalSetup() {
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

  execSync(`npx prisma db push --accept-data-loss`, {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit',
  });
};
