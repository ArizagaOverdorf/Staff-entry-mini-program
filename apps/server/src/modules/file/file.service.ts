import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Readable } from 'stream';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import { IFileStorage } from './storage/storage.interface';
import { LocalStorage } from './storage/local.storage';
import { OssStorage } from './storage/oss.storage';

@Injectable()
export class FileService {
  private storage: IFileStorage;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly localStorage: LocalStorage,
    private readonly ossStorage: OssStorage,
  ) {
    this.storage =
      config.storageProvider === 'oss' ? ossStorage : localStorage;
  }

  async upload(
    file: Express.Multer.File,
    accountId?: string,
    accessLevel: 'private' | 'public' = 'private',
  ) {
    const ext = path.extname(file.originalname);
    const storedName = `${uuidv4()}${ext}`;
    const storagePath = await this.storage.save(
      file.buffer,
      storedName,
      file.mimetype,
    );

    const fileAsset = await this.prisma.fileAsset.create({
      data: {
        originalName: file.originalname,
        storedName,
        mimeType: file.mimetype,
        size: file.size,
        storageProvider: this.config.storageProvider,
        storagePath,
        accessLevel,
        uploadedByStaffAccountId: accountId || null,
      },
    });

    return {
      ...fileAsset,
      size: Number(fileAsset.size),
    };
  }

  async getPublicPreviewStream(
    fileId: string,
  ): Promise<{ stream: Readable; mimeType: string }> {
    const fileAsset = await this.prisma.fileAsset.findUniqueOrThrow({
      where: { id: fileId },
    });
    if (fileAsset.accessLevel !== 'public') {
      throw new ForbiddenException('Access denied');
    }

    const stream = await this.storage.getReadStream(fileAsset.storedName);
    return { stream, mimeType: fileAsset.mimeType };
  }

  async getPreviewStream(
    fileId: string,
    accountId: string,
  ): Promise<{ stream: Readable; mimeType: string }> {
    const fileAsset = await this.prisma.fileAsset.findUniqueOrThrow({
      where: { id: fileId },
    });
    if (fileAsset.accessLevel !== 'private') {
      const stream = await this.storage.getReadStream(fileAsset.storedName);
      return { stream, mimeType: fileAsset.mimeType };
    }

    if (fileAsset.uploadedByStaffAccountId === accountId) {
      const stream = await this.storage.getReadStream(fileAsset.storedName);
      return { stream, mimeType: fileAsset.mimeType };
    }

    // Legacy private files without uploader metadata are verified by credential link.
    const credentialFile = await this.prisma.staffCredentialFile.findFirst({
      where: { fileAssetId: fileId },
      include: {
        staffCredential: { select: { staffAccountId: true } },
      },
    });

    if (
      !credentialFile ||
      credentialFile.staffCredential.staffAccountId !== accountId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const stream = await this.storage.getReadStream(fileAsset.storedName);
    return { stream, mimeType: fileAsset.mimeType };
  }

  async getAdminPreviewStream(
    fileId: string,
  ): Promise<{ stream: Readable; mimeType: string }> {
    const fileAsset = await this.prisma.fileAsset.findUniqueOrThrow({
      where: { id: fileId },
    });
    const stream = await this.storage.getReadStream(fileAsset.storedName);
    return { stream, mimeType: fileAsset.mimeType };
  }

  async getFileStream(
    fileId: string,
  ): Promise<{ stream: any; mimeType: string }> {
    const fileAsset = await this.prisma.fileAsset.findUniqueOrThrow({
      where: { id: fileId },
    });
    const stream = await this.storage.getReadStream(fileAsset.storedName);
    return { stream, mimeType: fileAsset.mimeType };
  }
}
