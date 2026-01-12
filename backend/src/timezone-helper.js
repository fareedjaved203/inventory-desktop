// Helper function to create date in Pakistan timezone (UTC+5)
export function createDateWithCurrentTime(dateString) {
  if (!dateString) {
    return new Date();
  }
  
  // Parse YYYY-MM-DD or ISO format and treat as Pakistan local date
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) {
    return new Date();
  }
  
  // Get the date components in UTC
  const year = dateObj.getUTCFullYear();
  const month = dateObj.getUTCMonth();
  const day = dateObj.getUTCDate();
  
  // Create a date treating these components as Pakistan local time
  const pakistaniDate = new Date(year, month, day, 0, 0, 0, 0);
  // Convert to UTC: subtract Pakistan offset (5 hours) and add browser offset
  return new Date(pakistaniDate.getTime() - (5 * 60 * 60 * 1000) + (pakistaniDate.getTimezoneOffset() * 60 * 1000));
}
