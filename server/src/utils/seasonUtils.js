export const getCurrentSeason = () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12 (January = 1, December = 12)

 

  if (month === 1 || month === 2) return "Winter";
  if (month === 3 || month === 4) return "Spring";
  if (month === 5 || month === 6) return "Summer";
  if (month === 7 || month === 8) return "Rainy";
  if (month === 9 || month === 10) return "Autumn";
  return "Pre-winter";
};

/**
 * Get season for a specific date (same 6-season model)
 * @param {Date} date - Date object
 * @returns {string} - One of: "Spring", "Summer", "Rainy", "Autumn", "Pre-winter", "Winter"
 */
export const getSeasonFromDate = (date) => {
  if (!(date instanceof Date)) {
    throw new Error("Invalid date provided");
  }

  const month = date.getMonth() + 1; // 1-12

  if (month === 1 || month === 2) return "Winter";
  if (month === 3 || month === 4) return "Spring";
  if (month === 5 || month === 6) return "Summer";
  if (month === 7 || month === 8) return "Rainy";
  if (month === 9 || month === 10) return "Autumn";
  return "Pre-winter";
};

/**
 * Get all available seasons
 * @returns {Array<string>} - Array of season names
 */
export const getAllSeasons = () => {
  return ["Spring", "Summer", "Rainy", "Autumn", "Pre-winter", "Winter"];
};

