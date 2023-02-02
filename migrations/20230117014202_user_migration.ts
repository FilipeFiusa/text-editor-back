import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('Users', tbl => {
        tbl.increments('id');
        tbl.text('email').notNullable();
        tbl.text('password').notNullable();
        tbl.text('avatar').notNullable();
        tbl.text('login').notNullable();
        tbl.text('username').notNullable();
      })
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('Users')
}

