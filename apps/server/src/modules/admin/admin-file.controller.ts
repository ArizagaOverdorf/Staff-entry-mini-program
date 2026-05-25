import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { FileService } from '../file/file.service';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Controller('admin/files')
export class AdminFileController {
  constructor(
    private readonly fileService: FileService,
    private readonly prisma: PrismaService,
  ) {}

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
