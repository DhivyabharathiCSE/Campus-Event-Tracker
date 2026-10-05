const { pool } = require('../config/db');
const { success, error } = require('../utils/response');
const { computeEventStatus, withComputedStatusList } = require('../utils/eventStatus');
const { notifyUser } = require('../utils/notify');

// POST /api/events/:id/register  (student only)
async function registerForEvent(req, res, next) {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const [eventRows] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (eventRows.length === 0) {
      return error(res, 'Event not found.', 404);
    }
    const event = eventRows[0];
    const liveStatus = computeEventStatus(event);

    if (liveStatus === 'cancelled') {
      return error(res, 'This event has been cancelled.', 400);
    }
    if (liveStatus === 'completed') {
      return error(res, 'This event has already ended.', 400);
    }
    if (new Date() > new Date(event.registration_deadline)) {
      return error(res, 'Registration deadline has passed.', 400);
    }

    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM registrations WHERE event_id = ? AND status = 'registered'",
      [eventId]
    );
    if (countRows[0].cnt >= event.capacity) {
      return error(res, 'Event is already full.', 400);
    }

    const [existingRows] = await pool.query(
      'SELECT * FROM registrations WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (existingRows.length > 0) {
      if (existingRows[0].status === 'registered') {
        return error(res, 'You are already registered for this event.', 409);
      }
      // Previously cancelled -> re-register by flipping status.
      await pool.query(
        "UPDATE registrations SET status = 'registered', registered_at = CURRENT_TIMESTAMP WHERE id = ?",
        [existingRows[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO registrations (event_id, user_id, status) VALUES (?, ?, 'registered')",
        [eventId, userId]
      );
    }

    await notifyUser(
      userId,
      'Registration Confirmed',
      `You have successfully registered for ${event.title}.`
    );

    return success(res, 'Registered for event successfully.', {}, 201);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/events/:id/register  (student only)
async function cancelRegistration(req, res, next) {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const [rows] = await pool.query(
      "SELECT * FROM registrations WHERE event_id = ? AND user_id = ? AND status = 'registered'",
      [eventId, userId]
    );
    if (rows.length === 0) {
      return error(res, 'You are not registered for this event.', 404);
    }

    await pool.query("UPDATE registrations SET status = 'cancelled' WHERE id = ?", [rows[0].id]);
    return success(res, 'Registration cancelled successfully.');
  } catch (err) {
    next(err);
  }
}

// GET /api/my-events  (student only)
async function getMyEvents(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, u.name AS organizer_name,
        (SELECT COUNT(*) FROM registrations r2 WHERE r2.event_id = e.id AND r2.status = 'registered') AS registration_count,
        r.registered_at
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       JOIN users u ON u.id = e.organizer_id
       WHERE r.user_id = ? AND r.status = 'registered'
       ORDER BY e.event_date ASC`,
      [req.user.id]
    );
    const events = withComputedStatusList(rows);
    return success(res, 'My events fetched.', { events, count: events.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/events/:id/registrations  (admin only)
async function getEventRegistrations(req, res, next) {
  try {
    const eventId = req.params.id;
    const [eventRows] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (eventRows.length === 0) {
      return error(res, 'Event not found.', 404);
    }

    const [rows] = await pool.query(
      `SELECT r.id AS registration_id, r.status, r.registered_at,
              u.id AS user_id, u.name, u.email, u.department, u.year, u.phone
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       WHERE r.event_id = ? AND r.status = 'registered'
       ORDER BY r.registered_at ASC`,
      [eventId]
    );

    return success(res, 'Event registrations fetched.', {
      event: withComputedStatusList([eventRows[0]])[0],
      registrations: rows,
      count: rows.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerForEvent, cancelRegistration, getMyEvents, getEventRegistrations };
