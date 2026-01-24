/**
 * Age Verification Utilities
 * Handles age verification status for adult content access
 */

const AGE_VERIFIED_KEY = "age-verified";

/**
 * Check if user is 18+ based on birthDate
 * @param birthDate - User's birth date string
 * @returns boolean - true if user is 18 or older
 */
export const isAdult = (birthDate: string): boolean => {
  if (!birthDate) return false;

  const birth = new Date(birthDate);
  const today = new Date();

  // Calculate age
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  // Adjust if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 18;
};

/**
 * Check if user has age verification stored in localStorage
 * @returns boolean - true if age has been verified
 */
export const isAgeVerified = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const stored = localStorage.getItem(AGE_VERIFIED_KEY);
    return stored === "true";
  } catch (error) {
    console.error("Error checking age verification:", error);
    return false;
  }
};

/**
 * Set age verification status in localStorage
 * Should only be called after verifying user is 18+
 */
export const setAgeVerified = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(AGE_VERIFIED_KEY, "true");
  } catch (error) {
    console.error("Error setting age verification:", error);
  }
};

/**
 * Clear age verification status from localStorage
 * Use on logout or when verification needs to be reset
 */
export const clearAgeVerification = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(AGE_VERIFIED_KEY);
  } catch (error) {
    console.error("Error clearing age verification:", error);
  }
};

/**
 * Check birthDate and set age verification if user is 18+
 * @param birthDate - User's birth date string
 * @returns boolean - true if age was verified (user is 18+)
 */
export const checkAndSetAgeVerification = (birthDate: string): boolean => {
  if (isAdult(birthDate)) {
    setAgeVerified();
    return true;
  }
  return false;
};
