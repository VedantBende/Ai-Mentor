/**
 * Centralized logic for profile completion checks and name formatting.
 */

/**
 * Ensures that a user's isProfileComplete flag is synchronized with their data.
 * Criteria: firstName, lastName, bio, avatar_url, and password (for Google-linked accounts)
 * @param {Object} user - The user model instance
 */
export const ensureProfileCompleteness = async (user) => {
  const isComplete = Boolean(
    user.firstName?.trim() &&
    user.lastName?.trim() &&
    user.bio?.trim() &&
    user.avatar_url?.trim() &&
    (user.googleId ? user.password?.trim() : true)
  );

  if (user.isProfileComplete !== isComplete) {
    user.isProfileComplete = isComplete;
    await user.save();
  }
  
  return isComplete;
};

/**
 * Standardizes user name generation from firstName and lastName.
 * @param {string} firstName 
 * @param {string} lastName 
 * @returns {string} - The trimmed full name
 */
export const formatFullName = (firstName, lastName) => {
  return `${firstName || ""} ${lastName || ""}`.trim();
};

/**
 * Records a login event for the user, maintaining up to 90 days of history for analytics.
 * Checks if the last login was on the same calendar day before adding to avoid duplicates.
 * @param {Object} user - The user model instance
 */
export const recordLogin = async (user) => {
  try {
    let history = user.loginHistory || [];
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Check if latest entry is already today
    if (history.length > 0) {
      const lastEntryDate = new Date(history[history.length - 1].date).toISOString().split("T")[0];
      if (lastEntryDate === todayStr) {
        return; // Already recorded today
      }
    }

    history.push({ date: new Date().toISOString() });
    
    // Purge entries older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    history = history.filter(entry => new Date(entry.date) >= ninetyDaysAgo);
    
    user.loginHistory = history;
    user.changed("loginHistory", true);
    await user.save();
  } catch (error) {
    console.error(`Failed to record login for user ${user.id}:`, error);
  }
};
