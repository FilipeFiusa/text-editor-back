import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('Users_Workspaces', tbl => {
        tbl.increments('id');
        tbl.integer('userId').notNullable();
        tbl.foreign('userId').references("Users.id");
        tbl.dateTime('joinedAt').notNullable();
        tbl.integer('workspaceId').notNullable();
        tbl.foreign('workspaceId').references("Workspaces.id");
      })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('Workspaces')
}

