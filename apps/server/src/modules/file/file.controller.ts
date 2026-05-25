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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileService } from './file.service';
import { FILE_LIMITS } from './file.constants';

@UseGuards(JwtAuthGuard)
@Controller('app/files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') accountId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!(FILE_LIMITS.ALLOWED_MIMES as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} not allowed. Allowed: ${FILE_LIMITS.ALLOWED_MIMES.join(', ')}`,
      );
    }
    if (file.size > FILE_LIMITS.MAX_SIZE) {
      throw new BadRequestException(
        `File size ${file.size} exceeds limit ${FILE_LIMITS.MAX_SIZE}`,
      );
    }
    return this.fileService.upload(file, accountId);
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
