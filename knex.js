const knex = require('knex');

const dbConnection = knex({
  client: 'sqlite3',
  connection: {
    filename: './dblearnify.sqlite3' // Assurez-vous que le fichier SQLite soit bien créé dans ce chemin
  },
  useNullAsDefault: true
});

module.exports = dbConnection;

