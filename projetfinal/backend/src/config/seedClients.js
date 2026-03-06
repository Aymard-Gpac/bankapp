import bcrypt from "bcrypt";
import db from "./database.js";

const users = [
  // 🎓 STUDENTS
  {
    first_name: "Jean",
    last_name: "Dupont",
    address: "10 Student Ave",
    city: "Montreal",
    state: "QC",
    postal_code: "H2B2B2",
    date_of_birth: "2000-05-12",
    ssn: null,
    email: "jean.student@test.com",
    password: "Student123!",
    role: "etudiant",
  },
  {
    first_name: "Marie",
    last_name: "Tremblay",
    address: "20 Student Ave",
    city: "Quebec",
    state: "QC",
    postal_code: "G1A1A1",
    date_of_birth: "1999-09-30",
    ssn: null,
    email: "marie.student@test.com",
    password: "Student123!",
    role: "etudiant",
  },
  {
    first_name: "Alex",
    last_name: "Martin",
    address: "30 Student Ave",
    city: "Laval",
    state: "QC",
    postal_code: "H7A2B3",
    date_of_birth: "2001-03-18",
    ssn: null,
    email: "alex.student@test.com",
    password: "Student123!",
    role: "etudiant",
  },

  // 👤 CLIENTS
  {
    first_name: "Paul",
    last_name: "Gagnon",
    address: "100 Client Rd",
    city: "Montreal",
    state: "QC",
    postal_code: "H3C3C3",
    date_of_birth: "1990-07-22",
    ssn: "123-456-789",
    email: "paul.client@test.com",
    password: "Client123!",
    role: "client",
  },
  {
    first_name: "Sophie",
    last_name: "Roy",
    address: "200 Client Rd",
    city: "Longueuil",
    state: "QC",
    postal_code: "J4J4J4",
    date_of_birth: "1992-11-05",
    ssn: "987-654-321",
    email: "sophie.client@test.com",
    password: "Client123!",
    role: "client",
  },
  {
    first_name: "Nadia",
    last_name: "Benali",
    address: "300 Client Rd",
    city: "Montreal",
    state: "QC",
    postal_code: "H2X2X2",
    date_of_birth: "1988-02-14",
    ssn: "456-789-123",
    email: "nadia.client@test.com",
    password: "Client123!",
    role: "client",
  },
];

function generateAccountNumber(type, userId) {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${type.toUpperCase()}-${userId}-${Date.now()}-${rand}`;
}

async function createDefaultAccountsForClient(userId) {
  // 3 comptes par défaut
  const defaults = [
    { type: "Compte Cheque", balance: 1000, currency: "CAD" },
    { type: "Compte Epargne", balance: 500, currency: "CAD" },
    { type: "Compte Credit", balance: 700, currency: "CAD" },
  ];

  for (const a of defaults) {
    await db.run(
      `INSERT INTO accounts (user_id, account_number, type, balance, currency)
       VALUES (?, ?, ?, ?, ?)`,
      userId,
      generateAccountNumber(a.type, userId),
      a.type,
      a.balance,
      a.currency
    );
  }
}

export async function seedUsersIfNotExists() {
  for (const u of users) {
    const existing = await db.get("SELECT id, role FROM users WHERE email = ?", u.email);

    // ✅ existe déjà -> (option) s'assurer que les comptes existent si c'est un client
    if (existing) {
      if (existing.role === "client") {
        const count = await db.get(
          "SELECT COUNT(*) as c FROM accounts WHERE user_id = ?",
          existing.id
        );

        // si aucun compte, on les crée
        if (Number(count?.c || 0) === 0) {
          await db.exec("BEGIN");
          try {
            await createDefaultAccountsForClient(existing.id);
            await db.exec("COMMIT");
          } catch (e) {
            await db.exec("ROLLBACK");
            throw e;
          }
        }
      }
      continue;
    }

    const hashed = await bcrypt.hash(u.password, 10);

    await db.exec("BEGIN");
    try {
      // 1) insérer user
      const result = await db.run(
        `INSERT INTO users
        (first_name, last_name, address, city, state, postal_code, date_of_birth, ssn, email, password, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        u.first_name,
        u.last_name,
        u.address,
        u.city,
        u.state,
        u.postal_code,
        u.date_of_birth,
        u.ssn,
        u.email,
        hashed,
        u.role
      );

      const userId = result.lastID;

      // 2) si client -> créer 3 comptes liés
      if (u.role === "client") {
        await createDefaultAccountsForClient(userId);
      }

      await db.exec("COMMIT");
    } catch (e) {
      await db.exec("ROLLBACK");
      throw e;
    }
  }
}
async function seedBeneficiariesForClient(userId) {
  // Liste  de factures courantes
  const defaults = [
    { name: "Hydro Québec", account_number: `HQ-${userId}-001`, bank_name: "Hydro Bank" },
    { name: "Bell Internet", account_number: `BELL-${userId}-002`, bank_name: "Bell Bank" },
    { name: "Visa Credit Card", account_number: `VISA-${userId}-003`, bank_name: "Visa" },
  ];

  for (const b of defaults) {
    await db.run(
      `INSERT INTO beneficiaries (user_id, name, account_number, bank_name)
       VALUES (?, ?, ?, ?)`,
      userId,
      b.name,
      b.account_number,
      b.bank_name
    );
  }
}

export async function seedBeneficiariesIfNotExists() {
  const clients = await db.all(`SELECT id FROM users WHERE role='client'`);

  for (const c of clients) {
    const count = await db.get(
      `SELECT COUNT(*) as c FROM beneficiaries WHERE user_id = ?`,
      c.id
    );

    if (Number(count?.c || 0) > 0) continue;

    await db.exec("BEGIN");
    try {
      await seedBeneficiariesForClient(c.id);
      await db.exec("COMMIT");
    } catch (e) {
      await db.exec("ROLLBACK");
      throw e;
    }
  }
}