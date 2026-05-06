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

  await connection.query("DROP TABLE IF EXISTS logmovement");

  await connection.query(`
    CREATE TABLE logmovement (
      id INT AUTO_INCREMENT PRIMARY KEY,
      stock_item_id INT NOT NULL,
      stock_code VARCHAR(50) NOT NULL,
      stock_name VARCHAR(150) NOT NULL,
      movement_type ENUM('IN', 'OUT') NOT NULL,
      quantity INT NOT NULL,
      quantity_before INT NOT NULL,
      quantity_after INT NOT NULL,
      performed_by_id INT NULL,
      performed_by_name VARCHAR(100) NULL,
      performed_by_role ENUM('admin', 'user') NULL,
      note VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_logmovement_stock_item_id (stock_item_id),
      INDEX idx_logmovement_created_at (created_at)
    ) CHARACTER SET utf8 COLLATE utf8_unicode_ci
  `);

  console.log("logmovement table is ready");
  await connection.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
