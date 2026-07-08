import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prismaCli = path.join(repoRoot, 'node_modules', 'prisma', 'build', 'index.js');
const schemaPath = path.join(repoRoot, 'prisma', 'schema.prisma');
const tempDirName = `wellsync-migrations-${randomUUID()}`;
const tempRoot = path.join(repoRoot, 'prisma', tempDirName);
const dbPath = path.join(tempRoot, 'replay.db');
const databaseUrl = `file:./${tempDirName}/replay.db`;

function runPrisma(args) {
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    encoding: 'utf8',
  });

  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');

  if (result.status !== 0) {
    throw new Error(`Prisma command failed: node ${path.relative(repoRoot, prismaCli)} ${args.join(' ')}`);
  }
}

async function ensureEmptySqliteFile() {
  await mkdir(tempRoot, { recursive: true });
  await writeFile(dbPath, '');
  const db = new DatabaseSync(dbPath);
  db.close();
}

async function verifySchema() {
  const db = new DatabaseSync(dbPath);
  try {
    const tables = new Set(
      db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all().map((row) => row.name)
    );
    const requiredTables = [
      'Reminder',
      'Notification',
      'FollowUpTask',
      'CareCircleInvitation',
      'CareCircleMember',
      'EmergencyProfile',
      'EmergencyContact',
      'EmergencyAccessLog',
      '_prisma_migrations',
    ];
    for (const table of requiredTables) {
      if (!tables.has(table)) throw new Error(`Missing table: ${table}`);
    }

    const columns = (table) => new Set(db.prepare(`PRAGMA table_info("${table}")`).all().map((row) => row.name));
    const reminderColumns = columns('Reminder');
    for (const column of ['lastTriggeredAt', 'nextTriggerAt']) {
      if (!reminderColumns.has(column)) throw new Error(`Missing Reminder column: ${column}`);
    }

    const notificationColumns = columns('Notification');
    for (const column of ['dedupKey', 'reminderId']) {
      if (!notificationColumns.has(column)) throw new Error(`Missing Notification column: ${column}`);
    }

    const emergencyContactColumns = columns('EmergencyContact');
    if (!emergencyContactColumns.has('notes')) throw new Error('Missing EmergencyContact.notes');
  } finally {
    db.close();
  }
}

async function main() {
  await ensureEmptySqliteFile();

  try {
    runPrisma(['migrate', 'deploy', '--schema', schemaPath]);
    runPrisma(['migrate', 'status', '--schema', schemaPath]);
    await verifySchema();
    console.log(`Migration replay verification passed for ${databaseUrl}`);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
