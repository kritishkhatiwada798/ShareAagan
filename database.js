import { Database } from "@db/sqlite";

const db = new Database("shareaagan.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL
  )
`);

db.prepare(`
  INSERT INTO users (username, email)
  VALUES (?, ?)
`).run("Kritish", "kritish@example.com");

const users = db.prepare("SELECT * FROM users").all();

console.log(users);

// console.log("User added successfully!");

db.close();