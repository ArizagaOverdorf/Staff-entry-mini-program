const constants = require('./constants');

/**
 * Extract the durable file ID from an upload response, which may be shaped as:
 * - uploadRes.id
 * - uploadRes.fileId
 * - uploadRes.data.id
 * - uploadRes.data.fileId
 * - uploadRes.file.id
 * - uploadRes.data.file.id
 */
function extractUploadedFileId(uploadRes) {
  if (!uploadRes) return '';
  if (uploadRes.id) return uploadRes.id;
  if (uploadRes.fileId) return uploadRes.fileId;
  if (uploadRes.data && uploadRes.data.id) return uploadRes.data.id;
  if (uploadRes.data && uploadRes.data.fileId) return uploadRes.data.fileId;
  if (uploadRes.file && uploadRes.file.id) return uploadRes.file.id;
  if (uploadRes.data && uploadRes.data.file && uploadRes.data.file.id) return uploadRes.data.file.id;
  return '';
}

/**
 * Normalize an avatar value to a displayable URL.
 * - empty/null/undefined → ''
 * - already an absolute http(s) URL → returned as-is
 * - otherwise treated as a file ID → public preview URL
 */
function normalizeAvatarUrl(value) {
  if (!value) return '';
  if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) {
    return value;
  }
  return constants.API_BASE_URL + '/app/files/public/' + value + '/preview';
}

/**
 * Return the first character of the name as avatar text fallback.
 */
function getAvatarText(name, fallback) {
  return name ? name.slice(0, 1) : (fallback || '人');
}

module.exports = { extractUploadedFileId, normalizeAvatarUrl, getAvatarText };
