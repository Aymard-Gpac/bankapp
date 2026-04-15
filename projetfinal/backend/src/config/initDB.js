import { existsSync } from "node:fs";
import { seedBeneficiariesIfNotExists, seedUsersIfNotExists } from "./seedClients.js";
import db, { dbPath } from "./database.js";

// ✅ Nouveau fichier ?
const IS_NEW = !existsSync(dbPath);

// Fonction utilitaire pour ajouter une colonne si elle n'existe pas (utile pour les évolutions futures)
async function ensureColumnExists(tableName, columnName, columnDefinition) {
  const columns = await db.all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    await db.exec(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`
    );
  }
}


export async function initDB() {
  // Toujours activer les FK
  await db.exec(`PRAGMA foreign_keys = ON;`);

  // Toujours s'assurer que les tables existent (même si DB existe déjà)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      ssn TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      account_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'CAD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     
      status TEXT DEFAULT 'active',
      closed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_account_id INTEGER NOT NULL,
      to_account_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_account_id) REFERENCES accounts(id),
      FOREIGN KEY (to_account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS beneficiaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      bank_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS scheduled_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      kind TEXT NOT NULL, -- internal | interac | bill
      from_account_id INTEGER NOT NULL,
      to_account_id INTEGER,
      beneficiary_id INTEGER,
      recipient_email TEXT,
      recipient_first_name TEXT,
      recipient_last_name TEXT,
      is_external_recipient INTEGER DEFAULT 0,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL, -- weekly | monthly
      next_run_date DATETIME NOT NULL,
      last_run_at DATETIME,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- active | cancelled
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (from_account_id) REFERENCES accounts(id),
      FOREIGN KEY (to_account_id) REFERENCES accounts(id),
      FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id)
    );

    CREATE INDEX IF NOT EXISTS idx_scheduled_transactions_user_id
      ON scheduled_transactions(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_scheduled_transactions_status_next_run
      ON scheduled_transactions(status, next_run_date);
    
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      card_number TEXT UNIQUE NOT NULL,
      expiry_date TEXT NOT NULL,
      cvv TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );
  `);

/**
 * Sécurise les anciennes bases déjà créées avant cette fonctionnalité :
 * on ajoute les colonnes manquantes si elles n'existent pas encore.
 */
  await ensureColumnExists("accounts", "status", "TEXT DEFAULT 'active'");
  await ensureColumnExists("accounts", "closed_at", "DATETIME");

  if (IS_NEW) {
    console.log("✅ DB initialized:", dbPath);
  } else {
    console.log("✅ DB ready:", dbPath);
  }

  await seedUsersIfNotExists();
  console.log("🌱 Users seed done");
  await seedBeneficiariesIfNotExists();
  console.log("🌱 Beneficiaries seed done")
}

export default db;
