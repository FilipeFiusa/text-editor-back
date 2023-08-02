"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
async function up(knex) {
    return knex.schema.createTable('Workspaces', tbl => {
        tbl.increments('id');
        tbl.text('name').notNullable();
        tbl.text('workspaceImage').notNullable();
        tbl.text('inviteCode').notNullable();
        tbl.text('workspaceRootFolder').notNullable();
        tbl.dateTime('createdAt').notNullable();
        tbl.integer('ownerId').notNullable();
        tbl.foreign('ownerId').references("Users.id");
    });
}
exports.up = up;
async function down(knex) {
    return knex.schema.dropTableIfExists('Workspaces');
}
exports.down = down;
