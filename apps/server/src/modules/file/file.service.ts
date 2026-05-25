import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import { IFileStorage } from './storage/storage.interface';
import { LocalStorage } from './storage/local.storage';
import { OssStorage } from './storage/oss.storage';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private storage: IFileStorage;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly localStorage: LocalStorage,
    private readonly ossStorage: OssStorage,
  ) {
    this.storage = config.storageProvider === 'oss' ? ossStorage : localStorage;
  }

  async upload(file: Express.Multer.File) {
    const ext = path.extname(file.originalname);
    const storedName = `${uuidv4()}${ext}`;
    const storagePath = await this.storage.save(file.buffer, storedName, file.mimetype);

    return this.prisma.fileAsset.create({
      data: {
        originalName: file.originalname,
        storedName,
        mimeType: file.mimetype,
        size: file.size,
        storageProvider: this.config.storageProvider,
        storagePath,
        accessLevel: 'private',
      },
    });
  }

  async getPreviewStream(id: string) {
    const fileAsset = await this.prisma.fileAsset.findUniqueOrThrow({ where: { id } });
    const stream = await this.storage.getReadStream(fileAsset.storedName);
    return { stream, mimeType: fileAsset.mimeType };
  }
}
