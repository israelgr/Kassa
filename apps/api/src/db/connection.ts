import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database path - stored in data directory at project root
const DATA_DIR = join(__dirname, '../../../../data');
const DB_PATH = process.env.DATABASE_PATH || join(DATA_DIR, 'kassa.db');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
export const db: DatabaseType = new Database(DB_PATH);

// Enable foreign keys and WAL mode for better performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initializeDatabase(): void {
  // tsx runs the source file directly, so __dirname points to the src/db directory
  // We need to find schema.sql which is in the same directory
  const possiblePaths = [
    join(__dirname, 'schema.sql'),
    join(process.cwd(), 'apps/api/src/db/schema.sql'),
    join(process.cwd(), 'src/db/schema.sql'),
  ];

  let schemaPath = '';
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      schemaPath = p;
      break;
    }
  }

  if (!schemaPath) {
    console.error('Could not find schema.sql in any of:', possiblePaths);
    return;
  }

  console.log('Loading schema from:', schemaPath);
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute the entire schema at once using db.exec which handles multiple statements
  try {
    db.exec(schema);
    console.log('Database initialized successfully');
  } catch (error) {
    // Log but don't throw for "already exists" errors
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('already exists')) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
    console.log('Database already initialized');
  }
}

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});
