const constants = require('./constants');

const AVATAR_CACHE_KEY = 'staffAvatarFileId';
const AVATAR_LOCAL_PREVIEW_KEY = 'staffAvatarLocalPreview';

function extractUploadedFileId(uploadRes) {
  if (!uploadRes) return '';
  if (uploadRes.id) return uploadRes.id;
  if (uploadRes.fileId) return uploadRes.fileId;
  if (uploadRes.avatarUrl) return uploadRes.avatarUrl;
  if (uploadRes.avatarFileId) return uploadRes.avatarFileId;
  if (uploadRes.data && uploadRes.data.id) return uploadRes.data.id;
  if (uploadRes.data && uploadRes.data.fileId) return uploadRes.data.fileId;
  if (uploadRes.data && uploadRes.data.avatarUrl) return uploadRes.data.avatarUrl;
  if (uploadRes.data && uploadRes.data.avatarFileId) return uploadRes.data.avatarFileId;
  if (uploadRes.file && uploadRes.file.id) return uploadRes.file.id;
  if (uploadRes.fileAsset && uploadRes.fileAsset.id) return uploadRes.fileAsset.id;
  if (uploadRes.data && uploadRes.data.file && uploadRes.data.file.id) return uploadRes.data.file.id;
  if (uploadRes.data && uploadRes.data.fileAsset && uploadRes.data.fileAsset.id) return uploadRes.data.fileAsset.id;
  return '';
}

function isAbsoluteOrTempUrl(value) {
  return (
    value.indexOf('http://') === 0 ||
    value.indexOf('https://') === 0 ||
    value.indexOf('wxfile://') === 0 ||
    value.indexOf('http://tmp/') === 0
  );
}

function normalizeAvatarUrl(value) {
  if (!value) return '';
  if (isAbsoluteOrTempUrl(value)) return value;
  const localPreview = getCachedAvatarLocalPreview(value);
  if (localPreview) return localPreview;
  return constants.API_BASE_URL + '/app/files/public/' + value + '/preview';
}

function getCachedAvatarFileId() {
  try {
    return wx.getStorageSync(AVATAR_CACHE_KEY) || '';
  } catch (e) {
    return '';
  }
}

function setCachedAvatarFileId(fileId, localPreviewPath) {
  try {
    if (fileId) {
      wx.setStorageSync(AVATAR_CACHE_KEY, fileId);
      if (localPreviewPath) {
        wx.setStorageSync(AVATAR_LOCAL_PREVIEW_KEY, {
          fileId,
          localPreviewPath
        });
      }
    } else {
      wx.removeStorageSync(AVATAR_CACHE_KEY);
      wx.removeStorageSync(AVATAR_LOCAL_PREVIEW_KEY);
    }
  } catch (e) {
    // Best-effort cache only.
  }
}

function getCachedAvatarLocalPreview(fileId) {
  try {
    const cache = wx.getStorageSync(AVATAR_LOCAL_PREVIEW_KEY);
    if (!cache || !fileId) return '';
    if (cache.fileId === fileId && cache.localPreviewPath) {
      return cache.localPreviewPath;
    }
    return '';
  } catch (e) {
    return '';
  }
}

function resolveAvatarValue(profile, account) {
  const p = profile || {};
  const a = account || {};
  return (
    p.avatarUrl ||
    p.avatarFileId ||
    a.avatarUrl ||
    a.avatarFileId ||
    a.wechatAvatar ||
    getCachedAvatarFileId()
  );
}

function getAvatarText(name, fallback) {
  return name ? name.slice(0, 1) : (fallback || '人');
}

module.exports = {
  extractUploadedFileId,
  normalizeAvatarUrl,
  getCachedAvatarFileId,
  setCachedAvatarFileId,
  resolveAvatarValue,
  getAvatarText
};
