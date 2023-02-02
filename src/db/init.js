const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./src/db/database.sqlite');

db.serialize(() => {

    const UserTable = `CREATE TABLE IF NOT EXISTS Users (
        'id' INTEGER PRIMARY KEY AUTOINCREMENT,
        'email' TEXT NOT NULL,
        'password' TEXT NOT NULL,
        'avatar' TEXT NOT NULL,
        'login' TEXT NOT NULL,
        'username' TEXT NOT NULL
    );`

    db.run(UserTable);

    const WorkspaceTable = `CREATE TABLE IF NOT EXISTS Workspaces (
        'id' INTEGER PRIMARY KEY AUTOINCREMENT,
        'name' TEXT NOT NULL,
        'invite_code' TEXT NOT NULL,
        'workshop_root_folder' TEXT NOT NULL,
        'owner_id' TEXT NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES Users(id)
    );`

    db.run(WorkspaceTable);
});

db.close();