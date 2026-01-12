// Helper function to create date in Pakistan timezone (UTC+5)
export function createDateWithCurrentTime(dateString) {
  if (!dateString) {
    return new Date();
  }
  
  // Parse YYYY-MM-DD and treat as Pakistan local date
  const [year, month, day] = dateString.split('-');
  const pakistaniDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
  // Convert to UTC: subtract Pakistan offset (5 hours) and add browser offset
  return new Date(pakistaniDate.getTime() - (5 * 60 * 60 * 1000) + (pakistaniDate.getTimezoneOffset() * 60 * 1000));
}
