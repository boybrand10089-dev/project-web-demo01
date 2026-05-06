require("dotenv").config();

const mysql = require("mysql2/promise");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "medical_equipment_manager",
    charset: "utf8"
  });

  const [columns] = await connection.query("SHOW COLUMNS FROM stock_items LIKE 'initial_quantity'");

  if (columns.length === 0) {
    await connection.query("ALTER TABLE stock_items ADD initial_quantity INT NOT NULL DEFAULT 0 AFTER category");
  }

  await connection.query("UPDATE stock_items SET initial_quantity = quantity WHERE initial_quantity = 0 AND quantity > 0");

  console.log("stock_items.initial_quantity is ready");
  await connection.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
