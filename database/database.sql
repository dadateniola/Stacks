-- Database name is "stacks"

-- Create a table for departments
CREATE TABLE IF NOT EXISTS departments (
  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `years` INT UNSIGNED NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create a table for courses
CREATE TABLE IF NOT EXISTS courses (
  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create a table for the relationship between departments and courses
CREATE TABLE IF NOT EXISTS departments_courses (
  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `department_id` INT UNSIGNED NOT NULL,
  `course_id` INT UNSIGNED NOT NULL,
  `level` INT UNSIGNED NOT NULL,
  `semester` ENUM('first', 'second') NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES departments(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES courses(`id`) ON DELETE CASCADE,
  UNIQUE KEY (`department_id`, `course_id`)
);

-- Create a table for users
CREATE TABLE IF NOT EXISTS users (
  `id` VARCHAR(20) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(20),
  `department_id` INT UNSIGNED,
  `pfp` VARCHAR(255) DEFAULT 'avatar-1.png',
  `role` ENUM('student', 'lecturer', 'admin') NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES departments(`id`) ON DELETE SET NULL
);

-- Create a table for the relationship between courses and lecturers
CREATE TABLE IF NOT EXISTS courses_lecturers (
  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `course_id` INT UNSIGNED NOT NULL,
  `lecturer_id` VARCHAR(20) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES courses(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lecturer_id`) REFERENCES users(`id`) ON DELETE CASCADE,
  UNIQUE KEY (`course_id`, `lecturer_id`)
);

-- Create table for resources
CREATE TABLE IF NOT EXISTS resources (
  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `module` INT UNSIGNED,
  `year` VARCHAR(255),
  `name` VARCHAR(255) NOT NULL,
  `course_id` INT UNSIGNED NOT NULL,
  `type` ENUM('slide', 'past question') NOT NULL,
  `file` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255),
  `uploaded_by`  VARCHAR(20) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES courses(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES users(`id`) ON DELETE CASCADE
);

-- Create a table for requests
CREATE TABLE IF NOT EXISTS requests (
  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `sender_id` VARCHAR(255) NOT NULL,
  `sender_name` VARCHAR(255),
  `receiver` VARCHAR(255) NOT NULL,
  `message` VARCHAR(255) NOT NULL,
  `extra_info` VARCHAR(255),
  `type` ENUM('friend', 'access', 'resource', 'change') NOT NULL,
  `handled_by` VARCHAR(20) DEFAULT NULL,
  `status` VARCHAR(255) DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`handled_by`) REFERENCES users(`id`) ON DELETE CASCADE
);

-- Create table for notifications
CREATE TABLE IF NOT EXISTS notifications (
  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `content_id` INT UNSIGNED NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `type` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES users(`id`) ON DELETE CASCADE
);

-- Create a table for histories
CREATE TABLE IF NOT EXISTS histories (
  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `user_id` VARCHAR(20) NOT NULL,
  `course_id` INT UNSIGNED DEFAULT NULL,
  `resource_id` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES users(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES courses(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`resource_id`) REFERENCES resources(`id`) ON DELETE CASCADE
);

-- Create a table for collections
CREATE TABLE IF NOT EXISTS collections (
  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `collection_name`  VARCHAR(255) NOT NULL,
  `description` VARCHAR(255),
  `user_id` VARCHAR(20) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES users(`id`) ON DELETE CASCADE
);

-- Create a table to for the relationship between collections and resources
CREATE TABLE IF NOT EXISTS collections_resources (
  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `resource_id` INT UNSIGNED NOT NULL,
  `collection_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   FOREIGN KEY (`resource_id`) REFERENCES resources(`id`) ON DELETE CASCADE,
   FOREIGN KEY (`collection_id`) REFERENCES collections(`id`) ON DELETE CASCADE
);


-- Insert information into departments table
INSERT IGNORE INTO departments (`id`, `name`, `years`)
VALUES
(1, 'Software Engineering', 4),
(2, 'Computer Science', 4);

-- Insert information into users table
INSERT IGNORE INTO users (`id`, `name`, `email`, `password`, `phone_number`, `role`, `pfp`)
VALUES
('20/1554' ,'dada teniola', 'dada@gmail.com', 'pass', '09052513369', 'admin', 'avatar-1.png'),
('20/0018' ,'baiyere fikayo', 'baiyere@gmail.com', 'pass', '09052513369', 'admin', 'avatar-2.png'),
('20/0725' ,'ajala oluwaferanmi', 'ajala@gmail.com', 'pass', '09052513369', 'admin', 'avatar-3.png'),
('123006' ,'emmanuel samuel', 'emma@gmail.com', 'pass', '09052513369', 'lecturer', 'avatar-4.png');

INSERT IGNORE INTO users (`id`, `name`, `email`, `password`, `phone_number`, `role`, `pfp`, `department_id`)
VALUES
('12345678' ,'adele michael', 'adele@gmail.com', 'pass', '09010113209', 'student', 'avatar-5.png', 1);

-- Insert courses into the courses table with manually specified id
INSERT IGNORE INTO courses (`id`, `code`, `name`)
VALUES 
(1, 'GEDS 420', 'Biblical Principles in Personal and Professional Life'),
(2, 'GEDS 400', 'Introduction to Entrepreneurial Skills'),
(3, 'SENG 401', 'Mobile Applications Design and Developments'),
(4, 'SENG 402', 'Human Computer Interaction and Emerging Technologies'),
(5, 'SENG 404', 'Software Project Management'),
(6, 'SENG 406', 'Formal Methods Specifications in Software Engineering'),
(7, 'SENG 407', 'Software Measurement and Metrics'),
(8, 'SENG 409', 'Network Security and Software Development'),
(9, 'SENG 411', 'Open Source Systems Development'),
(10, 'SENG 412', 'Internet Technologies and Web Applications Development'),
(11, 'SENG 490', 'Research Project'),
(12, 'COSC 423', 'Artificial Intelligence and Applications');


-- Insert course relationships with Software Engineering department
INSERT IGNORE INTO departments_courses (`department_id`, `course_id`, `level`, `semester`)
VALUES
(1, 1, 400, 'second'),  -- GEDS 420
(1, 2, 400, 'first'),   -- GEDS 400
(1, 3, 400, 'first'),   -- SENG 401
(1, 4, 400, 'second'),  -- SENG 402
(1, 5, 400, 'first'),   -- SENG 404
(1, 6, 400, 'second'),  -- SENG 406
(1, 7, 400, 'first'),   -- SENG 407
(1, 8, 400, 'first'),   -- SENG 409
(1, 9, 400, 'first'),   -- SENG 411
(1, 10, 400, 'second'), -- SENG 412
(1, 11, 400, 'second'), -- SENG 490
(1, 12, 400, 'first');  -- COSC 423

-- Insert course relationship with lecturers
INSERT IGNORE INTO courses_lecturers (`course_id`, `lecturer_id`)
VALUES
(1 , 123006),
(2 , 123006);