import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Simuler __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement depuis .env.test
dotenv.config({ 
  path: path.resolve(__dirname, '../.env.test'),
  override: true // S'assurer que les variables sont surchargées
});

// Vérifier que DB_FILE est défini
if (!process.env.DB_FILE) {
  console.warn('⚠️  DB_FILE non défini dans .env.test, utilisation de la valeur par défaut');
  process.env.DB_FILE = ':memory:'; // Base de données SQLite en mémoire pour les tests
}

// Ajouter des variables par défaut si nécessaire
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.NODE_ENV = 'test';

console.log('✅ Environnement de test chargé:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_FILE: process.env.DB_FILE,
  JWT_SECRET: process.env.JWT_SECRET ? 'défini' : 'non défini'
});