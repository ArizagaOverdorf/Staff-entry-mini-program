import { Injectable } from '@nestjs/common';

const DEFAULT_DEV_ENCRYPTION_KEY =
  'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';

@Injectable()
export class ConfigService {
  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  get databaseUrl(): string {
    return process.env.DATABASE_URL || '';
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'change_me';
  }

  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '7d';
  }

  get wechatAppId(): string {
    return process.env.WECHAT_APPID || '';
  }

  get wechatAppSecret(): string {
    return process.env.WECHAT_APPSECRET || '';
  }

  get storageProvider(): string {
    return process.env.STORAGE_PROVIDER || 'local';
  }

  get storageLocalBasePath(): string {
    return process.env.STORAGE_LOCAL_BASE_PATH || './uploads';
  }

  get encryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key === 'change_me_32bytes_base64') {
      return DEFAULT_DEV_ENCRYPTION_KEY;
    }
    return key;
  }

  get filePreviewUrlTtl(): number {
    return parseInt(process.env.FILE_PREVIEW_URL_TTL_SECONDS || '300', 10);
  }
}
