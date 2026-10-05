const { pool } = require('../config/db');

// Create a single notification for one user.
async function notifyUser(userId, title, message) {
  await pool.query(
    'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
    [userId, title, message]
  );
}

// Create the same notification for a list of user ids.
async function notifyUsers(userIds, title, message) {
  if (!userIds || userIds.length === 0) return;
  const values = userIds.map((id) => [id, title, message]);
  await pool.query(
    'INSERT INTO notifications (user_id, title, message) VALUES ?',
    [values]
  );
}

// Get all user ids currently registered (status = 'registered') for an event.
async function getRegisteredUserIds(eventId) {
  const [rows] = await pool.query(
    "SELECT user_id FROM registrations WHERE event_id = ? AND status = 'registered'",
    [eventId]
  );
  return rows.map((r) => r.user_id);
}

module.exports = { notifyUser, notifyUsers, getRegisteredUserIds };
