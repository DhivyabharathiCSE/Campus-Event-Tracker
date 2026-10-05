const { pool } = require('../config/db');
const { getKolkataNow } = require('./eventStatus');
const { notifyUser } = require('./notify');

function formatTime12h(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// Finds events happening "tomorrow" (IST) and creates a reminder
// notification for every registered student, skipping anyone who
// already received one for that event.
async function runReminderCheck() {
  try {
    const now = getKolkataNow();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const [events] = await pool.query(
      "SELECT * FROM events WHERE event_date = ? AND status != 'cancelled'",
      [tomorrowStr]
    );

    for (const event of events) {
      const [students] = await pool.query(
        "SELECT user_id FROM registrations WHERE event_id = ? AND status = 'registered'",
        [event.id]
      );

      const title = 'Event Reminder';
      const message = `Reminder: ${event.title} is tomorrow at ${formatTime12h(event.start_time)}.`;

      for (const { user_id } of students) {
        const [already] = await pool.query(
          'SELECT id FROM notifications WHERE user_id = ? AND title = ? AND message = ?',
          [user_id, title, message]
        );
        if (already.length === 0) {
          await notifyUser(user_id, title, message);
        }
      }
    }
  } catch (err) {
    console.error('Reminder check failed:', err.message);
  }
}

module.exports = { runReminderCheck };
