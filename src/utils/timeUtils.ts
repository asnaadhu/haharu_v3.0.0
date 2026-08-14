export interface CalculatedCheckInTimes {
  checkInTime: string;
  checkInClose: string;
}

/**
 * Automatically calculates Check-in Close (-1 hour) and Check-in Time (-2 hours)
 * based on the provided Departure Time string.
 */
export function calculateCheckInTimes(depTimeStr: string): CalculatedCheckInTimes | null {
  if (!depTimeStr || !depTimeStr.trim()) return null;

  const raw = depTimeStr.trim();
  // Match HH:MM or HH:MM:SS with optional AM/PM/HRS
  const regex = /^(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?\s*(AM|PM|HRS|HOURS)?/i;
  const match = raw.match(regex);

  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3] ? match[3].toUpperCase() : '';

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  let is12HourFormat = false;
  if (modifier === 'AM' || modifier === 'PM') {
    is12HourFormat = true;
    if (modifier === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  // Calculate -1 hour for Check-in Close
  const closeHours = (hours - 1 + 24) % 24;
  // Calculate -2 hours for Check-in Time
  const timeHours = (hours - 2 + 24) % 24;

  const formatResult = (h: number, m: number, use12Hr: boolean) => {
    const minsStr = m.toString().padStart(2, '0');
    if (use12Hr) {
      const p = h >= 12 ? 'PM' : 'AM';
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      const hStr = h12.toString().padStart(2, '0');
      return `${hStr}:${minsStr} ${p}`;
    } else {
      const hStr = h.toString().padStart(2, '0');
      const suffix = modifier === 'HRS' || modifier === 'HOURS' ? ' Hrs' : '';
      return `${hStr}:${minsStr}${suffix}`;
    }
  };

  return {
    checkInClose: formatResult(closeHours, minutes, is12HourFormat),
    checkInTime: formatResult(timeHours, minutes, is12HourFormat),
  };
}
