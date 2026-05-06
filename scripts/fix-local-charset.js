require("dotenv").config();

const mysql = require("mysql2/promise");

async function main() {
  const database = process.env.DB_NAME || "medical_equipment_manager";
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database,
    charset: "utf8",
    multipleStatements: true
  });

  await connection.query(`ALTER DATABASE \`${database}\` CHARACTER SET utf8 COLLATE utf8_unicode_ci`);

  await connection.query(`
    ALTER TABLE users
      MODIFY name VARBINARY(400) NOT NULL,
      MODIFY department VARBINARY(400) NOT NULL,
      MODIFY password_hash VARBINARY(255) NOT NULL
  `);
  await connection.query(`
    ALTER TABLE users
      MODIFY name VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      MODIFY department VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      MODIFY role ENUM('admin','user') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'user',
      MODIFY password_hash VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
  `);

  await connection.query(`
    ALTER TABLE equipment
      MODIFY code VARBINARY(200) NOT NULL,
      MODIFY name VARBINARY(600) NOT NULL,
      MODIFY department VARBINARY(400) NOT NULL,
      MODIFY status VARBINARY(200) NOT NULL,
      MODIFY owner VARBINARY(400) NOT NULL
  `);
  await connection.query(`
    ALTER TABLE equipment
      MODIFY code VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      MODIFY name VARCHAR(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      MODIFY department VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      MODIFY status VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      MODIFY owner VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
  `);

  await connection.query(`
    ALTER TABLE stock_items
      MODIFY code VARBINARY(200) NOT NULL,
      MODIFY name VARBINARY(600) NOT NULL,
      MODIFY category VARBINARY(400) NOT NULL,
      MODIFY unit VARBINARY(200) NOT NULL,
      MODIFY location VARBINARY(400) NOT NULL
  `);
  await connection.query(`
    ALTER TABLE stock_items
      MODIFY code VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      MODIFY name VARCHAR(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      MODIFY category VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      MODIFY unit VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      MODIFY location VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
  `);

  const [users] = await connection.query("SELECT id, name, department, role FROM users ORDER BY id");
  console.log(JSON.stringify(users, null, 2));
  await connection.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
