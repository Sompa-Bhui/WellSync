import { readFile, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prismaDir = path.join(repoRoot, 'prisma');
const dbName = `auth-test-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.db`;
const dbPath = path.join(prismaDir, dbName);
const databaseUrl = `file:./${dbName}`;

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl, ...extraEnv },
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 1}`);
  }
}

async function applyMigrations() {
  await mkdir(prismaDir, { recursive: true });
  const db = new DatabaseSync(dbPath);
  try {
    const migrationsDir = path.join(prismaDir, 'archive', 'sqlite-migrations');
    const migrations = [
      path.join(migrationsDir, '20260706000000_init', 'migration.sql'),
      path.join(migrationsDir, '20260707000000_care_circle_emergency', 'migration.sql'),
    ];
    for (const migrationPath of migrations) {
      const sql = await readFile(migrationPath, 'utf8');
      db.exec(sql);
    }
  } finally {
    db.close();
  }
}

async function cleanupDatabase() {
  await rm(dbPath, { force: true });
  await rm(`${dbPath}-journal`, { force: true });
  await rm(`${dbPath}-wal`, { force: true });
  await rm(`${dbPath}-shm`, { force: true });
}

async function main() {
  await cleanupDatabase();
  try {
    await applyMigrations();
    run(process.execPath, [path.join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs'), '--test', 'src/test/auth-api.test.ts', 'src/test/reminders.test.ts', 'src/lib/permissions.test.ts'], { DATABASE_URL: databaseUrl });
  } finally {
    await cleanupDatabase();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
