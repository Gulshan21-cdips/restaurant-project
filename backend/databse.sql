-- 1. Database banana
CREATE DATABASE IF NOT EXISTS luxedining_db;
USE luxedining_db;

-- 2. Bookings Table (Reservations ke liye)
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(10) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    guests INT NOT NULL,
    date_time DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Menu Table (Jo owner add karega)
CREATE TABLE IF NOT EXISTS menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category ENUM('Starter', 'Main', 'Dessert', 'Drink') NOT NULL,
    image_path VARCHAR(255) DEFAULT NULL
);

-- 4. Orders Table (Table se ordering ke liye)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(10),
    table_num INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    order_status ENUM('Pending', 'Cooking', 'Served') DEFAULT 'Pending',
    order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- Sample Data (Taki website khali na dikhe)
INSERT INTO menu (item_name, price, category) VALUES 
('Truffle Pasta', 22.50, 'Main'),
('Garlic Bread', 8.00, 'Starter');