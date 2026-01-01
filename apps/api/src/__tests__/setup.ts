import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let testDb: ReturnType<typeof Database> | null = null;

export function getTestDb() {
  if (!testDb) {
    testDb = new Database(':memory:');
    testDb.pragma('foreign_keys = ON');

    const possiblePaths = [
      join(process.cwd(), 'apps/api/src/db/schema.sql'),
      join(process.cwd(), 'src/db/schema.sql'),
      join(__dirname, '../db/schema.sql'),
    ];

    let schemaPath = '';
    for (const p of possiblePaths) {
      if (existsSync(p)) {
        schemaPath = p;
        break;
      }
    }

    if (schemaPath) {
      const schema = readFileSync(schemaPath, 'utf-8');
      testDb.exec(schema);
    }
  }
  return testDb;
}

export function resetTestDb() {
  const db = getTestDb();
  db.exec('DELETE FROM donations');
  db.exec('DELETE FROM users');
}

export function closeTestDb() {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
}
