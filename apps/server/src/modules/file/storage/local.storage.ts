import { Injectable } from '@nestjs/common';
import { createReadStream } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import { ConfigService } from '../../../config/config.service';
import { IFileStorage } from './storage.interface';

@Injectable()
export class LocalStorage implements IFileStorage {
  constructor(private readonly config: ConfigService) {}

  async save(buffer: Buffer, storedName: string): Promise<string> {
    const basePath = this.resolveBasePath();
    await mkdir(basePath, { recursive: true });

    const storagePath = this.resolveStoragePath(storedName);
    await writeFile(storagePath, buffer);
    return storagePath;
  }

  async getReadStream(storedName: string): Promise<Readable> {
    return createReadStream(this.resolveStoragePath(storedName));
  }

  private resolveBasePath(): string {
    const basePath = this.config.storageLocalBasePath;
    return path.isAbsolute(basePath)
      ? basePath
      : path.resolve(process.cwd(), basePath);
  }

  private resolveStoragePath(storedName: string): string {
    const safeName = path.basename(storedName);
    return path.join(this.resolveBasePath(), safeName);
  }
}
