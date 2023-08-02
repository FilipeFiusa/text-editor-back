"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
async function up(knex) {
    return knex.schema.createTable('Users_Workspaces', tbl => {
        tbl.increments('id');
        tbl.integer('userId').notNullable();
        tbl.foreign('userId').references("Users.id");
        tbl.dateTime('joinedAt').notNullable();
        tbl.integer('workspaceId').notNullable();
        tbl.foreign('workspaceId').references("Workspaces.id");
    });
}
exports.up = up;
async function down(knex) {
    return knex.schema.dropTableIfExists('Workspaces');
}
exports.down = down;
