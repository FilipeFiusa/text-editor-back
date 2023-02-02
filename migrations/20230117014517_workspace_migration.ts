import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('Workspaces', tbl => {
        tbl.increments('id');
        tbl.text('name').notNullable();
        tbl.text('workspaceImage').notNullable();
        tbl.text('inviteCode').notNullable();
        tbl.text('workspaceRootFolder').notNullable();
        tbl.dateTime('createdAt').notNullable();
        tbl.integer('ownerId').notNullable();
        tbl.foreign('ownerId').references("Users.id");
      })
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('Workspaces')
}

