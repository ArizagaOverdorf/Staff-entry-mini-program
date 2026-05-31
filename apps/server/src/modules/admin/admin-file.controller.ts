import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  ForbiddenException,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { FileService } from '../file/file.service';
import { FILE_LIMITS } from '../file/file.constants';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Controller('admin/files')
export class AdminFileController {
  constructor(
    private readonly fileService: FileService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('upload')
  @RequirePermissions('staff.view')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimes: readonly string[] = [
      ...FILE_LIMITS.ALLOWED_MIMES,
      ...FILE_LIMITS.ALLOWED_VIDEO_MIMES,
    ];
    const originalName = (file.originalname || '').toLowerCase();
    const allowedDocumentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const isDocumentFallback =
      file.mimetype === 'application/octet-stream' &&
      allowedDocumentExts.some((ext) => originalName.endsWith(ext));
    if (!allowedMimes.includes(file.mimetype) && !isDocumentFallback) {
      throw new BadRequestException(
        `File type ${file.mimetype} not allowed. Allowed: ${allowedMimes.join(', ')}`,
      );
    }

    const isImage = (FILE_LIMITS.ALLOWED_IMAGE_MIMES as readonly string[]).includes(file.mimetype);
    const isVideo = (FILE_LIMITS.ALLOWED_VIDEO_MIMES as readonly string[]).includes(file.mimetype);
    const sizeLimit = isImage
      ? FILE_LIMITS.IMAGE_MAX_SIZE
      : isVideo
        ? FILE_LIMITS.VIDEO_MAX_SIZE
        : FILE_LIMITS.MAX_SIZE;
    if (file.size > sizeLimit) {
      throw new BadRequestException(
        `File size ${file.size} exceeds limit ${sizeLimit}`,
      );
    }

    return this.fileService.upload(file, undefined, 'public');
  }

  @Get(':fileId/preview')
  @RequirePermissions('staff.view', 'staff.audit')
  async preview(
    @Param('fileId') fileId: string,
    @CurrentAdmin('id') adminUserId: string,
    @Res() res: Response,
  ) {
    // Write operation log for sensitive file access
    const fileAsset = await this.prisma.fileAsset.findUnique({
      where: { id: fileId },
    });
    if (!fileAsset) {
      throw new ForbiddenException('File not found');
    }

    await this.prisma.operationLog.create({
      data: {
        operatorId: adminUserId,
        operatorType: 'admin',
        targetType: 'file_asset',
        targetId: fileId,
        action: 'file_preview',
        detail: `查看敏感文件: ${fileAsset.originalName}`,
      },
    });

    const { stream, mimeType } = await this.fileService.getAdminPreviewStream(fileId);
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'private, max-age=300',
    });
    stream.pipe(res);
  }
}
