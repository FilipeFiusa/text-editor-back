"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
async function up(knex) {
    return knex.schema.createTable('Users', tbl => {
        tbl.increments('id');
        tbl.text('email').notNullable();
        tbl.text('password').notNullable();
        tbl.text('avatar').notNullable();
        tbl.text('login').notNullable();
        tbl.text('username').notNullable();
    });
}
exports.up = up;
async function down(knex) {
    return knex.schema.dropTableIfExists('Users');
}
exports.down = down;
