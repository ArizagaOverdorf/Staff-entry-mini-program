export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024,
  IMAGE_MAX_SIZE: 2 * 1024 * 1024,
  VIDEO_MAX_SIZE: 5 * 1024 * 1024,
  ALLOWED_MIMES: [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ALLOWED_IMAGE_MIMES: ['image/png', 'image/jpeg', 'image/jpg'],
  ALLOWED_VIDEO_MIMES: ['video/mp4', 'video/quicktime'],
} as const;
