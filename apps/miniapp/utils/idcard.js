/**
 * Parse birthday from Chinese resident ID card number.
 * Supports 18-digit (current) and 15-digit (legacy) formats.
 * Returns YYYY-MM-DD string, or null if parsing fails.
 */
function parseIdCardBirthday(idNumber) {
  if (!idNumber) return null;
  const trimmed = String(idNumber).trim();
  if (trimmed.length === 18) {
    const year = parseInt(trimmed.substring(6, 10), 10);
    const month = parseInt(trimmed.substring(10, 12), 10);
    const day = parseInt(trimmed.substring(12, 14), 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    if (year < 1900 || year > 2100) return null;
    return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }
  if (trimmed.length === 15) {
    const year = parseInt(trimmed.substring(6, 8), 10) + 1900;
    const month = parseInt(trimmed.substring(8, 10), 10);
    const day = parseInt(trimmed.substring(10, 12), 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }
  return null;
}

module.exports = {
  parseIdCardBirthday
};
