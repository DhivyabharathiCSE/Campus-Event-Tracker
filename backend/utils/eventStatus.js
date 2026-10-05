// Computes event status automatically based on the current date/time in
// Asia/Kolkata (IST, UTC+5:30, no daylight saving).
//
// Trick used: we shift "now" by the IST offset and treat both "now" and the
// stored event_date/start_time/end_time as if they were UTC. Because event
// times are entered by the admin as IST wall-clock time (no timezone info
// stored), shifting both sides the same way keeps the comparison correct
// regardless of the server's own local timezone.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getKolkataNow() {
  return new Date(Date.now() + IST_OFFSET_MS);
}

function toIstDate(dateStr, timeStr) {
  // dateStr: 'YYYY-MM-DD', timeStr: 'HH:MM:SS'
  return new Date(`${dateStr}T${timeStr}Z`);
}

/**
 * Compute the live status of an event.
 * @param {Object} event - must have event_date, start_time, end_time, status
 * @returns {'upcoming'|'ongoing'|'completed'|'cancelled'}
 */
function computeEventStatus(event) {
  if (event.status === 'cancelled') {
    return 'cancelled';
  }

  const now = getKolkataNow();
  const start = toIstDate(event.event_date, event.start_time);
  const end = toIstDate(event.event_date, event.end_time);

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  return 'completed';
}

/**
 * Attach a computed `status` field to an event object (does not mutate DB).
 */
function withComputedStatus(event) {
  return { ...event, status: computeEventStatus(event) };
}

function withComputedStatusList(events) {
  return events.map(withComputedStatus);
}

module.exports = {
  getKolkataNow,
  toIstDate,
  computeEventStatus,
  withComputedStatus,
  withComputedStatusList,
};
