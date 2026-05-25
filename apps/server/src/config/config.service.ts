import { Injectable } from '@nestjs/common';

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
    return process.env.ENCRYPTION_KEY || 'change_me_32bytes_base64';
  }

  get filePreviewUrlTtl(): number {
    return parseInt(process.env.FILE_PREVIEW_URL_TTL_SECONDS || '300', 10);
  }
}
