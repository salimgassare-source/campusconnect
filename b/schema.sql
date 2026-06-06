-- Create Database
CREATE DATABASE IF NOT EXISTS campusconnect;
USE campusconnect;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'club_admin', 'university_admin') DEFAULT 'student',
    student_id VARCHAR(20) UNIQUE,
    course VARCHAR(100),
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_email (email),
    INDEX idx_student_id (student_id)
);

-- Clubs Table
CREATE TABLE IF NOT EXISTS clubs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    admin_id INT NOT NULL,
    logo_url TEXT,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_admin (admin_id),
    INDEX idx_status (status)
);

-- Club Members
CREATE TABLE IF NOT EXISTS club_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_membership (club_id, user_id)
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    venue VARCHAR(200),
    capacity INT CHECK (capacity > 0),
    current_registrations INT DEFAULT 0,
    club_id INT NULL,
    category VARCHAR(50),
    image_url TEXT,
    status ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'draft',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_start_time (start_time),
    INDEX idx_club (club_id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    CHECK (end_time > start_time)
);

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('venue', 'equipment', 'lab', 'sports', 'other') DEFAULT 'other',
    description TEXT,
    club_id INT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,
    INDEX idx_type (type),
    INDEX idx_club (club_id),
    INDEX idx_availability (is_available)
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    resource_id INT NOT NULL,
    event_id INT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled', 'completed') DEFAULT 'pending',
    purpose TEXT,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (resource_id) REFERENCES resources(id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_resource_time (resource_id, booking_date, start_time),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_date (booking_date),
    CHECK (end_time > start_time)
);

-- Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_in_status BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP NULL,
    UNIQUE KEY unique_registration (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    INDEX idx_event (event_id),
    INDEX idx_user (user_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('email', 'system') DEFAULT 'email',
    subject VARCHAR(255),
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at)
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
);

-- Insert Default Admin User (password: Admin@2026)
INSERT INTO users (name, email, password_hash, role, student_id, course) VALUES
('System Administrator', 'admin@campusconnect.com', '$2a$10$rQvR.V7YqXqXqXqXqXqXqOeXqXqXqXqXqXqXq', 'university_admin', 'ADMIN001', 'Administration');

-- Insert Sample Clubs
INSERT INTO clubs (name, description, admin_id, status) VALUES
('Tech Club', 'Technology and innovation club for all students', 1, 'active'),
('Sports Club', 'Promoting sports and healthy living', 1, 'active'),
('Arts Society', 'Creative arts and culture', 1, 'active');

-- Insert Sample Resources
INSERT INTO resources (name, type, description, is_available) VALUES
('Main Auditorium', 'venue', '500 capacity, projector, sound system', TRUE),
('CS Lab 101', 'lab', '30 computers, projector, AC', TRUE),
('Portable Projector', 'equipment', 'HD projector, HDMI cable', TRUE),
('Football Field', 'sports', 'Standard football field', TRUE),
('Conference Room A', 'venue', '20 capacity, whiteboard, TV', TRUE);

-- Insert Sample Events
INSERT INTO events (title, description, start_time, end_time, venue, capacity, category, status, created_by) VALUES
('Tech Week 2026', 'Annual technology exhibition and workshops', '2026-06-10 09:00:00', '2026-06-10 17:00:00', 'Main Auditorium', 200, 'Conference', 'published', 1),
('Coding Workshop', 'Learn React and Node.js', '2026-06-15 14:00:00', '2026-06-15 17:00:00', 'CS Lab 101', 30, 'Workshop', 'published', 1),
('Football Tournament', 'Inter-university football competition', '2026-06-20 10:00:00', '2026-06-20 16:00:00', 'Football Field', 100, 'Sports', 'published', 1);