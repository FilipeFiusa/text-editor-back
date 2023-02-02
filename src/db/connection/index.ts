import knex from "knex";

const connection = knex({
    client: 'sqlite3', // or 'better-sqlite3'
    connection: {
      filename: "./src/db/dev.sqlite3"
    }
});

export default connection;