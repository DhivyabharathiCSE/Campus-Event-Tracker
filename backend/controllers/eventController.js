const { pool } = require('../config/db');
const { success, error } = require('../utils/response');
const { withComputedStatus, withComputedStatusList, computeEventStatus } = require('../utils/eventStatus');
const { notifyUsers, getRegisteredUserIds } = require('../utils/notify');

const VALID_CATEGORIES = [
  'Technical', 'Workshop', 'Seminar', 'Cultural',
  'Sports', 'Hackathon', 'Placement', 'Club Activity', 'Other',
];

const EVENT_SELECT = `
  SELECT
    e.*,
    u.name AS organizer_name,
    (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registration_count
  FROM events e
  JOIN users u ON u.id = e.organizer_id
`;

function validateEventInput(body, isUpdate = false) {
  const {
    title, description, category, event_date, start_time,
    end_time, venue, capacity, registration_deadline,
  } = body;

  if (!title || !title.trim()) return 'Event title is required.';
  if (!category || !VALID_CATEGORIES.includes(category)) return 'A valid category is required.';
  if (!event_date) return 'Event date is required.';
  if (!start_time) return 'Start time is required.';
  if (!end_time) return 'End time is required.';
  if (!venue || !venue.trim()) return 'Venue is required.';
  if (!capacity || Number(capacity) <= 0) return 'Capacity must be a positive number.';
  if (!registration_deadline) return 'Registration deadline is required.';

  if (start_time >= end_time) return 'Start time must be before end time.';

  const deadline = new Date(registration_deadline);
  const eventStart = new Date(`${event_date}T${start_time}`);
  if (isNaN(deadline.getTime())) return 'Registration deadline is invalid.';
  if (deadline > eventStart) return 'Registration deadline must be before the event start time.';

  return null;
}

// Returns the conflicting event row, or null if no conflict.
async function findVenueConflict({ venue, event_date, start_time, end_time, excludeId }) {
  let query = `
    SELECT * FROM events
    WHERE venue = ? AND event_date = ? AND status != 'cancelled'
      AND start_time < ? AND end_time > ?
  `;
  const params = [venue, event_date, end_time, start_time];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const [rows] = await pool.query(query, params);
  return rows.length > 0 ? rows[0] : null;
}

// GET /api/events
async function getEvents(req, res, next) {
  try {
    const { search, category, date, status, venue } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(e.title LIKE ? OR e.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      conditions.push('e.category = ?');
      params.push(category);
    }
    if (date) {
      conditions.push('e.event_date = ?');
      params.push(date);
    }
    if (venue) {
      conditions.push('e.venue LIKE ?');
      params.push(`%${venue}%`);
    }

    let query = EVENT_SELECT;
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY e.event_date ASC, e.start_time ASC';

    const [rows] = await pool.query(query, params);
    let events = withComputedStatusList(rows);

    // status filter is applied after computing live status since the DB
    // column can be stale (we never rely on admin manually updating it).
    if (status) {
      events = events.filter((e) => e.status === status.toLowerCase());
    }

    return success(res, 'Events fetched.', { events, count: events.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/events/:id
async function getEventById(req, res, next) {
  try {
    const [rows] = await pool.query(`${EVENT_SELECT} WHERE e.id = ?`, [req.params.id]);
    if (rows.length === 0) {
      return error(res, 'Event not found.', 404);
    }
    const event = withComputedStatus(rows[0]);
    return success(res, 'Event fetched.', { event });
  } catch (err) {
    next(err);
  }
}

// POST /api/events  (admin only)
async function createEvent(req, res, next) {
  try {
    const validationError = validateEventInput(req.body);
    if (validationError) return error(res, validationError, 400);

    const {
      title, description, category, event_date, start_time,
      end_time, venue, capacity, registration_deadline, image_url,
    } = req.body;

    const conflict = await findVenueConflict({ venue, event_date, start_time, end_time });
    if (conflict) {
      return error(
        res,
        `Venue conflict: ${venue} is already booked during this time.`,
        409
      );
    }

    const [result] = await pool.query(
      `INSERT INTO events
        (title, description, category, event_date, start_time, end_time, venue, organizer_id, capacity, registration_deadline, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(), description || null, category, event_date, start_time, end_time,
        venue.trim(), req.user.id, Number(capacity), registration_deadline, image_url || null,
      ]
    );

    const [rows] = await pool.query(`${EVENT_SELECT} WHERE e.id = ?`, [result.insertId]);
    return success(res, 'Event created successfully.', { event: withComputedStatus(rows[0]) }, 201);
  } catch (err) {
    next(err);
  }
}

// PUT /api/events/:id  (admin only)
async function updateEvent(req, res, next) {
  try {
    const eventId = req.params.id;
    const [existingRows] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (existingRows.length === 0) {
      return error(res, 'Event not found.', 404);
    }
    const existing = existingRows[0];

    // Allow a lightweight "cancel" call: { status: 'cancelled' } with no other fields.
    if (req.body.status === 'cancelled' && Object.keys(req.body).length === 1) {
      await pool.query('UPDATE events SET status = ? WHERE id = ?', ['cancelled', eventId]);
      const userIds = await getRegisteredUserIds(eventId);
      await notifyUsers(
        userIds,
        'Event Cancelled',
        `${existing.title} scheduled on ${existing.event_date} has been cancelled.`
      );
      const [rows] = await pool.query(`${EVENT_SELECT} WHERE e.id = ?`, [eventId]);
      return success(res, 'Event cancelled successfully.', { event: withComputedStatus(rows[0]) });
    }

    const validationError = validateEventInput(req.body, true);
    if (validationError) return error(res, validationError, 400);

    const {
      title, description, category, event_date, start_time,
      end_time, venue, capacity, registration_deadline, image_url,
    } = req.body;

    const conflict = await findVenueConflict({
      venue, event_date, start_time, end_time, excludeId: eventId,
    });
    if (conflict) {
      return error(
        res,
        `Venue conflict: ${venue} is already booked during this time.`,
        409
      );
    }

    await pool.query(
      `UPDATE events SET
        title = ?, description = ?, category = ?, event_date = ?, start_time = ?,
        end_time = ?, venue = ?, capacity = ?, registration_deadline = ?, image_url = ?
       WHERE id = ?`,
      [
        title.trim(), description || null, category, event_date, start_time, end_time,
        venue.trim(), Number(capacity), registration_deadline, image_url || null, eventId,
      ]
    );

    // Notify registered students of meaningful changes.
    const venueChanged = existing.venue !== venue.trim();
    const timeChanged = existing.event_date !== event_date
      || existing.start_time !== start_time || existing.end_time !== end_time;

    if (venueChanged || timeChanged) {
      const userIds = await getRegisteredUserIds(eventId);
      const message = venueChanged
        ? `${title} has moved to a new venue: ${venue}.`
        : `${title} has an updated schedule: ${event_date} ${start_time}-${end_time}.`;
      await notifyUsers(userIds, venueChanged ? 'Venue Change' : 'Event Update', message);
    }

    const [rows] = await pool.query(`${EVENT_SELECT} WHERE e.id = ?`, [eventId]);
    return success(res, 'Event updated successfully.', { event: withComputedStatus(rows[0]) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/events/:id  (admin only)
async function deleteEvent(req, res, next) {
  try {
    const [existingRows] = await pool.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (existingRows.length === 0) {
      return error(res, 'Event not found.', 404);
    }
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    return success(res, 'Event deleted successfully.');
  } catch (err) {
    next(err);
  }
}

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent, computeEventStatus };
