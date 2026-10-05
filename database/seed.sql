-- Campus Event Tracker - Seed Data
-- Run AFTER schema.sql
-- Dates are generated relative to today so the demo always looks realistic.

USE campus_event_tracker;

-- ---------------------------------------------------------------
-- USERS
-- Password for admin@campus.com     -> Admin@123
-- Password for harish@campus.com    -> Student@123
-- Password for student2@campus.com  -> Student@123
-- ---------------------------------------------------------------
INSERT INTO users (name, email, password, department, year, phone, role) VALUES
('Campus Admin', 'admin@campus.com', '$2b$10$j89CcVTFRafmUb.YM7B5.essxFJPr1DiNzJ16j..NrDLiruhLCOtO', 'Administration', NULL, '9999900000', 'admin'),
('Harish Kumar', 'harish@campus.com', '$2b$10$U7cn88xc9F3uGy/.aQ/e2euvmEdNdRzcq.i2YDg/B9zD4Hgpq.KVS', 'Computer Science', '3rd Year', '9999900001', 'student'),
('Student Two', 'student2@campus.com', '$2b$10$vB.DXieFNskKVQ45fp84T.dY6CGQB1Lhodl49KFj8GV5bLHw7QOQm', 'Electronics', '2nd Year', '9999900002', 'student');

-- organizer_id = 1 (Campus Admin) for all seeded events

-- ---------------------------------------------------------------
-- EVENTS  (statuses are recalculated automatically by the backend,
-- the 'status' column here is just an initial default)
-- ---------------------------------------------------------------
INSERT INTO events
  (title, description, category, event_date, start_time, end_time, venue, organizer_id, capacity, registration_deadline, status, image_url)
VALUES
(
  'AI Workshop',
  'Hands-on workshop covering the fundamentals of machine learning and neural networks, with practical exercises in Python.',
  'Workshop',
  DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', '13:00:00',
  'Seminar Hall A', 1, 80,
  DATE_ADD(NOW(), INTERVAL 1 DAY), 'upcoming', NULL
),
(
  'Java Programming Workshop',
  'A two-hour intensive session on core Java concepts, OOP principles, and collections framework for beginners.',
  'Workshop',
  DATE_ADD(CURDATE(), INTERVAL 5 DAY), '14:00:00', '16:00:00',
  'Computer Lab 2', 1, 60,
  DATE_ADD(NOW(), INTERVAL 3 DAY), 'upcoming', NULL
),
(
  'College Hackathon',
  '24-hour hackathon where teams build innovative solutions to real-world problems. Prizes for top three teams.',
  'Hackathon',
  DATE_ADD(CURDATE(), INTERVAL 10 DAY), '09:00:00', '23:00:00',
  'Main Auditorium', 1, 150,
  DATE_ADD(NOW(), INTERVAL 7 DAY), 'upcoming', NULL
),
(
  'Cultural Fest',
  'Annual college cultural festival featuring music, dance, drama and art competitions from all departments.',
  'Cultural',
  DATE_ADD(CURDATE(), INTERVAL 15 DAY), '11:00:00', '20:00:00',
  'Open Air Theatre', 1, 500,
  DATE_ADD(NOW(), INTERVAL 12 DAY), 'upcoming', NULL
),
(
  'Sports Meet',
  'Inter-department annual sports meet including athletics, football, cricket and badminton events.',
  'Sports',
  DATE_ADD(CURDATE(), INTERVAL 20 DAY), '08:00:00', '18:00:00',
  'Sports Ground', 1, 300,
  DATE_ADD(NOW(), INTERVAL 17 DAY), 'upcoming', NULL
),
(
  'Placement Seminar',
  'Guidance session by industry professionals on resume building, interview skills, and placement preparation.',
  'Placement',
  DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00', '17:00:00',
  'Seminar Hall B', 1, 120,
  DATE_ADD(NOW(), INTERVAL 12 HOUR), 'upcoming', NULL
),
(
  'Web Development Bootcamp',
  'A completed sample event to demonstrate past-event display: intro to HTML, CSS, JavaScript and React.',
  'Workshop',
  DATE_SUB(CURDATE(), INTERVAL 5 DAY), '10:00:00', '16:00:00',
  'Computer Lab 1', 1, 50,
  DATE_SUB(NOW(), INTERVAL 6 DAY), 'completed', NULL
);

-- ---------------------------------------------------------------
-- SAMPLE REGISTRATIONS
-- ---------------------------------------------------------------
INSERT INTO registrations (event_id, user_id, status) VALUES
(1, 2, 'registered'),
(1, 3, 'registered'),
(3, 2, 'registered'),
(7, 2, 'registered');

-- ---------------------------------------------------------------
-- SAMPLE NOTIFICATIONS
-- ---------------------------------------------------------------
INSERT INTO notifications (user_id, title, message, is_read) VALUES
(2, 'Registration Confirmed', 'You have successfully registered for AI Workshop.', 0),
(2, 'Registration Confirmed', 'You have successfully registered for College Hackathon.', 0),
(3, 'Registration Confirmed', 'You have successfully registered for AI Workshop.', 1);
