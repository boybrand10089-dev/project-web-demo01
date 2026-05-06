require("dotenv").config();

const path = require("path");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const port = Number(process.env.PORT || 3000);

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "medical_equipment_manager",
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

app.use(cors());
app.use(express.json());

function requireAdmin(req, res, next) {
  if (req.header("x-user-role") !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  return next();
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    department: row.department,
    role: row.role
  };
}

function equipmentRow(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    department: row.department,
    status: row.status,
    checkedDate: row.checked_date,
    owner: row.owner
  };
}

function stockRow(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    minimum: row.minimum_quantity,
    unit: row.unit,
    location: row.location,
    updatedDate: row.updated_date
  };
}

function normalizeRole(role) {
  return role === "admin" ? "admin" : "user";
}

app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
});

app.post("/api/register", async (req, res, next) => {
  try {
    const { name, department, role, password } = req.body;

    if (!name || !department || !password || password.length < 4) {
      return res.status(400).json({ message: "Invalid registration data" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (name, department, role, password_hash) VALUES (?, ?, ?, ?)",
      [name.trim(), department, normalizeRole(role), passwordHash]
    );

    res.status(201).json({
      id: result.insertId,
      name: name.trim(),
      department,
      role: normalizeRole(role)
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username already exists" });
    }

    return next(error);
  }
});

app.post("/api/login", async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const [rows] = await pool.execute("SELECT * FROM users WHERE name = ?", [name]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json(publicUser(user));
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT id, name, department, role FROM users ORDER BY id DESC");
    res.json(rows.map(publicUser));
  } catch (error) {
    next(error);
  }
});

app.post("/api/users", requireAdmin, async (req, res, next) => {
  try {
    const { name, department, role, password } = req.body;

    if (!name || !department || !password || password.length < 4) {
      return res.status(400).json({ message: "Invalid user data" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (name, department, role, password_hash) VALUES (?, ?, ?, ?)",
      [name.trim(), department, normalizeRole(role), passwordHash]
    );

    res.status(201).json({ id: result.insertId, name: name.trim(), department, role: normalizeRole(role) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username already exists" });
    }

    return next(error);
  }
});

app.put("/api/users/:id", requireAdmin, async (req, res, next) => {
  try {
    const { name, department, role, password } = req.body;
    const values = [name.trim(), department, normalizeRole(role)];
    let sql = "UPDATE users SET name = ?, department = ?, role = ?";

    if (password) {
      sql += ", password_hash = ?";
      values.push(await bcrypt.hash(password, 10));
    }

    sql += " WHERE id = ?";
    values.push(req.params.id);

    await pool.execute(sql, values);
    const [rows] = await pool.execute("SELECT id, name, department, role FROM users WHERE id = ?", [req.params.id]);
    res.json(publicUser(rows[0]));
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username already exists" });
    }

    return next(error);
  }
});

app.delete("/api/users/:id", requireAdmin, async (req, res, next) => {
  try {
    await pool.execute("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/equipment", async (_req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM equipment ORDER BY id DESC");
    res.json(rows.map(equipmentRow));
  } catch (error) {
    next(error);
  }
});

app.post("/api/equipment", async (req, res, next) => {
  try {
    const { code, name, department, status, checkedDate, owner } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO equipment (code, name, department, status, checked_date, owner) VALUES (?, ?, ?, ?, ?, ?)",
      [code, name, department, status, checkedDate, owner]
    );
    const [rows] = await pool.execute("SELECT * FROM equipment WHERE id = ?", [result.insertId]);
    res.status(201).json(equipmentRow(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.put("/api/equipment/:id", async (req, res, next) => {
  try {
    const { code, name, department, status, checkedDate, owner } = req.body;
    await pool.execute(
      "UPDATE equipment SET code = ?, name = ?, department = ?, status = ?, checked_date = ?, owner = ? WHERE id = ?",
      [code, name, department, status, checkedDate, owner, req.params.id]
    );
    const [rows] = await pool.execute("SELECT * FROM equipment WHERE id = ?", [req.params.id]);
    res.json(equipmentRow(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/equipment/:id", requireAdmin, async (req, res, next) => {
  try {
    await pool.execute("DELETE FROM equipment WHERE id = ?", [req.params.id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/stock-items", async (_req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM stock_items ORDER BY id DESC");
    res.json(rows.map(stockRow));
  } catch (error) {
    next(error);
  }
});

app.post("/api/stock-items", async (req, res, next) => {
  try {
    const { code, name, category, quantity, minimum, unit, location, updatedDate } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO stock_items (code, name, category, quantity, minimum_quantity, unit, location, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [code, name, category, quantity, minimum, unit, location, updatedDate]
    );
    const [rows] = await pool.execute("SELECT * FROM stock_items WHERE id = ?", [result.insertId]);
    res.status(201).json(stockRow(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.put("/api/stock-items/:id", async (req, res, next) => {
  try {
    const { code, name, category, quantity, minimum, unit, location, updatedDate } = req.body;
    await pool.execute(
      "UPDATE stock_items SET code = ?, name = ?, category = ?, quantity = ?, minimum_quantity = ?, unit = ?, location = ?, updated_date = ? WHERE id = ?",
      [code, name, category, quantity, minimum, unit, location, updatedDate, req.params.id]
    );
    const [rows] = await pool.execute("SELECT * FROM stock_items WHERE id = ?", [req.params.id]);
    res.json(stockRow(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/stock-items/:id/adjust", async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isInteger(amount)) {
      return res.status(400).json({ message: "Amount must be an integer" });
    }

    const [currentRows] = await pool.execute("SELECT * FROM stock_items WHERE id = ?", [req.params.id]);
    const current = currentRows[0];

    if (!current) {
      return res.status(404).json({ message: "Stock item not found" });
    }

    const nextQuantity = current.quantity + amount;

    if (nextQuantity < 0) {
      return res.status(400).json({ message: "Quantity cannot be negative" });
    }

    await pool.execute(
      "UPDATE stock_items SET quantity = ?, updated_date = CURDATE() WHERE id = ?",
      [nextQuantity, req.params.id]
    );
    const [rows] = await pool.execute("SELECT * FROM stock_items WHERE id = ?", [req.params.id]);
    res.json(stockRow(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/stock-items/:id", requireAdmin, async (req, res, next) => {
  try {
    await pool.execute("DELETE FROM stock_items WHERE id = ?", [req.params.id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get(["/index.html", "/style.css", "/script.js"], (req, res) => {
  res.sendFile(path.join(__dirname, req.path));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Server error" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
