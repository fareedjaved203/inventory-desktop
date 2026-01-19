// Helper function to create date in Pakistan timezone (UTC+5)
export function createDateWithCurrentTime(dateString) {
  if (!dateString) {
    return new Date();
  }
  
  // Parse YYYY-MM-DD format
  const parts = dateString.split('T')[0].split('-');
  if (parts.length !== 3) {
    return new Date();
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  // Create date in Pakistan timezone (UTC+5)
  // Treat input as Pakistan local time and convert to UTC
  const pakistaniDate = new Date(year, month, day, 0, 0, 0, 0);
  const utcDate = new Date(pakistaniDate.getTime() - (pakistaniDate.getTimezoneOffset() * 60 * 1000) - (5 * 60 * 60 * 1000));
  return utcDate;
}
