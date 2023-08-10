import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('Folders', tbl => {
        tbl.increments('id');
        tbl.text("parentFolder").notNullable();
        tbl.text("fullPath").notNullable();
        tbl.text("folderName").notNullable();

        tbl.dateTime('createdAt').notNullable();

        tbl.integer('workspaceId').notNullable();
        tbl.foreign('workspaceId').references("Workspaces.id");
      })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('Folders')
}

