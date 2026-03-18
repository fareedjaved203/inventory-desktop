/**
 * Standardized function to create a Date object correctly for Pakistan Standard Time (PKT, UTC+5).
 * 
 * - If no dateString is provided: returns the current UTC time (new Date()).
 * - If an ISO 8601 string is provided (e.g., from frontend): returns the Date as-is (Date is already UTC).
 * - If a YYYY-MM-DD string is provided: returns a UTC Date representing 00:00:00 PKT on that day.
 * 
 * @param {string} [dateString] - Optional date string to parse.
 * @returns {Date} - A JavaScript Date object representing the time in UTC.
 */
export function createDateWithCurrentTime(dateString) {
  if (!dateString) {
    return new Date();
  }
  
  // Handle ISO 8601 or similar formats with time component
  if (dateString.includes('T') || dateString.includes(':')) {
    return new Date(dateString);
  }
  
  // Match YYYY-MM-DD format
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    // Construct UTC Date corresponding to 00:00:00 PKT (UTC+5)
    // 00:00:00 PKT = 19:00:00 UTC (previous day)
    return new Date(Date.UTC(year, month, day, 0, 0, 0) - (5 * 60 * 60 * 1000));
  }
  
  // Fallback to standard constructor
  return new Date(dateString);
}
