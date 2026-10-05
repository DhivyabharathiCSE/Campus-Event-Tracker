const { pool } = require('../config/db');
const { success, error } = require('../utils/response');
const { withComputedStatusList } = require('../utils/eventStatus');

// GET /api/students  (admin only)
async function getStudents(req, res, next) {
  try {
    const { search } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.department, u.year, u.phone, u.created_at,
        (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id AND r.status = 'registered') AS event_count
      FROM users u
      WHERE u.role = 'student'
    `;
    const params = [];
    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.department LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY u.name ASC';

    const [rows] = await pool.query(query, params);
    return success(res, 'Students fetched.', { students: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/stats  (admin only)
async function getAdminStats(req, res, next) {
  try {
    const [eventRows] = await pool.query(`
      SELECT e.*,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registration_count
      FROM events e
    `);
    const events = withComputedStatusList(eventRows);

    const totalEvents = events.length;
    const upcomingEvents = events.filter((e) => e.status === 'upcoming').length;
    const ongoingEvents = events.filter((e) => e.status === 'ongoing').length;
    const completedEvents = events.filter((e) => e.status === 'completed').length;

    const [[{ totalStudents }]] = await pool.query(
      "SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student'"
    );
    const [[{ totalRegistrations }]] = await pool.query(
      "SELECT COUNT(*) AS totalRegistrations FROM registrations WHERE status = 'registered'"
    );

    const recentEvents = [...events]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    const upcomingList = events
      .filter((e) => e.status === 'upcoming')
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, 5);

    return success(res, 'Admin statistics fetched.', {
      stats: {
        totalEvents, upcomingEvents, ongoingEvents, completedEvents,
        totalStudents, totalRegistrations,
      },
      recentEvents,
      upcomingEvents: upcomingList,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/student/stats  (student only)
async function getStudentStats(req, res, next) {
  try {
    const userId = req.user.id;

    const [regRows] = await pool.query(
      `SELECT e.*,
        (SELECT COUNT(*) FROM registrations r2 WHERE r2.event_id = e.id AND r2.status = 'registered') AS registration_count
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.user_id = ? AND r.status = 'registered'`,
      [userId]
    );
    const myEvents = withComputedStatusList(regRows);

    const todayStr = new Date().toISOString().slice(0, 10);

    const stats = {
      myRegistrations: myEvents.length,
      upcomingEvents: myEvents.filter((e) => e.status === 'upcoming').length,
      todaysEvents: myEvents.filter((e) => e.event_date === todayStr).length,
      completedEvents: myEvents.filter((e) => e.status === 'completed').length,
    };

    const upcoming = myEvents
      .filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, 5);

    const recentlyRegistered = [...myEvents]
      .sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at))
      .slice(0, 5);

    return success(res, 'Student statistics fetched.', {
      stats, upcomingEvents: upcoming, recentlyRegistered,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStudents, getAdminStats, getStudentStats };
