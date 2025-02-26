const knex = require('./knex');
const fs = require('fs');

// Lire le fichier SQL qui contient les commandes pour créer la base de données
const setupSQL = fs.readFileSync('./setup.sql', 'utf8');

// Exécuter les commandes SQL pour initialiser la base de données
knex.raw(setupSQL)
  .then(() => {
    console.log('Base de données initialisée avec succès');
  })
  .catch((err) => {
    console.error('Erreur lors de l\'initialisation de la base de données', err);
  })
  .finally(() => {
    knex.destroy();
  });


