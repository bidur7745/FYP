/**
 * Season detection utility for Nepal
 * Based on Nepali calendar and climate patterns
 */

/**
 * Get current season based on current date
 * @returns {string} - One of: "Winter", "Spring", "Monsoon", "Autumn"
 */
export const getCurrentSeason = () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12 (January = 1, December = 12)
  
  // Winter: December, January, February (Magh, Falgun)
  if (month === 12 || month === 1 || month === 2) {
    return "Winter";
  }
  
  // Spring: March, April, May (Chaitra, Baisakh, Jestha)
  if (month >= 3 && month <= 5) {
    return "Spring";
  }
  
  // Monsoon: June, July, August, September (Asar, Shrawan, Bhadra, Aswin)
  if (month >= 6 && month <= 9) {
    return "Monsoon";
  }
  
  // Autumn: October, November (Kartik, Mangsir)
  return "Autumn";
};

/**
 * Get season for a specific date
 * @param {Date} date - Date object
 * @returns {string} - One of: "Winter", "Spring", "Monsoon", "Autumn"
 */
export const getSeasonFromDate = (date) => {
  if (!(date instanceof Date)) {
    throw new Error("Invalid date provided");
  }
  
  const month = date.getMonth() + 1; // 1-12
  
  if (month === 12 || month === 1 || month === 2) {
    return "Winter";
  }
  
  if (month >= 3 && month <= 5) {
    return "Spring";
  }
  
  if (month >= 6 && month <= 9) {
    return "Monsoon";
  }
  
  return "Autumn";
};

/**
 * Get all available seasons
 * @returns {Array<string>} - Array of season names
 */
export const getAllSeasons = () => {
  return ["Winter", "Spring", "Monsoon", "Autumn"];
};

