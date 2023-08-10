import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('Files', tbl => {
        tbl.increments('id');
        tbl.text("path").notNullable();
        tbl.text("fileName").notNullable();
        tbl.text("content").notNullable();

        tbl.dateTime('createdAt').notNullable();
        tbl.dateTime('lastChange').notNullable();

        tbl.integer('workspaceId').notNullable();
        tbl.foreign('workspaceId').references("Workspaces.id");
      })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('Files')
}

