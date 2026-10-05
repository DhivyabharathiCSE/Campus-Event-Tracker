const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

// GET /api/notifications
async function getNotifications(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const [unreadRows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    return success(res, 'Notifications fetched.', {
      notifications: rows,
      unreadCount: unreadRows[0].cnt,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/notifications/:id/read
async function markAsRead(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return error(res, 'Notification not found.', 404);
    }
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    return success(res, 'Notification marked as read.');
  } catch (err) {
    next(err);
  }
}

// PUT /api/notifications/read-all
async function markAllAsRead(req, res, next) {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id]);
    return success(res, 'All notifications marked as read.');
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
