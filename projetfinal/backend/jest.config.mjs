// jest.config.mjs
export default {
  testEnvironment: 'node',
  transform: {},
  
  // Fichier de setup à exécuter avant les tests
  setupFiles: ['<rootDir>/tests/setup.js'],
  
  // Patterns pour trouver les fichiers de test
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Ignorer les dossiers
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Extensions de modules
  moduleFileExtensions: ['js', 'json'],
  
  // Verbose pour plus de détails
  verbose: true,
  
  // Pour les imports ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};