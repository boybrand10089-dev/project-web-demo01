CREATE DATABASE IF NOT EXISTS medical_equipment_manager
  CHARACTER SET utf8
  COLLATE utf8_unicode_ci;

USE medical_equipment_manager;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  checked_date DATE NOT NULL,
  owner VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  initial_quantity INT NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 0,
  minimum_quantity INT NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  location VARCHAR(100) NOT NULL,
  updated_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logmovement (
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
);
