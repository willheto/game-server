import { createPool } from "mysql2/promise";
import "dotenv/config";
import { printError, printInfo } from "../../util/Logger";

const pool = createPool({
  host: "localhost",
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

const createAccountsTable = `
  CREATE TABLE IF NOT EXISTS accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    login_token VARCHAR(255),
    registration_ip VARCHAR(50),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function up() {
  try {
    const connection = await pool.getConnection();
    await connection.query(createAccountsTable);
    printInfo("Accounts table created successfully.");
    connection.release();
  } catch (error: any) {
    printError("Error creating accounts table:" + error);
  } finally {
    await pool.end();
  }
}

async function down() {
  try {
    const connection = await pool.getConnection();
    await connection.query("DROP TABLE IF EXISTS accounts;");
    printInfo("Accounts table dropped successfully.");
    connection.release();
  } catch (error: any) {
    printError("Error dropping accounts table:" + error);
  } finally {
    await pool.end();
  }
}

// Run the migration
if (process.argv[2] === "up") {
  up();
} else if (process.argv[2] === "down") {
  down();
}
