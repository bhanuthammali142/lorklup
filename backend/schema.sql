-- HostelOS MySQL Database Schema
-- Run this once to setup all tables

CREATE DATABASE IF NOT EXISTS hostel_db;
USE hostel_db;

-- ─── USERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('super_admin','admin','student') NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── HOSTELS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostels (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  address       TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  owner_id      VARCHAR(36)   NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── ROOMS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  hostel_id     VARCHAR(36)   NOT NULL,
  room_number   VARCHAR(50)   NOT NULL,
  floor         VARCHAR(50)   NOT NULL DEFAULT 'Ground Floor',
  type          ENUM('AC','Non-AC') NOT NULL DEFAULT 'Non-AC',
  capacity      INT           NOT NULL DEFAULT 3,
  monthly_fee   DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
);

-- ─── BEDS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beds (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  hostel_id     VARCHAR(36)   NOT NULL,
  room_id       VARCHAR(36)   NOT NULL,
  bed_number    VARCHAR(20)   NOT NULL,
  status        ENUM('available','occupied') NOT NULL DEFAULT 'available',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id)   REFERENCES rooms(id)   ON DELETE CASCADE
);

-- ─── STUDENTS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  hostel_id     VARCHAR(36)   NOT NULL,
  user_id       VARCHAR(36),
  room_id       VARCHAR(36),
  bed_id        VARCHAR(36),
  full_name     VARCHAR(255)  NOT NULL,
  email         VARCHAR(255),
  phone         VARCHAR(20),
  parent_phone  VARCHAR(20),
  id_number     VARCHAR(100),
  college_name  VARCHAR(255),
  branch        VARCHAR(255),
  joining_date  DATE,
  is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL,
  FOREIGN KEY (room_id)   REFERENCES rooms(id)   ON DELETE SET NULL,
  FOREIGN KEY (bed_id)    REFERENCES beds(id)    ON DELETE SET NULL
);

-- ─── FEES ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fees (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  hostel_id     VARCHAR(36)   NOT NULL,
  student_id    VARCHAR(36)   NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  paid_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_amount    DECIMAL(10,2) NOT NULL,
  month         DATE          NOT NULL,
  due_date      DATE,
  status        ENUM('pending','partial','paid','overdue') NOT NULL DEFAULT 'pending',
  paid_at       TIMESTAMP,
  receipt_id    VARCHAR(100),
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id)  REFERENCES hostels(id)  ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ─── PAYMENTS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id             VARCHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  hostel_id      VARCHAR(36)  NOT NULL,
  fee_id         VARCHAR(36)  NOT NULL,
  student_id     VARCHAR(36)  NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50)  NOT NULL DEFAULT 'cash',
  transaction_id VARCHAR(100),
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id)  REFERENCES hostels(id)  ON DELETE CASCADE,
  FOREIGN KEY (fee_id)     REFERENCES fees(id)     ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ─── COMPLAINTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  hostel_id     VARCHAR(36)   NOT NULL,
  student_id    VARCHAR(36),
  title         VARCHAR(255)  NOT NULL,
  description   TEXT,
  category      VARCHAR(100),
  status        ENUM('open','in_progress','resolved') NOT NULL DEFAULT 'open',
  priority      ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id)  REFERENCES hostels(id)  ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  hostel_id     VARCHAR(36)   NOT NULL,
  title         VARCHAR(255)  NOT NULL,
  message       TEXT          NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
);

-- ─── ATTENDANCE ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  hostel_id     VARCHAR(36)   NOT NULL,
  student_id    VARCHAR(36)   NOT NULL,
  date          DATE          NOT NULL,
  status        ENUM('present','absent','leave') NOT NULL DEFAULT 'present',
  UNIQUE KEY unique_attendance (student_id, date),
  FOREIGN KEY (hostel_id)  REFERENCES hostels(id)  ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ─── FOOD MENUS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_menus (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  hostel_id     VARCHAR(36)   NOT NULL UNIQUE,
  menu          JSON,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
);

-- ─── SUPER ADMIN SEED ───────────────────────────────────────────────────────
-- Password: Admin@2601 (bcrypt hash)
INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES
(UUID(), 'Bhanu Thammali', 'bhanuthammali2601@gmail.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');
