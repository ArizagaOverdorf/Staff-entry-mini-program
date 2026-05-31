import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileService } from './file.service';
import { FILE_LIMITS } from './file.constants';
import { Public } from '../../common/decorators/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('app/files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') accountId: string,
    @Body('purpose') purpose?: string,
  ) {
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
    const accessLevel =
      purpose === 'avatar' || purpose === 'support_media' ? 'public' : 'private';
    return this.fileService.upload(file, accountId, accessLevel);
  }

  @Public()
  @Get('public/:fileId/preview')
  async publicPreview(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const { stream, mimeType } =
      await this.fileService.getPublicPreviewStream(fileId);
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=300',
    });
    stream.pipe(res);
  }

  @Get(':fileId/preview')
  async preview(
    @Param('fileId') fileId: string,
    @CurrentUser('id') accountId: string,
    @Res() res: Response,
  ) {
    const { stream, mimeType } = await this.fileService.getPreviewStream(
      fileId,
      accountId,
    );
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'private, max-age=300',
    });
    stream.pipe(res);
  }
}
